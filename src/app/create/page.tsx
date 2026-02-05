"use client";

import { useMemo, useState } from "react";
import { PublicKey, Transaction } from "@solana/web3.js";
import { getConnection, getProvider } from "@/lib/solana";
import { defaultTestToken, launchMintToConnectedWallet } from "@/lib/tokenLaunch";

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

      setStatus("Creating SPL mint + ATA + minting supply… approve in wallet");

      const out = await launchMintToConnectedWallet({
        payer,
        signAndSendTransaction,
        decimals: token.decimals,
        supplyUi: token.supplyUi,
      });

      setMint(out.mint);
      setSig(out.signature);
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
          Mainnet test: creates a plain SPL token mint and mints the initial
          supply to your connected wallet.
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
            {loading ? "Launching…" : "Launch test token on mainnet"}
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
            Treasury wallet (for later program-enforced fees):{" "}
            <span className="text-[color:var(--text)]">B59jW3oFwJzC2wu8T4EgwNmk6icGeMC4uQ7KgNKFKaTg</span>
          </div>
        </div>
      </div>
    </main>
  );
}
