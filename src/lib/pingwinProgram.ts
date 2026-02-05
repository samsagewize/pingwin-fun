import { BN, BorshCoder, EventParser } from "@coral-xyz/anchor";
import { Connection, PublicKey, SystemProgram, TransactionInstruction } from "@solana/web3.js";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import { getConnection } from "@/lib/solana";

export type Cluster = "localnet" | "devnet" | "mainnet";

export function getCluster(): Cluster {
  const c = (process.env.NEXT_PUBLIC_SOLANA_CLUSTER || "mainnet").toLowerCase();
  if (c === "devnet") return "devnet";
  if (c === "localnet") return "localnet";
  return "mainnet";
}

export function getProgramId(): PublicKey {
  const cluster = getCluster();
  const env =
    cluster === "devnet"
      ? process.env.NEXT_PUBLIC_PINGWIN_PROGRAM_ID_DEVNET
      : cluster === "localnet"
        ? process.env.NEXT_PUBLIC_PINGWIN_PROGRAM_ID_LOCALNET
        : process.env.NEXT_PUBLIC_PINGWIN_PROGRAM_ID_MAINNET;

  // Fallback to a placeholder so UI can render without crashing.
  return new PublicKey(env || "PWin111111111111111111111111111111111111111");
}

// Minimal IDL subset used by the client.
export const PINGWIN_IDL: unknown = {
  version: "0.1.0",
  name: "pingwin_fun",
  instructions: [
    {
      name: "createLaunch",
      accounts: [
        { name: "creator", isMut: true, isSigner: true },
        { name: "devWallet", isMut: true, isSigner: false },
        { name: "launch", isMut: true, isSigner: false },
        { name: "mint", isMut: true, isSigner: true },
        { name: "vault", isMut: true, isSigner: false },
        { name: "tokenProgram", isMut: false, isSigner: false },
        { name: "associatedTokenProgram", isMut: false, isSigner: false },
        { name: "systemProgram", isMut: false, isSigner: false },
        { name: "rent", isMut: false, isSigner: false },
      ],
      args: [
        { name: "feeBps", type: "u16" },
        { name: "initialTokenReserve", type: "u64" },
      ],
    },
    {
      name: "buy",
      accounts: [
        { name: "user", isMut: true, isSigner: true },
        { name: "devWallet", isMut: true, isSigner: false },
        { name: "launch", isMut: true, isSigner: false },
        { name: "mint", isMut: false, isSigner: false },
        { name: "vault", isMut: true, isSigner: false },
        { name: "userAta", isMut: true, isSigner: false },
        { name: "tokenProgram", isMut: false, isSigner: false },
        { name: "associatedTokenProgram", isMut: false, isSigner: false },
        { name: "systemProgram", isMut: false, isSigner: false },
        { name: "rent", isMut: false, isSigner: false },
      ],
      args: [
        {
          name: "args",
          type: {
            defined: "TradeArgs",
          },
        },
      ],
    },
    {
      name: "sell",
      accounts: [
        { name: "user", isMut: true, isSigner: true },
        { name: "devWallet", isMut: true, isSigner: false },
        { name: "launch", isMut: true, isSigner: false },
        { name: "mint", isMut: false, isSigner: false },
        { name: "vault", isMut: true, isSigner: false },
        { name: "userAta", isMut: true, isSigner: false },
        { name: "tokenProgram", isMut: false, isSigner: false },
        { name: "systemProgram", isMut: false, isSigner: false },
      ],
      args: [
        {
          name: "args",
          type: {
            defined: "TradeArgs",
          },
        },
      ],
    },
  ],
  accounts: [
    {
      name: "Launch",
      type: {
        kind: "struct",
        fields: [
          { name: "bump", type: "u8" },
          { name: "mint", type: "publicKey" },
          { name: "vault", type: "publicKey" },
          { name: "devWallet", type: "publicKey" },
          { name: "creator", type: "publicKey" },
          { name: "feeBps", type: "u16" },
          { name: "graduated", type: "bool" },
          { name: "solReserve", type: "u64" },
          { name: "tokenReserve", type: "u64" },
        ],
      },
    },
  ],
  types: [
    {
      name: "TradeArgs",
      type: {
        kind: "struct",
        fields: [
          { name: "amountIn", type: "u64" },
          { name: "minAmountOut", type: "u64" },
        ],
      },
    },
  ],
  events: [
    {
      name: "LaunchCreated",
      fields: [
        { name: "launch", type: "publicKey", index: false },
        { name: "mint", type: "publicKey", index: false },
        { name: "vault", type: "publicKey", index: false },
        { name: "creator", type: "publicKey", index: false },
        { name: "devWallet", type: "publicKey", index: false },
        { name: "feeBps", type: "u16", index: false },
        { name: "tokenReserve", type: "u64", index: false },
        { name: "solReserve", type: "u64", index: false },
      ],
    },
    {
      name: "Bought",
      fields: [
        { name: "launch", type: "publicKey", index: false },
        { name: "user", type: "publicKey", index: false },
        { name: "solIn", type: "u64", index: false },
        { name: "feeLamports", type: "u64", index: false },
        { name: "tokensOut", type: "u64", index: false },
        { name: "solReserve", type: "u64", index: false },
        { name: "tokenReserve", type: "u64", index: false },
        { name: "graduated", type: "bool", index: false },
      ],
    },
    {
      name: "Sold",
      fields: [
        { name: "launch", type: "publicKey", index: false },
        { name: "user", type: "publicKey", index: false },
        { name: "tokensIn", type: "u64", index: false },
        { name: "solOutGross", type: "u64", index: false },
        { name: "feeLamports", type: "u64", index: false },
        { name: "solOutNet", type: "u64", index: false },
        { name: "solReserve", type: "u64", index: false },
        { name: "tokenReserve", type: "u64", index: false },
        { name: "graduated", type: "bool", index: false },
      ],
    },
  ],
} as const;

