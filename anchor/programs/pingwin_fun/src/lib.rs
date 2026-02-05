use anchor_lang::prelude::*;
use anchor_lang::system_program;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{self, Mint, MintTo, Token, TokenAccount, Transfer};

// NOTE: Replace with `anchor keys list` output after `anchor keys sync`.
declare_id!("PWin111111111111111111111111111111111111111");

pub const MAX_FEE_BPS: u16 = 1_000; // 10%
pub const BOND_TARGET_LAMPORTS: u64 = 100_000_000_000; // 100 SOL

// Virtual reserves make the first buys extremely cheap.
// These are *added* to actual reserves for pricing, but are not withdrawable.
pub const VIRTUAL_SOL_LAMPORTS: u64 = 100_000_000; // 0.1 SOL
pub const VIRTUAL_TOKEN_BASE_UNITS: u64 = 1_000_000_000_000_000; // 1B tokens @ 6 decimals

#[program]
pub mod pingwin_fun {
    use super::*;

    pub fn create_launch(ctx: Context<CreateLaunch>, args: CreateLaunchArgs) -> Result<()> {
        require!(args.fee_bps <= MAX_FEE_BPS, ErrorCode::FeeTooHigh);

        let launch = &mut ctx.accounts.launch;

        launch.bump = ctx.bumps.launch;
        launch.mint = ctx.accounts.mint.key();
        launch.vault = ctx.accounts.vault.key();
        launch.dev_wallet = ctx.accounts.dev_wallet.key();
        launch.creator = ctx.accounts.creator.key();
        launch.fee_bps = args.fee_bps;

        // Set initial actual reserves.
        launch.sol_reserve = 0;
        launch.token_reserve = args.initial_token_reserve;
        launch.graduated = false;

        // Mint initial supply into the vault.
        // Mint authority is the launch PDA.
        let signer_seeds: &[&[&[u8]]] = &[&[
            b"launch",
            ctx.accounts.mint.key().as_ref(),
            &[ctx.bumps.launch],
        ]];

        let cpi = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            MintTo {
                mint: ctx.accounts.mint.to_account_info(),
                to: ctx.accounts.vault.to_account_info(),
                authority: ctx.accounts.launch.to_account_info(),
            },
            signer_seeds,
        );
        token::mint_to(cpi, args.initial_token_reserve)?;

        emit!(LaunchCreated {
            launch: launch.key(),
            mint: launch.mint,
            vault: launch.vault,
            creator: launch.creator,
            dev_wallet: launch.dev_wallet,
            fee_bps: launch.fee_bps,
            token_reserve: launch.token_reserve,
            sol_reserve: launch.sol_reserve,
        });

