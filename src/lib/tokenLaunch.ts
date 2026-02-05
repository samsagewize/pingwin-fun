import {
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import {
  createAssociatedTokenAccountInstruction,
  createInitializeMintInstruction,
  createMintToInstruction,
  getAssociatedTokenAddressSync,
  MINT_SIZE,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { getConnection } from "@/lib/solana";

export type LaunchResult = {
  mint: string;
  ata: string;
  signature: string;
};

export function defaultTestToken() {
  const symbol = "PWIN"; // stable default for first run
  const name = "PingWin Test Chip";
  return {
    name,
    symbol,
    decimals: 6,
    // 1B tokens w/ 6 decimals => 1_000_000_000_000_000 units
    supplyUi: 1_000_000_000,
  };
}

export async function launchMintToConnectedWallet(args: {
  payer: PublicKey;
  // provider is Phantom-like with signAndSendTransaction
  signAndSendTransaction: (tx: Transaction) => Promise<{ signature: string }>;
  decimals: number;
  supplyUi: number;
  treasury?: PublicKey;
  createFeeLamports?: bigint;
}): Promise<LaunchResult> {
  const {
    payer,
    signAndSendTransaction,
    decimals,
    supplyUi,
    treasury,
    createFeeLamports,
  } = args;
  const connection = getConnection();

  const mintKeypair = Keypair.generate();
  const mint = mintKeypair.publicKey;

  const lamportsForMint = await connection.getMinimumBalanceForRentExemption(
    MINT_SIZE,
  );

  const ata = getAssociatedTokenAddressSync(mint, payer, false, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID);

  const createMintAccountIx = SystemProgram.createAccount({
    fromPubkey: payer,
    newAccountPubkey: mint,
    lamports: lamportsForMint,
    space: MINT_SIZE,
    programId: TOKEN_PROGRAM_ID,
  });

  const initMintIx = createInitializeMintInstruction(
    mint,
    decimals,
    payer, // mint authority
    payer, // freeze authority (can set to null later)
    TOKEN_PROGRAM_ID,
  );

  const createAtaIx = createAssociatedTokenAccountInstruction(
    payer,
    ata,
    payer,
    mint,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID,
  );

  const supplyBaseUnits = BigInt(Math.trunc(supplyUi)) * BigInt(10 ** decimals);

  const mintToIx = createMintToInstruction(
    mint,
    ata,
    payer,
    supplyBaseUnits,
    [],
    TOKEN_PROGRAM_ID,
  );

  const { blockhash, lastValidBlockHeight } =
    await connection.getLatestBlockhash("confirmed");

  const tx = new Transaction({
    feePayer: payer,
    recentBlockhash: blockhash,
  });

  if (treasury && createFeeLamports && createFeeLamports > 0n) {
    // If payer == treasury, this is effectively a no-op transfer (but still costs a tx fee).
    // We skip to avoid unnecessary instruction noise.
    if (!payer.equals(treasury)) {
      tx.add(
        SystemProgram.transfer({
          fromPubkey: payer,
          toPubkey: treasury,
          lamports: Number(createFeeLamports),
        }),
      );
    }
  }

  tx.add(createMintAccountIx, initMintIx, createAtaIx, mintToIx);

  // mint account must sign (it is being created)
  tx.partialSign(mintKeypair);

  const { signature } = await signAndSendTransaction(tx);

  // confirm
  await connection.confirmTransaction(
    { signature, blockhash, lastValidBlockHeight },
    "confirmed",
  );

  return { mint: mint.toBase58(), ata: ata.toBase58(), signature };
}
