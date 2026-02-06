export default function AboutPage() {
  return (
    <main className="mx-auto max-w-3xl px-4">
      <div className="mt-10">
        <h1 className="text-3xl font-semibold tracking-tight">About PINGWIN.FUN</h1>
        <p className="mt-3 text-sm leading-6 text-[color:var(--muted)]">
          PINGWIN.FUN is a meme-casino token launchpad. We’re building a simple
          flow: create a token, trade it with transparent fees, and graduate to
          real DEX liquidity.
        </p>
      </div>

      <div className="mt-8 rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 text-sm leading-7">
        <div className="font-semibold">Principles</div>
        <ul className="mt-3 list-disc pl-5 text-[color:var(--muted)]">
          <li>No seed phrases. No private keys. Ever.</li>
          <li>One click = one clear transaction prompt.</li>
          <li>Fees are shown up front and routed on-chain.</li>
        </ul>

        <div className="mt-6 font-semibold">Fees (current target)</div>
        <ul className="mt-3 list-disc pl-5 text-[color:var(--muted)]">
          <li>Create launch: 0.02 SOL (dev wallet bypass)</li>
          <li>Trading fees: dev 1% + creator 1%</li>
          <li>Bond target: 100 SOL → seed Meteora liquidity</li>
        </ul>

        <div className="mt-6 font-semibold">Dev wallet</div>
        <div className="mt-2 font-mono text-xs text-[color:var(--muted)] break-all">
          B59jW3oFwJzC2wu8T4EgwNmk6icGeMC4uQ7KgNKFKaTg
        </div>
      </div>
    </main>
  );
}
