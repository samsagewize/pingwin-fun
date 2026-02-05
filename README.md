# PINGWIN.FUN

Meme-casino launchpad (UI-first scaffold).

## Stack
- Next.js (App Router) + TypeScript
- Tailwind CSS v4 (CSS-first theme tokens in `src/app/globals.css`)

## Dev

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Notes
- Current pages: `/`, `/explore`, `/create`, `/profile`, `/launch/[id]`
- Wallet connect: Wallet Standard (Phantom / Solflare)
- Bonding curve is implemented as an **Anchor program** in `./anchor`.

## RPC (important)
If you see `403 {"message":"Access forbidden"}` from JSON-RPC, your environment is being blocked by the public Solana RPC.

Set a dedicated RPC in Vercel (recommended):
- `NEXT_PUBLIC_SOLANA_RPC_URL` (browser)
- `SOLANA_RPC_URL` (server)

Examples:
- Helius: `https://mainnet.helius-rpc.com/?api-key=...`
- Ankr: `https://rpc.ankr.com/solana`

## Cluster / Program config

Create `.env.local`:

```bash
# one of: localnet | devnet | mainnet
NEXT_PUBLIC_SOLANA_CLUSTER=devnet

# optional override (otherwise defaults by cluster)
# NEXT_PUBLIC_SOLANA_RPC_URL=...

# Program IDs per cluster
NEXT_PUBLIC_PINGWIN_PROGRAM_ID_LOCALNET=...
NEXT_PUBLIC_PINGWIN_PROGRAM_ID_DEVNET=...
NEXT_PUBLIC_PINGWIN_PROGRAM_ID_MAINNET=...

# Where fees go (defaults to your connected wallet if unset)
NEXT_PUBLIC_PINGWIN_DEV_WALLET=...
```

## Anchor program (localnet/devnet)

Prereqs:
- `solana` CLI
- `anchor` CLI

### Localnet

```bash
# 1) terminal A
solana-test-validator

# 2) terminal B
cd anchor
anchor keys sync
anchor build
anchor deploy
```

After deploy:
- Copy the deployed program id into `NEXT_PUBLIC_PINGWIN_PROGRAM_ID_LOCALNET`
- Also update `declare_id!()` in `anchor/programs/pingwin_fun/src/lib.rs` (or re-run `anchor keys sync` and rebuild).

Run UI:

```bash
npm run dev
```

Open:
- http://localhost:3000/create → create a launch
- then visit /launch/<mint>

### Devnet

```bash
solana config set --url https://api.devnet.solana.com
cd anchor
anchor keys sync
anchor build
anchor deploy --provider.cluster devnet
```

Set `NEXT_PUBLIC_SOLANA_CLUSTER=devnet` and `NEXT_PUBLIC_PINGWIN_PROGRAM_ID_DEVNET`.

## Safety notes
- Fee bps capped at 10% on-chain
- Slippage parameters are supported by the program (`min_amount_out`), but the UI currently sets them to 0 for MVP.
- Launch PDA retains rent-exempt lamports during sells.
