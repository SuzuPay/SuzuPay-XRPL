'use client';

import { Wallet, LogOut, Loader2 } from 'lucide-react';
import { useWallet } from '@/lib/wallet-context';
import { truncateAddress, formatXRP } from '@/lib/utils';

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
      <button
        disabled
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-700 text-text-med"
      >
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm font-medium">Connecting...</span>
      </button>
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
          <div className="px-3 py-1.5 rounded-lg bg-surface-700">
            <span className="text-sm font-semibold text-text-high">{formatXRP(balance)}</span>
            <span className="text-xs text-text-med ml-1">XRP</span>
          </div>
        )}
        
        <button
          onClick={disconnect}
          className="p-2.5 rounded-xl bg-surface-700 hover:bg-error/20 hover:text-error transition-colors group"
          title="Disconnect wallet"
        >
          <LogOut className="w-4 h-4 text-text-med group-hover:text-error" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end">
      <button
        onClick={() => connect()}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-medium transition-colors"
      >
        <Wallet className="w-4 h-4" />
        <span className="text-sm">Connect Wallet</span>
      </button>
      {error && (
        <span className="text-xs text-error mt-1 max-w-[200px] truncate">
          {error}
        </span>
      )}
    </div>
  );
}
