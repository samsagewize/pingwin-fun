export default function Footer() {
  return (
    <footer className="mt-16 border-t border-[color:var(--border)]">
      <div className="mx-auto max-w-6xl px-4 py-10 text-sm text-[color:var(--muted)]">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <span className="text-[color:var(--text)] font-semibold">PINGWIN.FUN</span> —
            <span> launchpad vibes. build responsibly.</span>
          </div>
          <div className="text-xs">
            Not financial advice. Tokens may be volatile. Expect degeneracy.
          </div>
        </div>
      </div>
    </footer>
  );
}
