import Link from "next/link";

export default async function LaunchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <main className="mx-auto max-w-3xl px-4">
      <div className="mt-10 flex items-start justify-between gap-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Launch: {id}</h1>
          <p className="mt-2 text-sm text-[color:var(--muted)]">
            Placeholder page. This will show mint address, sale params, and a Buy
            flow.
          </p>
        </div>
        <Link
          href="/explore"
          className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg)]/30 px-4 py-2 text-sm font-semibold hover:bg-[color:var(--surface-2)]"
        >
          Back
        </Link>
      </div>

      <div className="mt-8 rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6">
        <div className="grid gap-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-[color:var(--muted)]">Status</span>
            <span className="font-semibold text-[color:var(--lime)]">LIVE (demo)</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[color:var(--muted)]">Price</span>
            <span className="font-semibold">0.01 SOL</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[color:var(--muted)]">Max per wallet</span>
            <span className="font-semibold">1 SOL</span>
          </div>
        </div>

        <button
          type="button"
          className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-2xl bg-[color:var(--cyan)] text-sm font-semibold text-[color:var(--bg)] hover:brightness-110"
        >
          Buy (soon)
        </button>
      </div>
    </main>
  );
}
