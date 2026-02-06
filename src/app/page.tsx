import Link from "next/link";

function Ticker() {
  const items = [
    "LIVE: bonding curve vibes",
    "dev fee: 1% • creator fee: 1%",
    "bond target: 100 SOL",
    "no seed phrases. ever.",
  ];

  return (
    <div className="mt-10 overflow-hidden rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)]">
      <div className="flex gap-6 whitespace-nowrap px-4 py-3 text-sm text-[color:var(--muted)]">
        {Array.from({ length: 3 }).flatMap((_, i) =>
          items.map((t, j) => (
            <span key={`${i}-${j}`} className="inline-flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[color:var(--pink)]" />
              {t}
            </span>
          )),
        )}
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <main className="mx-auto max-w-6xl px-4">
      <section className="relative mt-10 overflow-hidden rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface)] px-6 py-14 glow">
        <div className="absolute inset-0 hero-glow opacity-90" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-[color:var(--border)] bg-[color:var(--bg)]/40 px-4 py-2 text-xs text-[color:var(--muted)]">
            <span className="h-2 w-2 rounded-full bg-[color:var(--lime)]" />
            mainnet beta • pump-style curve • bond at 100 SOL
          </div>

          <h1 className="mt-6 max-w-4xl text-4xl font-semibold leading-tight tracking-tight md:text-6xl">
            Launch a coin.
            <br />
            <span className="text-[color:var(--cyan)]">Trade the curve.</span>
            <span className="text-[color:var(--muted)]"> Bond at 100 SOL.</span>
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-7 text-[color:var(--muted)] md:text-lg">
            PINGWIN.FUN is a pump-style meme casino: anyone can launch, buy, and
            sell. Price moves every trade. When a launch bonds, we seed real DEX
            liquidity.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/create"
              className="inline-flex items-center justify-center rounded-2xl bg-[color:var(--lime)] px-5 py-3 text-sm font-semibold text-[color:var(--bg)] hover:brightness-110"
            >
              Create a Launch
            </Link>
            <Link
              href="/explore"
              className="inline-flex items-center justify-center rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg)]/30 px-5 py-3 text-sm font-semibold text-[color:var(--text)] hover:bg-[color:var(--surface-2)]"
            >
              Explore Launches
            </Link>
          </div>

          <Ticker />
        </div>
      </section>

      <section className="mt-10 grid gap-4 md:grid-cols-3">
        {[
          {
            title: "Permissionless launches",
            body: "Anyone can create a launch. Creation fee is shown up front (dev bypass).",
            accent: "var(--lime)",
          },
          {
            title: "Price moves every trade",
            body: "Buy and sell against the bonding curve before graduation.",
            accent: "var(--cyan)",
          },
          {
            title: "Bond at 100 SOL",
            body: "Hit the target and we graduate to real DEX liquidity (Meteora).",
            accent: "var(--pink)",
          },
        ].map((c) => (
          <div
            key={c.title}
            className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6"
          >
            <div
              className="h-10 w-10 rounded-2xl"
              style={{ backgroundColor: c.accent, opacity: 0.15 }}
            />
            <div className="mt-4 text-lg font-semibold">{c.title}</div>
            <div className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
              {c.body}
            </div>
          </div>
        ))}
      </section>

      <section className="mt-10 rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6">
        <div className="text-lg font-semibold">How it works</div>
        <ol className="mt-4 grid gap-4 md:grid-cols-3">
          <li className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg)]/30 p-4">
            <div className="text-xs text-[color:var(--muted)]">01</div>
            <div className="mt-1 font-semibold">Launch</div>
            <div className="mt-2 text-sm text-[color:var(--muted)]">
              Create a new coin + immutable metadata. Creator earns fees.
            </div>
          </li>
          <li className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg)]/30 p-4">
            <div className="text-xs text-[color:var(--muted)]">02</div>
            <div className="mt-1 font-semibold">Trade the curve</div>
            <div className="mt-2 text-sm text-[color:var(--muted)]">
              Buy and sell. Price moves each trade. Fees split dev+creator.
            </div>
          </li>
          <li className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg)]/30 p-4">
            <div className="text-xs text-[color:var(--muted)]">03</div>
            <div className="mt-1 font-semibold">Bond</div>
            <div className="mt-2 text-sm text-[color:var(--muted)]">
              At 100 SOL, graduate to Meteora liquidity. Creator gets LP fees.
            </div>
          </li>
        </ol>

        <div className="mt-6 text-xs text-[color:var(--muted)]">
          No seed phrases. Always verify transaction details in your wallet.
        </div>
      </section>
    </main>
  );
}
