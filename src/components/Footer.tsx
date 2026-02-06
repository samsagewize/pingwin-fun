import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-[color:var(--border)]">
      <div className="mx-auto max-w-6xl px-4 py-10 text-sm text-[color:var(--muted)]">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <div>
              <span className="text-[color:var(--text)] font-semibold">PINGWIN.FUN</span>
              <span> — launchpad vibes. build responsibly.</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-xs">
              <Link className="hover:underline" href="/about">
                About
              </Link>
              <Link className="hover:underline" href="/terms">
                Terms
              </Link>
              <Link className="hover:underline" href="/privacy">
                Privacy
              </Link>
              <a
                className="hover:underline"
                href="https://github.com/samsagewize/pingwin-fun"
                target="_blank"
                rel="noreferrer"
              >
                GitHub
              </a>
            </div>
          </div>

          <div className="text-xs max-w-sm">
            Not financial advice. Tokens may be volatile. Expect degeneracy. Never
            share seed phrases.
          </div>
        </div>
      </div>
    </footer>
  );
}
