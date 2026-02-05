'use client';

import { getWalletStandardConnectors } from '@solana/client';
import { SolanaProvider } from '@solana/react-hooks';
import type { ReactNode } from 'react';

const MAINNET_RPC = 'https://api.mainnet-beta.solana.com';

export default function SolanaProviders({ children }: { children: ReactNode }) {
  // Wallet Standard connectors power Phantom, Solflare, Backpack, etc.
  // We intentionally only wire Wallet Standard here.
  const connectors = getWalletStandardConnectors();

  return (
    <SolanaProvider
      config={{
        rpc: MAINNET_RPC,
        // Explicitly provide wallet-standard connectors.
        walletConnectors: connectors,
      }}
      walletPersistence={{
        autoConnect: true,
      }}
    >
      {children}
    </SolanaProvider>
  );
}
