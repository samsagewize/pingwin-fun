import Link from "next/link";

export default function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-[color:var(--border)] bg-[color:var(--bg)]/70 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="group inline-flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-[color:var(--surface)] glow" />
          <div className="leading-tight">
            <div className="text-sm font-semibold tracking-wide">
              <span className="text-[color:var(--text)]">PING</span>
              <span className="text-[color:var(--cyan)]">WIN</span>
              <span className="text-[color:var(--muted)]">.FUN</span>
            </div>
            <div className="text-xs text-[color:var(--muted)]">meme casino launchpad</div>
          </div>
        </Link>

        <nav className="flex items-center gap-2">
          <Link
            href="/explore"
            className="rounded-xl px-3 py-2 text-sm text-[color:var(--muted)] hover:text-[color:var(--text)] hover:bg-[color:var(--surface)]"
          >
            Explore
          </Link>
          <Link
            href="/create"
            className="rounded-xl px-3 py-2 text-sm font-semibold text-[color:var(--bg)] bg-[color:var(--lime)] hover:brightness-110"
          >
            Launch Token
          </Link>
        </nav>
      </div>
    </header>
  );
}
