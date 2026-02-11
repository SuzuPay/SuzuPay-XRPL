'use client';

import { Wallet, LogOut, Loader2 } from 'lucide-react';
import { useWallet } from '@/lib/wallet-context';
import { truncateAddress, formatXRP } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function WalletConnectButton() {
  const {
    isConnected,
    isConnecting,
    address,
    walletName,
    balance,
    error,
    connect,
    disconnect,
  } = useWallet();

  if (isConnecting) {
    return (
      <Button disabled variant="secondary" className="bg-surface-700 text-text-med gap-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Connecting…</span>
      </Button>
    );
  }

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-2">
        <div className="hidden sm:flex flex-col items-end">
          <span className="text-xs text-text-low">{walletName || 'Connected'}</span>
          <span className="text-sm font-mono text-text-high">{truncateAddress(address)}</span>
        </div>

        {balance && (
          <Badge variant="secondary" className="bg-surface-700 border-0 px-3 py-1.5 text-sm font-semibold text-text-high">
            {formatXRP(balance)} <span className="text-text-med ml-1 font-normal">XRP</span>
          </Badge>
        )}

        <Button
          variant="ghost"
          size="icon"
          onClick={disconnect}
          className="hover:bg-[rgb(var(--color-error))]/15 hover:text-error transition-colors"
          title="Disconnect wallet"
        >
          <LogOut className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end">
      <Button
        onClick={() => connect()}
        className="gap-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-semibold shadow-lg shadow-[rgba(255,79,112,0.2)]"
      >
        <Wallet className="w-4 h-4" />
        <span>Connect Wallet</span>
      </Button>
      {error && (
        <span className="text-xs text-error mt-1 max-w-[200px] truncate">
          {error}
        </span>
      )}
    </div>
  );
}
