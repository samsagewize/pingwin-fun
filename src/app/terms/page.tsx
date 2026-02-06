export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-4">
      <div className="mt-10">
        <h1 className="text-3xl font-semibold tracking-tight">Terms</h1>
        <p className="mt-3 text-sm leading-6 text-[color:var(--muted)]">
          MVP terms: this is experimental software. Use at your own risk.
        </p>
      </div>

      <div className="mt-8 rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 text-sm leading-7 text-[color:var(--muted)]">
        <p>
          PINGWIN.FUN is provided “as is” without warranties. Tokens can be
          volatile and may lose value. You are responsible for understanding the
          transactions you sign and any fees you pay.
        </p>
        <p className="mt-4">
          We do not custody your funds. We never ask for seed phrases or private
          keys.
        </p>
      </div>
    </main>
  );
}
