"use client";

import { useMemo, useState } from "react";
import { Keypair, PublicKey, Transaction } from "@solana/web3.js";
import { getConnection, getProvider } from "@/lib/solana";
import { defaultTestToken } from "@/lib/tokenLaunch";
import { getCluster, ixCreateLaunch } from "@/lib/pingwinProgram";

export default function CreatePage() {
  const token = useMemo(() => defaultTestToken(), []);
  const [loading, setLoading] = useState(false);
  const [mint, setMint] = useState<string | null>(null);
  const [sig, setSig] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  async function launch() {
    setLoading(true);
    setError(null);
    setMint(null);
    setSig(null);
    setStatus("");

    try {
      const provider = getProvider();
      if (!provider) {
        throw new Error("No wallet found. Install Phantom/Solflare.");
      }

      setStatus("Connecting wallet...");
      const { publicKey } = await provider.connect();
      const payer = new PublicKey(publicKey.toBase58());

      const connection = getConnection();

      const signAndSendTransaction = async (tx: Transaction) => {
        const { blockhash, lastValidBlockHeight } =
          await connection.getLatestBlockhash("confirmed");
        tx.recentBlockhash = blockhash;
        tx.feePayer = payer;

        const res = await provider.signAndSendTransaction(tx, {
          preflightCommitment: "confirmed",
        });

        await connection.confirmTransaction(
          { signature: res.signature, blockhash, lastValidBlockHeight },
          "confirmed",
        );

        return res;
      };

      const cluster = getCluster();
      const devWallet = new PublicKey(
        process.env.NEXT_PUBLIC_PINGWIN_DEV_WALLET || payer.toBase58(),
      );

      // 1B tokens @ 6 decimals
      const initialTokenReserve = 1_000_000_000_000_000n;
      const feeBps = 100; // 1%

      const mintKeypair = Keypair.generate();

      setStatus(
        `Creating launch (cluster=${cluster})… approve in wallet`,
      );

      const { ix } = ixCreateLaunch({
        creator: payer,
        devWallet,
        mint: mintKeypair.publicKey,
        feeBps,
        initialTokenReserve,
      });

      const { blockhash } =
        await connection.getLatestBlockhash("confirmed");

      const tx = new Transaction({
        feePayer: payer,
        recentBlockhash: blockhash,
      });
      tx.add(ix);

      // mint must sign (it's created via init)
      tx.partialSign(mintKeypair);

      const { signature } = await signAndSendTransaction(tx);

      setMint(mintKeypair.publicKey.toBase58());
      setSig(signature);
      setStatus("Done");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-4">
      <div className="mt-10">
        <h1 className="text-3xl font-semibold tracking-tight">Launch a token</h1>
        <p className="mt-2 text-sm text-[color:var(--muted)]">
          Creates a bonding-curve launch: program-owned mint + vault, with buys/sells against a constant-product curve.
        </p>
      </div>

      <div className="mt-8 rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6">
        <div className="grid gap-4">
          <div className="grid gap-1 rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg)]/30 p-4 text-sm">
            <div>
              <span className="text-[color:var(--muted)]">Name:</span> {token.name}
            </div>
            <div>
              <span className="text-[color:var(--muted)]">Symbol:</span> {token.symbol}
            </div>
            <div>
              <span className="text-[color:var(--muted)]">Decimals:</span> {token.decimals}
            </div>
            <div>
              <span className="text-[color:var(--muted)]">Supply:</span> {token.supplyUi.toLocaleString()}
            </div>
          </div>

          <button
            type="button"
            onClick={() => void launch().catch((e) => setError(e?.message ?? String(e)))}
            disabled={loading}
            className="inline-flex h-12 items-center justify-center rounded-2xl bg-[color:var(--lime)] text-sm font-semibold text-[color:var(--bg)] hover:brightness-110 disabled:opacity-60"
          >
            {loading ? "Launching…" : "Create bonding-curve launch"}
          </button>

          {status && (
            <div className="text-sm text-[color:var(--muted)]">{status}</div>
          )}

          {error && (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
              {error}
            </div>
          )}

          {mint && (
            <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg)]/30 p-4 text-sm">
              <div className="text-[color:var(--muted)]">Mint</div>
              <a
                className="mt-1 block break-all font-mono text-xs text-[color:var(--cyan)] hover:underline"
                href={`https://solscan.io/token/${mint}`}
                target="_blank"
                rel="noreferrer"
              >
                {mint}
              </a>
            </div>
          )}

          {sig && (
            <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg)]/30 p-4 text-sm">
              <div className="text-[color:var(--muted)]">Tx</div>
              <a
                className="mt-1 block break-all font-mono text-xs text-[color:var(--cyan)] hover:underline"
                href={`https://solscan.io/tx/${sig}`}
                target="_blank"
                rel="noreferrer"
              >
                {sig}
              </a>
            </div>
          )}

          <div className="text-xs text-[color:var(--muted)]">
            Fee bps is set client-side for MVP. Dev wallet is taken from
            <span className="text-[color:var(--text)]"> NEXT_PUBLIC_PINGWIN_DEV_WALLET</span> (defaults to your wallet).
          </div>
        </div>
      </div>
    </main>
  );
}
