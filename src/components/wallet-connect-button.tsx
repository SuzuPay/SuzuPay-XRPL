'use client';

import { useState, useEffect } from 'react';
import { Wallet, LogOut, Loader2 } from 'lucide-react';
import { useWallet } from '@/lib/wallet-context';
import { truncateAddress, formatXRP } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { WalletSelectorModal } from '@/components/wallet-selector-modal';

export function WalletConnectButton() {
  const [mounted, setMounted] = useState(false);
  const [selectorOpen, setSelectorOpen] = useState(false);
  const {
    isConnected,
    isConnecting,
    address,
    walletName,
    balance,
    error,
    disconnect,
  } = useWallet();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button
        className="gap-2 gradient-primary text-white rounded-xl font-bold shadow-lg"
        disabled
      >
        <Wallet className="w-4 h-4" />
        <span>Connect Wallet</span>
      </Button>
    );
  }

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
      <div className="flex items-center gap-3 p-1.5 pr-2 rounded-2xl glass transition-all hover:bg-surface-700/40">
        <div className="hidden sm:flex flex-col items-end px-2">
          <span className="text-[10px] uppercase tracking-wider text-text-low font-medium">{walletName || 'Wallet'}</span>
          <span className="text-sm font-mono text-text-high font-semibold">{truncateAddress(address)}</span>
        </div>

        {balance && (
          <div className="bg-surface-800/50 rounded-lg px-3 py-1.5 border border-surface-700/50">
            <span className="text-sm font-bold text-text-high">{formatXRP(balance)}</span>
            <span className="text-xs text-text-med ml-1">XRP</span>
          </div>
        )}

        <Button
          variant="ghost"
          size="icon"
          onClick={disconnect}
          className="h-8 w-8 hover:bg-error/20 hover:text-error transition-colors rounded-lg"
          title="Disconnect wallet"
        >
          <LogOut className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end group">
      <Button
        onClick={() => setSelectorOpen(true)}
        className="gap-2 gradient-primary text-white rounded-xl font-bold shadow-lg glow-primary hover:scale-105 active:scale-95 transition-all duration-300 border border-white/10"
      >
        <Wallet className="w-4 h-4 group-hover:rotate-12 transition-transform duration-300" />
        <span>Connect Wallet</span>
      </Button>
      {error && (
        <span className="text-xs text-error mt-2 font-medium bg-error/10 px-2 py-1 rounded-md animate-fade-in">
          {error}
        </span>
      )}

      <WalletSelectorModal
        open={selectorOpen}
        onOpenChange={setSelectorOpen}
      />
    </div>
  );
}
