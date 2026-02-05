import {
  Connection,
  PublicKey,
  Transaction,
  VersionedTransaction,
} from "@solana/web3.js";

export const MAINNET_RPC = "https://api.mainnet-beta.solana.com";

export function getConnection() {
  return new Connection(MAINNET_RPC, {
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
