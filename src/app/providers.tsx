'use client';

/**
 * App Providers
 * Wraps the app with necessary context providers
 */

import { WalletProvider } from '@/lib/wallet-context';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WalletProvider>
      {children}
    </WalletProvider>
  );
}
