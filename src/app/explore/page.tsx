import Link from "next/link";

const demoLaunches = [
  {
    id: "demo-1",
    name: "PING",
    symbol: "PING",
    status: "LIVE",
    price: "0.01 SOL",
  },
  {
    id: "demo-2",
    name: "WIN",
    symbol: "WIN",
    status: "UPCOMING",
    price: "0.005 SOL",
  },
  {
    id: "demo-3",
    name: "DEGEN",
    symbol: "DGN",
    status: "ENDED",
    price: "0.02 SOL",
  },
];

export default function ExplorePage() {
  return (
    <main className="mx-auto max-w-6xl px-4">
      <div className="mt-10 flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Explore launches</h1>
        <p className="text-sm text-[color:var(--muted)]">
          Placeholder data for now — we’ll wire this to on-chain state + an indexer.
        </p>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {demoLaunches.map((l) => (
          <Link
            key={l.id}
            href={`/launch/${l.id}`}
            className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 hover:bg-[color:var(--surface-2)]"
          >
            <div className="flex items-center justify-between">
              <div className="text-lg font-semibold">
                {l.name} <span className="text-[color:var(--muted)]">({l.symbol})</span>
              </div>
              <span className="rounded-full border border-[color:var(--border)] px-3 py-1 text-xs text-[color:var(--muted)]">
                {l.status}
              </span>
            </div>
            <div className="mt-4 text-sm text-[color:var(--muted)]">
              Price: <span className="text-[color:var(--text)]">{l.price}</span>
            </div>
            <div className="mt-6 text-sm font-semibold text-[color:var(--lime)]">
              View →
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