        Ok(())
    }

    pub fn buy(ctx: Context<Buy>, args: TradeArgs) -> Result<()> {
        require!(!ctx.accounts.launch.graduated, ErrorCode::AlreadyGraduated);
        require!(args.amount_in > 0, ErrorCode::ZeroAmount);

        let launch = &mut ctx.accounts.launch;
        require_keys_eq!(launch.mint, ctx.accounts.mint.key(), ErrorCode::BadMint);
        require_keys_eq!(launch.vault, ctx.accounts.vault.key(), ErrorCode::BadVault);

        // Transfer SOL in.
        system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                system_program::Transfer {
                    from: ctx.accounts.user.to_account_info(),
                    to: launch.to_account_info(),
                },
            ),
            args.amount_in,
        )?;

        // Fee on SOL in.
        let fee_lamports = mul_div_u64(args.amount_in, launch.fee_bps as u64, 10_000)?;
        if fee_lamports > 0 {
            **launch.to_account_info().try_borrow_mut_lamports()? = launch
                .to_account_info()
                .lamports()
                .checked_sub(fee_lamports)
                .ok_or(ErrorCode::MathOverflow)?;
            **ctx
                .accounts
                .dev_wallet
                .to_account_info()
                .try_borrow_mut_lamports()? = ctx
                .accounts
                .dev_wallet
                .to_account_info()
                .lamports()
                .checked_add(fee_lamports)
                .ok_or(ErrorCode::MathOverflow)?;
        }

        let sol_in_post_fee = args
            .amount_in
            .checked_sub(fee_lamports)
            .ok_or(ErrorCode::MathOverflow)?;

        let (tokens_out, new_sol_reserve, new_token_reserve) = quote_buy(
            launch.sol_reserve,
            launch.token_reserve,
            sol_in_post_fee,
        )?;

        require!(tokens_out >= args.min_amount_out, ErrorCode::SlippageExceeded);

        // Transfer tokens from vault -> user ATA.
        let signer_seeds: &[&[&[u8]]] = &[&[
            b"launch",
            ctx.accounts.mint.key().as_ref(),
            &[launch.bump],
        ]];
        let cpi = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.vault.to_account_info(),
                to: ctx.accounts.user_ata.to_account_info(),
                authority: launch.to_account_info(),
            },
            signer_seeds,
        );
        token::transfer(cpi, tokens_out)?;

        launch.sol_reserve = new_sol_reserve;
        launch.token_reserve = new_token_reserve;
        if launch.sol_reserve >= BOND_TARGET_LAMPORTS {
            launch.graduated = true;
        }

        emit!(Bought {
            launch: launch.key(),
            user: ctx.accounts.user.key(),
            sol_in: args.amount_in,
            fee_lamports,
            tokens_out,
            sol_reserve: launch.sol_reserve,
            token_reserve: launch.token_reserve,
            graduated: launch.graduated,
        });

        Ok(())
    }

    pub fn sell(ctx: Context<Sell>, args: TradeArgs) -> Result<()> {
        require!(args.amount_in > 0, ErrorCode::ZeroAmount);

        let launch = &mut ctx.accounts.launch;
        require_keys_eq!(launch.mint, ctx.accounts.mint.key(), ErrorCode::BadMint);
        require_keys_eq!(launch.vault, ctx.accounts.vault.key(), ErrorCode::BadVault);

        // Transfer tokens in.
        let cpi = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.user_ata.to_account_info(),
                to: ctx.accounts.vault.to_account_info(),
                authority: ctx.accounts.user.to_account_info(),
            },
        );
        token::transfer(cpi, args.amount_in)?;

        let (sol_out_gross, new_sol_reserve, new_token_reserve) =
            quote_sell(launch.sol_reserve, launch.token_reserve, args.amount_in)?;

        let fee_lamports = mul_div_u64(sol_out_gross, launch.fee_bps as u64, 10_000)?;
        let sol_out_net = sol_out_gross
            .checked_sub(fee_lamports)
            .ok_or(ErrorCode::MathOverflow)?;

        require!(sol_out_net >= args.min_amount_out, ErrorCode::SlippageExceeded);

        // Pay user + dev from launch PDA's lamports.
        // Keep rent-exemption safety: do not drain launch below rent.
        let rent_min = Rent::get()?.minimum_balance(8 + Launch::INIT_SPACE);
        let available = launch
            .to_account_info()
            .lamports()
            .checked_sub(rent_min)
            .ok_or(ErrorCode::InsufficientLiquidity)?;
        require!(available >= sol_out_gross, ErrorCode::InsufficientLiquidity);

        **launch.to_account_info().try_borrow_mut_lamports()? = launch
            .to_account_info()
            .lamports()
            .checked_sub(sol_out_gross)
            .ok_or(ErrorCode::MathOverflow)?;
        **ctx.accounts.user.to_account_info().try_borrow_mut_lamports()? = ctx
            .accounts
            .user
            .to_account_info()
            .lamports()
            .checked_add(sol_out_net)
            .ok_or(ErrorCode::MathOverflow)?;
        if fee_lamports > 0 {
            **ctx
                .accounts
                .dev_wallet
                .to_account_info()
                .try_borrow_mut_lamports()? = ctx
                .accounts
                .dev_wallet
                .to_account_info()
                .lamports()
                .checked_add(fee_lamports)
                .ok_or(ErrorCode::MathOverflow)?;
        }

        launch.sol_reserve = new_sol_reserve;
        launch.token_reserve = new_token_reserve;
        if launch.sol_reserve >= BOND_TARGET_LAMPORTS {
            launch.graduated = true;
        }

        emit!(Sold {
            launch: launch.key(),
            user: ctx.accounts.user.key(),
            tokens_in: args.amount_in,
            sol_out_gross,
            fee_lamports,
            sol_out_net,
            sol_reserve: launch.sol_reserve,
            token_reserve: launch.token_reserve,
            graduated: launch.graduated,
        });

        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(args: CreateLaunchArgs)]
