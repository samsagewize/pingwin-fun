export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4">
      <div className="mt-10">
        <h1 className="text-3xl font-semibold tracking-tight">Privacy</h1>
        <p className="mt-3 text-sm leading-6 text-[color:var(--muted)]">
          MVP privacy: we don’t want your data; we want your vibes.
        </p>
      </div>

      <div className="mt-8 rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 text-sm leading-7 text-[color:var(--muted)]">
        <p>
          Your wallet address and on-chain activity are public on Solana. We may
          log basic diagnostics (errors, performance) to keep the site running,
          but we do not sell personal data.
        </p>
      </div>
    </main>
  );
}
