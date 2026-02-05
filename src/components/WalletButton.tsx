'use client';

import { useWalletModalState } from '@solana/react-hooks';

function shortAddress(a: string) {
  return `${a.slice(0, 4)}…${a.slice(-4)}`;
}

export default function WalletButton() {
  const modal = useWalletModalState({ closeOnConnect: true });

  if (!modal.isReady) {
    return (
      <button
        type="button"
        disabled
        className="h-10 rounded-xl bg-[color:var(--surface)] px-3 text-sm text-[color:var(--muted)]"
      >
        Wallet…
      </button>
    );
  }

  const connected = modal.connected && modal.wallet?.account?.address;
  const address = connected ? modal.wallet!.account.address.toString() : null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          if (connected) void modal.disconnect();
          else modal.open();
        }}
        className={
          connected
            ? 'h-10 rounded-xl bg-[color:var(--surface)] px-3 text-sm text-[color:var(--text)] hover:brightness-110'
            : 'h-10 rounded-xl bg-[color:var(--cyan)] px-3 text-sm font-semibold text-[color:var(--bg)] hover:brightness-110'
        }
      >
        {connected ? shortAddress(address!) : 'Connect'}
      </button>

      {modal.isOpen && (
        <div className="absolute right-0 mt-2 w-64 overflow-hidden rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg)] shadow-xl">
          <div className="px-3 py-2 text-xs font-semibold text-[color:var(--muted)]">
            Choose wallet
          </div>
          <div className="grid">
            {modal.connectors.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => void modal.connect(c.id)}
                disabled={modal.connecting}
                className="flex items-center justify-between px-3 py-2 text-left text-sm hover:bg-[color:var(--surface)] disabled:opacity-60"
              >
                <span>{c.name}</span>
                <span className="text-xs text-[color:var(--muted)]">{c.id}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-[color:var(--border)] px-3 py-2">
            <button
              type="button"
              onClick={() => modal.close()}
              className="rounded-xl px-3 py-1.5 text-xs text-[color:var(--muted)] hover:bg-[color:var(--surface)]"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
