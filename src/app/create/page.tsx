export default function CreatePage() {
  return (
    <main className="mx-auto max-w-2xl px-4">
      <div className="mt-10">
        <h1 className="text-3xl font-semibold tracking-tight">Launch a token</h1>
        <p className="mt-2 text-sm text-[color:var(--muted)]">
          UI-first skeleton. Next step: wire wallet connect + form validation +
          transactions.
        </p>
      </div>

      <div className="mt-8 rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6">
        <div className="grid gap-4">
          {[
            { label: "Name", placeholder: "PingWin Coin" },
            { label: "Symbol", placeholder: "PING" },
            { label: "Total supply", placeholder: "1,000,000,000" },
            { label: "Sale price (SOL)", placeholder: "0.01" },
            { label: "Max buy per wallet (SOL)", placeholder: "1" },
          ].map((f) => (
            <label key={f.label} className="grid gap-2">
              <div className="text-sm font-medium">{f.label}</div>
              <input
                placeholder={f.placeholder}
                className="h-11 rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg)]/40 px-4 text-sm outline-none focus:border-[color:var(--cyan)]"
              />
            </label>
          ))}

          <button
            type="button"
            className="mt-2 inline-flex h-12 items-center justify-center rounded-2xl bg-[color:var(--lime)] text-sm font-semibold text-[color:var(--bg)] hover:brightness-110"
          >
            Connect wallet to continue (soon)
          </button>

          <div className="text-xs text-[color:var(--muted)]">
            Fees route to treasury: <span className="text-[color:var(--text)]">B59jW3oFwJzC2wu8T4EgwNmk6icGeMC4uQ7KgNKFKaTg</span>
          </div>
        </div>
      </div>
    </main>
  );
}
