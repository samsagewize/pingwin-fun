"use client";

import { useEffect, useMemo, useState } from "react";
import { getConnection, getProvider } from "@/lib/solana";
import { fetchTokenMetadata } from "@/lib/tokenMetadata";

type TokenRow = {
  mint: string;
  amount: string;
  decimals: number;
  name?: string;
  symbol?: string;
  image?: string;
  uri?: string;
};

export default function ProfilePage() {
  const [address, setAddress] = useState<string | null>(null);
  const [sol, setSol] = useState<string>("-");
  const [tokens, setTokens] = useState<TokenRow[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const connection = useMemo(() => getConnection(), []);

  async function connect() {
    setErr(null);
    const provider = getProvider();
    if (!provider) {
      setErr("No wallet found. Install Phantom or Solflare.");
      return;
    }
    const res = await provider.connect();
    setAddress(res.publicKey.toBase58());
  }

  useEffect(() => {
    if (!address) return;

    (async () => {
      try {
        const pk = new (await import("@solana/web3.js")).PublicKey(address);

        const bal = await connection.getBalance(pk, "confirmed");
        setSol((bal / 1e9).toFixed(4));

        const { TOKEN_PROGRAM_ID } = await import("@solana/spl-token");
        const parsed = await connection.getParsedTokenAccountsByOwner(pk, {
          programId: TOKEN_PROGRAM_ID,
        });

        const rows: TokenRow[] = parsed.value
          .map((v) => {
            const data = v.account.data as unknown as {
              parsed?: { info?: Record<string, unknown> };
            };
            const info = (data.parsed?.info ?? {}) as Record<string, unknown>;
            const mint = info.mint as string | undefined;
            const tokenAmount = info.tokenAmount as
              | { uiAmountString?: string; decimals?: number }
              | undefined;

            const ui = tokenAmount?.uiAmountString;
            const decimals = tokenAmount?.decimals;

            if (!mint || !ui || decimals === undefined) return null;
            return { mint, amount: ui, decimals };
          })
          .filter((r): r is TokenRow => Boolean(r))
          .filter((r) => r.amount !== "0" && r.amount !== "0.0");

        // Resolve Metaplex metadata for each mint (best-effort)
        const withMeta = await Promise.all(
          rows.map(async (r) => {
            const md = await fetchTokenMetadata({ connection, mint: r.mint });
            if (!md) return r;

            let image: string | undefined;
            try {
              if (md.uri) {
                const resp = await fetch(md.uri);
                if (resp.ok) {
                  const j = (await resp.json()) as { image?: string };
                  image = j.image;
                }
              }
            } catch {
              // ignore JSON fetch errors (CORS/404/etc)
            }

            return {
              ...r,
              name: md.name,
              symbol: md.symbol,
              uri: md.uri,
              image,
            };
          }),
        );

        setTokens(withMeta);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        setErr(msg);
      }
    })();
  }, [address, connection]);

  return (
    <main className="mx-auto max-w-3xl px-4">
      <div className="mt-10">
        <h1 className="text-3xl font-semibold tracking-tight">Profile</h1>
        <p className="mt-2 text-sm text-[color:var(--muted)]">
          Connect your wallet to see SOL + token balances.
        </p>
      </div>

      <div className="mt-8 rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm text-[color:var(--muted)]">Wallet</div>
            <div className="mt-1 font-mono text-sm">
              {address ?? "Not connected"}
            </div>
          </div>
          <button
            onClick={connect}
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-[color:var(--cyan)] px-5 text-sm font-semibold text-[color:var(--bg)] hover:brightness-110"
          >
            {address ? "Reconnect" : "Connect wallet"}
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg)]/30 p-4">
            <div className="text-xs text-[color:var(--muted)]">SOL balance</div>
            <div className="mt-1 text-2xl font-semibold">{sol}</div>
          </div>
          <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg)]/30 p-4">
            <div className="text-xs text-[color:var(--muted)]">Token accounts</div>
            <div className="mt-1 text-2xl font-semibold">{tokens.length}</div>
          </div>
        </div>

        {err && (
          <div className="mt-6 rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg)]/30 p-4 text-sm text-[color:var(--pink)]">
            {err}
          </div>
        )}
      </div>

      <div className="mt-6 rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6">
        <div className="text-sm font-semibold">Token balances</div>
        <div className="mt-4 grid gap-3">
          {tokens.length === 0 ? (
            <div className="text-sm text-[color:var(--muted)]">No tokens found (or not connected).</div>
          ) : (
            tokens.map((t) => (
              <div
                key={t.mint}
                className="flex flex-col gap-2 rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg)]/30 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold">
                      {t.name ?? "Unknown token"}
                      {t.symbol ? (
                        <span className="ml-2 text-xs text-[color:var(--muted)]">({t.symbol})</span>
                      ) : null}
                    </div>
                    <div className="mt-1 font-mono text-xs text-[color:var(--muted)]">{t.mint}</div>
                  </div>
                  {t.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={t.image}
                      alt={t.symbol ?? t.name ?? t.mint}
                      className="h-12 w-12 rounded-xl border border-[color:var(--border)] bg-[color:var(--bg)]/40 object-cover"
                    />
                  ) : null}
                </div>

                <div className="text-sm">
                  <span className="text-[color:var(--muted)]">Amount:</span> {t.amount}
                </div>

                {t.uri ? (
                  <a
                    className="text-xs text-[color:var(--cyan)] underline decoration-transparent hover:decoration-current"
                    href={t.uri}
                    target="_blank"
                    rel="noreferrer"
                  >
                    metadata.json
                  </a>
                ) : null}
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