pub struct CreateLaunch<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,

    /// CHECK: fee destination; must be a system account
    #[account(mut, owner = system_program::ID)]
    pub dev_wallet: UncheckedAccount<'info>,

    #[account(
        init,
        payer = creator,
        space = 8 + Launch::INIT_SPACE,
        seeds = [b"launch", mint.key().as_ref()],
        bump
    )]
    pub launch: Account<'info, Launch>,

    #[account(
        init,
        payer = creator,
        mint::decimals = 6,
        mint::authority = launch,
        mint::freeze_authority = launch
    )]
    pub mint: Account<'info, Mint>,

    #[account(
        init,
        payer = creator,
        associated_token::mint = mint,
        associated_token::authority = launch
    )]
    pub vault: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct Buy<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    /// CHECK: fee destination; must be system account
    #[account(mut, owner = system_program::ID)]
    pub dev_wallet: UncheckedAccount<'info>,

    #[account(
        mut,
        seeds = [b"launch", mint.key().as_ref()],
        bump = launch.bump,
        has_one = mint,
        has_one = vault,
    )]
    pub launch: Account<'info, Launch>,

    pub mint: Account<'info, Mint>,

    #[account(mut)]
    pub vault: Account<'info, TokenAccount>,

    #[account(
        init_if_needed,
        payer = user,
        associated_token::mint = mint,
        associated_token::authority = user
    )]
    pub user_ata: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct Sell<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    /// CHECK: fee destination; must be system account
    #[account(mut, owner = system_program::ID)]
    pub dev_wallet: UncheckedAccount<'info>,

    #[account(
        mut,
        seeds = [b"launch", mint.key().as_ref()],
        bump = launch.bump,
        has_one = mint,
        has_one = vault,
    )]
    pub launch: Account<'info, Launch>,

    pub mint: Account<'info, Mint>,

    #[account(mut)]
    pub vault: Account<'info, TokenAccount>,

    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = user
    )]
    pub user_ata: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[account]
