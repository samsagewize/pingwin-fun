"use client";

import { useEffect, useMemo, useState } from "react";
import { PublicKey, Transaction } from "@solana/web3.js";
import { getConnection, getProvider } from "@/lib/solana";
import {
  fetchLaunch,
  fetchLaunchEvents,
  getCluster,
  ixBuy,
  ixSell,
} from "@/lib/pingwinProgram";

function lamportsToSol(l: bigint) {
  return Number(l) / 1e9;
}

export default function LaunchPage({ params }: { params: { id: string } }) {
  const mint = useMemo(() => new PublicKey(params.id), [params.id]);
  const cluster = getCluster();

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [solReserve, setSolReserve] = useState<bigint>(0n);
  const [tokenReserve, setTokenReserve] = useState<bigint>(0n);
  const [feeBps, setFeeBps] = useState<number>(0);
  const [graduated, setGraduated] = useState<boolean>(false);
  const [devWallet, setDevWallet] = useState<string>("");

  const [buySol, setBuySol] = useState<string>("0.1");
  const [sellTokens, setSellTokens] = useState<string>("100");

  const [points, setPoints] = useState<Array<{ t: number; p: number }>>([]);

  async function refresh() {
    const conn = getConnection();
    const launch = await fetchLaunch(mint, conn);
    if (!launch) throw new Error("Launch not found for mint");

    setSolReserve(BigInt(launch.account.solReserve.toString()));
    setTokenReserve(BigInt(launch.account.tokenReserve.toString()));
    setFeeBps(launch.account.feeBps);
    setGraduated(launch.account.graduated);
    setDevWallet(launch.account.devWallet.toBase58());

    // Simple chart: parse recent events and derive a price proxy from reserves in each event.
    const evts = await fetchLaunchEvents(mint, 50);
    const out: Array<{ t: number; p: number }> = [];
    for (const e of evts) {
      const rSol = e.data?.solReserve ? BigInt(e.data.solReserve.toString()) : null;
      const rTok = e.data?.tokenReserve ? BigInt(e.data.tokenReserve.toString()) : null;
      if (!rSol || !rTok) continue;
      // virtual reserves match program constants
      const x = rSol + 100_000_000n;
      const y = rTok + 1_000_000_000_000_000n;
      // SOL per token (UI) ~= (x/y) * 1e6 / 1e9
      const scaled = (x * 1_000_000_000_000n) / y; // lamports per base unit * 1e12
      const solPerToken = Number(scaled) / 1e12 / 1e9 * 1e6;
      out.push({ t: e.slot, p: solPerToken });
    }
    setPoints(out);
  }

  useEffect(() => {
    void refresh().catch((e) => setErr(e?.message ?? String(e)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function buy() {
    setLoading(true);
    setErr(null);
    try {
      const provider = getProvider();
      if (!provider) throw new Error("No wallet found");
      const { publicKey } = await provider.connect();
      const user = new PublicKey(publicKey.toBase58());
      const conn = getConnection();

      const amountInLamports = BigInt(Math.floor(Number(buySol) * 1e9));
      const minTokensOut = 0n;

      const ix = ixBuy({
        user,
        devWallet: new PublicKey(devWallet || user.toBase58()),
        mint,
        amountInLamports,
        minTokensOut,
      });

      const { blockhash, lastValidBlockHeight } =
        await conn.getLatestBlockhash("confirmed");
      const tx = new Transaction({ feePayer: user, recentBlockhash: blockhash });
      tx.add(ix);

      const res = await provider.signAndSendTransaction(tx, {
        preflightCommitment: "confirmed",
      });

      await conn.confirmTransaction(
        { signature: res.signature, blockhash, lastValidBlockHeight },
        "confirmed",
      );

      await refresh();
    } finally {
      setLoading(false);
    }
  }

  async function sell() {
    setLoading(true);
    setErr(null);
    try {
      const provider = getProvider();
      if (!provider) throw new Error("No wallet found");
      const { publicKey } = await provider.connect();
      const user = new PublicKey(publicKey.toBase58());
      const conn = getConnection();

      // token has 6 decimals
      const amountInTokens = BigInt(Math.floor(Number(sellTokens) * 1e6));
      const minSolOutLamports = 0n;

      const ix = ixSell({
        user,
        devWallet: new PublicKey(devWallet || user.toBase58()),
        mint,
        amountInTokens,
        minSolOutLamports,
      });

      const { blockhash, lastValidBlockHeight } =
        await conn.getLatestBlockhash("confirmed");
      const tx = new Transaction({ feePayer: user, recentBlockhash: blockhash });
      tx.add(ix);

      const res = await provider.signAndSendTransaction(tx, {
        preflightCommitment: "confirmed",
      });

      await conn.confirmTransaction(
        { signature: res.signature, blockhash, lastValidBlockHeight },
        "confirmed",
      );

      await refresh();
    } finally {
      setLoading(false);
    }
  }

  const progress = Math.min(1, Number(solReserve) / 100_000_000_000);

  return (
    <main className="mx-auto max-w-3xl px-4">
      <div className="mt-10">
        <h1 className="text-2xl font-semibold tracking-tight">Launch</h1>
        <div className="mt-2 break-all font-mono text-xs text-[color:var(--muted)]">
          mint: {mint.toBase58()} • cluster: {cluster}
        </div>
      </div>

      {err && (
        <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
          {err}
        </div>
      )}

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6">
          <div className="text-sm text-[color:var(--muted)]">Reserves</div>
          <div className="mt-2 grid gap-1 text-sm">
            <div>
              SOL reserve: <span className="font-mono">{lamportsToSol(solReserve).toFixed(4)}</span>
            </div>
            <div>
              Token reserve: <span className="font-mono">{(Number(tokenReserve) / 1e6).toLocaleString()}</span>
            </div>
            <div>
              Fee: <span className="font-mono">{feeBps} bps</span>
            </div>
            <div>
              Graduated: <span className="font-mono">{String(graduated)}</span>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-[color:var(--muted)]">
              <span>Bonding target</span>
              <span>{(progress * 100).toFixed(1)}%</span>
            </div>
            <div className="mt-2 h-3 w-full rounded-full bg-[color:var(--bg)]/40">
              <div
                className="h-3 rounded-full bg-[color:var(--lime)]"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
            <div className="mt-1 text-[11px] text-[color:var(--muted)]">
              {lamportsToSol(solReserve).toFixed(4)} / 100.0 SOL
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6">
          <div className="text-sm text-[color:var(--muted)]">Trade</div>

          <div className="mt-4 grid gap-3">
            <div className="grid gap-2">
              <div className="text-xs text-[color:var(--muted)]">Buy (SOL in)</div>
              <div className="flex gap-2">
                <input
                  value={buySol}
                  onChange={(e) => setBuySol(e.target.value)}
                  className="h-10 w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--bg)]/30 px-3 text-sm"
                  inputMode="decimal"
                />
                <button
                  disabled={loading}
                  onClick={() => void buy().catch((e) => setErr(e?.message ?? String(e)))}
                  className="h-10 rounded-xl bg-[color:var(--lime)] px-4 text-sm font-semibold text-[color:var(--bg)] disabled:opacity-60"
                >
                  Buy
                </button>
              </div>
            </div>

            <div className="grid gap-2">
              <div className="text-xs text-[color:var(--muted)]">Sell (tokens in)</div>
              <div className="flex gap-2">
                <input
                  value={sellTokens}
                  onChange={(e) => setSellTokens(e.target.value)}
                  className="h-10 w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--bg)]/30 px-3 text-sm"
                  inputMode="decimal"
                />
                <button
                  disabled={loading}
                  onClick={() => void sell().catch((e) => setErr(e?.message ?? String(e)))}
                  className="h-10 rounded-xl bg-[color:var(--cyan)] px-4 text-sm font-semibold text-[color:var(--bg)] disabled:opacity-60"
                >
                  Sell
                </button>
              </div>
            </div>

            <button
              disabled={loading}
              onClick={() => void refresh().catch((e) => setErr(e?.message ?? String(e)))}
              className="h-10 rounded-xl border border-[color:var(--border)] bg-[color:var(--bg)]/30 text-sm disabled:opacity-60"
            >
              Refresh
            </button>
          </div>

          <div className="mt-4 text-[11px] text-[color:var(--muted)] break-all">
            dev wallet: {devWallet}
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6">
        <div className="text-sm text-[color:var(--muted)]">Chart (event-derived)</div>
        <div className="mt-3">
          <Sparkline points={points.map((p) => p.p)} />
        </div>
        <div className="mt-2 text-[11px] text-[color:var(--muted)]">
          Uses on-chain Bought/Sold events to derive a simple SOL/token price proxy.
        </div>
      </div>
    </main>
  );
}

function Sparkline({ points }: { points: number[] }) {
  const w = 600;
  const h = 120;
  if (!points.length) {
    return <div className="text-sm text-[color:var(--muted)]">No events yet.</div>;
  }
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;

  const d = points
    .map((v, i) => {
      const x = (i / (points.length - 1 || 1)) * (w - 10) + 5;
      const y = h - 5 - ((v - min) / span) * (h - 10);
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full">
      <path d={d} fill="none" stroke="currentColor" strokeWidth="2" opacity="0.9" />
    </svg>
  );
}
