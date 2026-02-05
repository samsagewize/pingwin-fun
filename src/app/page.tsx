import Link from "next/link";

function Ticker() {
  const items = [
    "LIVE: new launches every minute",
    "Fee wallet: transparent",
    "Max buy caps",
    "No promises. just memes.",
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
        <div className="absolute inset-0 opacity-40" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-[color:var(--border)] bg-[color:var(--bg)]/40 px-4 py-2 text-xs text-[color:var(--muted)]">
            <span className="h-2 w-2 rounded-full bg-[color:var(--lime)]" />
            mainnet beta • degen-friendly UI • serious rails
          </div>

          <h1 className="mt-6 max-w-3xl text-4xl font-semibold leading-tight tracking-tight md:text-6xl">
            Launch a token fast.
            <br />
            <span className="text-[color:var(--cyan)]">Pay the fee.</span>
            <span className="text-[color:var(--muted)]"> Let the games begin.</span>
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-7 text-[color:var(--muted)] md:text-lg">
            PINGWIN.FUN is a meme-casino launchpad: create a token, run a clean
            initial sale, and route platform fees transparently.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/create"
              className="inline-flex items-center justify-center rounded-2xl bg-[color:var(--lime)] px-5 py-3 text-sm font-semibold text-[color:var(--bg)] hover:brightness-110"
            >
              Launch Token
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
        {[{
          title: "Clean sale rules",
          body: "Set price, caps, and timing. Keep it simple. Keep it legible.",
          accent: "var(--cyan)",
        },
        {
          title: "Instant distribution",
          body: "Buyers receive tokens immediately from a program-controlled vault.",
          accent: "var(--lime)",
        },
        {
          title: "Transparent fees",
          body: "Fees route directly to the platform treasury wallet. No mystery.",
          accent: "var(--pink)",
        }].map((c) => (
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
    </main>
  );
}