export function getCoder() {
  return new BorshCoder(PINGWIN_IDL);
}

export function findLaunchPda(mint: PublicKey) {
  const programId = getProgramId();
  return PublicKey.findProgramAddressSync(
    [Buffer.from("launch"), mint.toBuffer()],
    programId,
  );
}

export function deriveVaultAta(mint: PublicKey, launchPda: PublicKey) {
  return getAssociatedTokenAddressSync(
    mint,
    launchPda,
    true,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID,
  );
}

// getProgram() removed in MVP client (we encode instructions + parse events manually).

export type LaunchAccount = {
  bump: number;
  mint: PublicKey;
  vault: PublicKey;
  devWallet: PublicKey;
  creator: PublicKey;
  feeBps: number;
  graduated: boolean;
  solReserve: BN;
  tokenReserve: BN;
};

export async function fetchLaunch(mint: PublicKey, connection?: Connection) {
  const conn = connection || getConnection();
  const [launchPda] = findLaunchPda(mint);
  const acc = await conn.getAccountInfo(launchPda, "confirmed");
  if (!acc) return null;
  const coder = getCoder();
  const decoded = coder.accounts.decode("Launch", acc.data) as unknown;
  return {
    publicKey: launchPda,
    account: decoded as LaunchAccount,
  };
}

export function currentPriceLamportsPerToken(launch: LaunchAccount) {
  // Same virtual reserves as program constants.
  const vSol = 100_000_000n;
  const vTok = 1_000_000_000_000_000n;
  const sol = BigInt(launch.solReserve.toString());
  const tok = BigInt(launch.tokenReserve.toString());
  const x = sol + vSol;
  const y = tok + vTok;
  // Price ~ x/y lamports per base unit.
  // (Base unit: 10^-6 token). Convert to lamports per 1 token (UI) by multiplying by 1e6.
  const priceLamportsPerBase = (x * 1_000_000_000_000n) / y; // scaled 1e12 for precision
  return priceLamportsPerBase;
}

export async function fetchLaunchEvents(mint: PublicKey, limit = 50) {
  const conn = getConnection();
  const programId = getProgramId();
  const [launchPda] = findLaunchPda(mint);

  const sigs = await conn.getSignaturesForAddress(launchPda, { limit });
  const coder = getCoder();
  const parser = new EventParser(programId, coder);

  const out: Array<{ slot: number; sig: string; name: string; data: unknown }> = [];

  for (const s of sigs) {
    const tx = await conn.getTransaction(s.signature, {
      commitment: "confirmed",
      maxSupportedTransactionVersion: 0,
    });
    const logs = tx?.meta?.logMessages;
    if (!logs) continue;
    for (const evt of parser.parseLogs(logs)) {
      out.push({
        slot: tx!.slot,
        sig: s.signature,
        name: evt.name,
        data: evt.data,
      });
    }
  }

  out.sort((a, b) => a.slot - b.slot);
  return out;
}