#[derive(InitSpace)]
pub struct Launch {
    pub bump: u8,
    pub mint: Pubkey,
    pub vault: Pubkey,
    pub dev_wallet: Pubkey,
    pub creator: Pubkey,
    pub fee_bps: u16,
    pub graduated: bool,
    pub sol_reserve: u64,
    pub token_reserve: u64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct CreateLaunchArgs {
    pub fee_bps: u16,
    pub initial_token_reserve: u64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct TradeArgs {
    /// amount_in for buy is lamports; amount_in for sell is token base units.
    pub amount_in: u64,
    pub min_amount_out: u64,
}

#[event]
pub struct LaunchCreated {
    pub launch: Pubkey,
    pub mint: Pubkey,
    pub vault: Pubkey,
    pub creator: Pubkey,
    pub dev_wallet: Pubkey,
    pub fee_bps: u16,
    pub token_reserve: u64,
    pub sol_reserve: u64,
}

#[event]
pub struct Bought {
    pub launch: Pubkey,
    pub user: Pubkey,
    pub sol_in: u64,
    pub fee_lamports: u64,
    pub tokens_out: u64,
    pub sol_reserve: u64,
    pub token_reserve: u64,
    pub graduated: bool,
}

#[event]
pub struct Sold {
    pub launch: Pubkey,
    pub user: Pubkey,
    pub tokens_in: u64,
    pub sol_out_gross: u64,
    pub fee_lamports: u64,
    pub sol_out_net: u64,
    pub sol_reserve: u64,
    pub token_reserve: u64,
    pub graduated: bool,
}

fn quote_buy(sol_reserve: u64, token_reserve: u64, sol_in: u64) -> Result<(u64, u64, u64)> {
    // x = sol_reserve + v_sol; y = token_reserve + v_token
    let x0 = (sol_reserve as u128)
        .checked_add(VIRTUAL_SOL_LAMPORTS as u128)
        .ok_or(ErrorCode::MathOverflow)?;
    let y0 = (token_reserve as u128)
        .checked_add(VIRTUAL_TOKEN_BASE_UNITS as u128)
        .ok_or(ErrorCode::MathOverflow)?;

    let k = x0.checked_mul(y0).ok_or(ErrorCode::MathOverflow)?;
    let x1 = x0
        .checked_add(sol_in as u128)
        .ok_or(ErrorCode::MathOverflow)?;
    require!(x1 > 0, ErrorCode::MathOverflow);

    let y1 = k.checked_div(x1).ok_or(ErrorCode::MathOverflow)?;
    require!(y0 >= y1, ErrorCode::MathOverflow);

    let dy = y0.checked_sub(y1).ok_or(ErrorCode::MathOverflow)?;

    // dy is how many tokens leave (including virtual portion). We can only send up to actual reserves.
    let tokens_out = dy.min(token_reserve as u128) as u64;
    require!(tokens_out > 0, ErrorCode::TooSmall);

    let new_sol_reserve = sol_reserve
        .checked_add(sol_in)
        .ok_or(ErrorCode::MathOverflow)?;
    let new_token_reserve = token_reserve
        .checked_sub(tokens_out)
        .ok_or(ErrorCode::MathOverflow)?;

    Ok((tokens_out, new_sol_reserve, new_token_reserve))
}

fn quote_sell(sol_reserve: u64, token_reserve: u64, tokens_in: u64) -> Result<(u64, u64, u64)> {
    let x0 = (sol_reserve as u128)
        .checked_add(VIRTUAL_SOL_LAMPORTS as u128)
        .ok_or(ErrorCode::MathOverflow)?;
    let y0 = (token_reserve as u128)
        .checked_add(VIRTUAL_TOKEN_BASE_UNITS as u128)
        .ok_or(ErrorCode::MathOverflow)?;
    let k = x0.checked_mul(y0).ok_or(ErrorCode::MathOverflow)?;

    let y1 = y0
        .checked_add(tokens_in as u128)
        .ok_or(ErrorCode::MathOverflow)?;

    let x1 = k.checked_div(y1).ok_or(ErrorCode::MathOverflow)?;
    require!(x0 >= x1, ErrorCode::MathOverflow);

    let dx = x0.checked_sub(x1).ok_or(ErrorCode::MathOverflow)?;
    let sol_out_gross = dx.min(sol_reserve as u128) as u64;
    require!(sol_out_gross > 0, ErrorCode::TooSmall);

    let new_sol_reserve = sol_reserve
        .checked_sub(sol_out_gross)
        .ok_or(ErrorCode::MathOverflow)?;
    let new_token_reserve = token_reserve
        .checked_add(tokens_in)
        .ok_or(ErrorCode::MathOverflow)?;

    Ok((sol_out_gross, new_sol_reserve, new_token_reserve))
}

fn mul_div_u64(a: u64, b: u64, denom: u64) -> Result<u64> {
    require!(denom > 0, ErrorCode::MathOverflow);
    let out = (a as u128)
        .checked_mul(b as u128)
        .ok_or(ErrorCode::MathOverflow)?
        .checked_div(denom as u128)
        .ok_or(ErrorCode::MathOverflow)?;
    Ok(out as u64)
}

#[error_code]
pub enum ErrorCode {
    #[msg("Fee bps too high")]
    FeeTooHigh,
    #[msg("Math overflow")]
    MathOverflow,
    #[msg("Slippage exceeded")]
    SlippageExceeded,
    #[msg("Insufficient liquidity")]
    InsufficientLiquidity,
    #[msg("Bad mint")]
    BadMint,
    #[msg("Bad vault")]
    BadVault,
    #[msg("Zero amount")]
    ZeroAmount,
    #[msg("Trade too small")]
    TooSmall,
    #[msg("Launch already graduated")]
    AlreadyGraduated,
}
