import {
  Connection,
  PublicKey,
  Transaction,
  VersionedTransaction,
} from "@solana/web3.js";

export const DEFAULT_MAINNET_RPC = "https://api.mainnet-beta.solana.com";
export const DEFAULT_DEVNET_RPC = "https://api.devnet.solana.com";
export const DEFAULT_LOCALNET_RPC = "http://127.0.0.1:8899";

function getRpcUrl() {
  // Vercel/browser-origin traffic to the public Solana RPC can return 403.
  // Prefer a dedicated RPC (Helius/QuickNode/Alchemy/Ankr/etc) via env.
  const explicit = process.env.NEXT_PUBLIC_SOLANA_RPC_URL;
  if (explicit) return explicit;

  const cluster = (process.env.NEXT_PUBLIC_SOLANA_CLUSTER || "mainnet").toLowerCase();
  if (cluster === "devnet") return DEFAULT_DEVNET_RPC;
  if (cluster === "localnet") return DEFAULT_LOCALNET_RPC;
  return DEFAULT_MAINNET_RPC;
}

export function getConnection() {
  return new Connection(getRpcUrl(), {
    commitment: "confirmed",
    confirmTransactionInitialTimeout: 60_000,
  });
}

type AnyTx = Transaction | VersionedTransaction;

type SendOpts = {
  preflightCommitment?: "processed" | "confirmed" | "finalized";
};

export type PhantomProvider = {
  isPhantom?: boolean;
  publicKey?: PublicKey;
  connect: (opts?: { onlyIfTrusted?: boolean }) => Promise<{ publicKey: PublicKey }>;
  disconnect: () => Promise<void>;
  signAndSendTransaction: (tx: AnyTx, opts?: SendOpts) => Promise<{ signature: string }>;
  signTransaction?: (tx: AnyTx) => Promise<AnyTx>;
};

export function getProvider(): PhantomProvider | null {
  const w = window as unknown as { solana?: unknown };
  const p = w.solana;
  if (!p) return null;
  return p as PhantomProvider;
}