export function ixCreateLaunch(args: {
  creator: PublicKey;
  devWallet: PublicKey;
  mint: PublicKey;
  feeBps: number;
  initialTokenReserve: bigint;
}) {
  const programId = getProgramId();
  const coder = getCoder();
  const [launchPda] = findLaunchPda(args.mint);
  const vault = deriveVaultAta(args.mint, launchPda);

  const data = coder.instruction.encode("createLaunch", {
    feeBps: args.feeBps,
    initialTokenReserve: new BN(args.initialTokenReserve.toString()),
  });

  const keys = [
    { pubkey: args.creator, isSigner: true, isWritable: true },
    { pubkey: args.devWallet, isSigner: false, isWritable: true },
    { pubkey: launchPda, isSigner: false, isWritable: true },
    { pubkey: args.mint, isSigner: true, isWritable: true },
    { pubkey: vault, isSigner: false, isWritable: true },
    { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    { pubkey: PublicKey.default, isSigner: false, isWritable: false }, // rent sysvar (placeholder, replaced below)
  ];

  keys[keys.length - 1] = {
    pubkey: new PublicKey("SysvarRent111111111111111111111111111111111"),
    isSigner: false,
    isWritable: false,
  };

  return {
    launchPda,
    vault,
    ix: new TransactionInstruction({ programId, keys, data }),
  };
}

export function ixBuy(args: {
  user: PublicKey;
  devWallet: PublicKey;
  mint: PublicKey;
  amountInLamports: bigint;
  minTokensOut: bigint;
}) {
  const programId = getProgramId();
  const coder = getCoder();
  const [launchPda] = findLaunchPda(args.mint);
  const vault = deriveVaultAta(args.mint, launchPda);
  const userAta = getAssociatedTokenAddressSync(args.mint, args.user);

  const data = coder.instruction.encode("buy", {
    args: {
      amountIn: new BN(args.amountInLamports.toString()),
      minAmountOut: new BN(args.minTokensOut.toString()),
    },
  });

  const keys = [
    { pubkey: args.user, isSigner: true, isWritable: true },
    { pubkey: args.devWallet, isSigner: false, isWritable: true },
    { pubkey: launchPda, isSigner: false, isWritable: true },
    { pubkey: args.mint, isSigner: false, isWritable: false },
    { pubkey: vault, isSigner: false, isWritable: true },
    { pubkey: userAta, isSigner: false, isWritable: true },
    { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    { pubkey: new PublicKey("SysvarRent111111111111111111111111111111111"), isSigner: false, isWritable: false },
  ];

  return new TransactionInstruction({ programId, keys, data });
}

export function ixSell(args: {
  user: PublicKey;
  devWallet: PublicKey;
  mint: PublicKey;
  amountInTokens: bigint;
  minSolOutLamports: bigint;
}) {
  const programId = getProgramId();
  const coder = getCoder();
  const [launchPda] = findLaunchPda(args.mint);
  const vault = deriveVaultAta(args.mint, launchPda);
  const userAta = getAssociatedTokenAddressSync(args.mint, args.user);

  const data = coder.instruction.encode("sell", {
    args: {
      amountIn: new BN(args.amountInTokens.toString()),
      minAmountOut: new BN(args.minSolOutLamports.toString()),
    },
  });

  const keys = [
    { pubkey: args.user, isSigner: true, isWritable: true },
    { pubkey: args.devWallet, isSigner: false, isWritable: true },
    { pubkey: launchPda, isSigner: false, isWritable: true },
    { pubkey: args.mint, isSigner: false, isWritable: false },
    { pubkey: vault, isSigner: false, isWritable: true },
    { pubkey: userAta, isSigner: false, isWritable: true },
    { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
  ];

  return new TransactionInstruction({ programId, keys, data });
}
