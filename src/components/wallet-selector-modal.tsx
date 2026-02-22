'use client';

/**
 * Wallet Selector Modal
 *
 * Displays available wallets for the user to connect to, like other dApps.
 * Uses the adapter registry to show only available wallets.
 */

import { useState } from 'react';
import { Wallet, Smartphone, HardDrive, QrCode, Loader2, ExternalLink } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useWallet } from '@/lib/wallet-context';
import type { RegisteredAdapter } from '@/lib/wallets';

// ── Wallet Icons ─────────────────────────────────────────────────────

const WALLET_ICONS: Record<string, React.ReactNode> = {
  crossmark: (
    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-500/20">
      X
    </div>
  ),
  xaman: (
    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-purple-500/20">
      X
    </div>
  ),
  ledger: (
    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-zinc-700 to-zinc-900 flex items-center justify-center text-white shadow-lg shadow-zinc-500/20">
      <HardDrive className="w-5 h-5" />
    </div>
  ),
  walletconnect: (
    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
      <ExternalLink className="w-5 h-5" />
    </div>
  ),
  atomic: (
    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-emerald-500/20">
      A
    </div>
  ),
  manual: (
    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-500 to-gray-600 flex items-center justify-center text-white shadow-lg shadow-gray-500/20">
      <QrCode className="w-5 h-5" />
    </div>
  ),
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
  extension: <Wallet className="w-3 h-3" />,
  mobile: <Smartphone className="w-3 h-3" />,
  hardware: <HardDrive className="w-3 h-3" />,
  manual: <QrCode className="w-3 h-3" />,
};

const TYPE_LABELS: Record<string, string> = {
  extension: 'Extension',
  mobile: 'Mobile',
  hardware: 'Hardware',
  manual: 'Manual',
};

// ── Component ────────────────────────────────────────────────────────

interface WalletSelectorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WalletSelectorModal({ open, onOpenChange }: WalletSelectorModalProps) {
  const { connect, availableAdapters, isConnecting } = useWallet();
  const [connectingId, setConnectingId] = useState<string | null>(null);

  const handleSelect = async (adapter: RegisteredAdapter) => {
    setConnectingId(adapter.id);
    try {
      await connect(adapter.id);
      onOpenChange(false);
    } catch {
      // Error is displayed by wallet context
    } finally {
      setConnectingId(null);
    }
  };

  // Group adapters: direct-signing wallets first, manual wallets last
  const directAdapters = availableAdapters.filter(a => a.supportsDirectSigning);
  const manualAdapters = availableAdapters.filter(a => !a.supportsDirectSigning);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-surface-900 border-surface-700 rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-text-high text-xl font-bold">
            Connect Wallet
          </DialogTitle>
          <DialogDescription className="text-text-med">
            Select a wallet to continue
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2 mt-2">
          {/* Direct signing wallets */}
          {directAdapters.map((adapter) => (
            <button
              key={adapter.id}
              onClick={() => handleSelect(adapter)}
              disabled={isConnecting}
              className="flex items-center gap-4 w-full p-3 rounded-xl glass border border-surface-700/50 hover:border-primary/50 hover:bg-surface-700/40 transition-all duration-200 group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {WALLET_ICONS[adapter.icon] || WALLET_ICONS.manual}

              <div className="flex flex-col items-start flex-1 min-w-0">
                <span className="text-sm font-semibold text-text-high group-hover:text-white transition-colors">
                  {adapter.name}
                </span>
                <span className="text-xs text-text-low">
                  {adapter.type === 'extension' && 'Browser extension'}
                  {adapter.type === 'mobile' && 'Scan QR code'}
                  {adapter.type === 'hardware' && 'USB device'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Badge
                  variant="secondary"
                  className="text-[10px] bg-surface-700/50 text-text-low border-0 gap-1"
                >
                  {TYPE_ICONS[adapter.type]}
                  {TYPE_LABELS[adapter.type]}
                </Badge>
                {connectingId === adapter.id && (
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                )}
              </div>
            </button>
          ))}

          {/* Separator if both groups have items */}
          {directAdapters.length > 0 && manualAdapters.length > 0 && (
            <div className="flex items-center gap-3 my-1">
              <div className="flex-1 h-px bg-surface-700/50" />
              <span className="text-[10px] uppercase tracking-widest text-text-low font-medium">
                Manual
              </span>
              <div className="flex-1 h-px bg-surface-700/50" />
            </div>
          )}

          {/* Manual wallets */}
          {manualAdapters.map((adapter) => (
            <button
              key={adapter.id}
              onClick={() => handleSelect(adapter)}
              disabled={isConnecting}
              className="flex items-center gap-4 w-full p-3 rounded-xl glass border border-surface-700/50 hover:border-surface-600 hover:bg-surface-700/30 transition-all duration-200 group disabled:opacity-50 disabled:cursor-not-allowed opacity-80"
            >
              {WALLET_ICONS[adapter.icon] || WALLET_ICONS.manual}

              <div className="flex flex-col items-start flex-1 min-w-0">
                <span className="text-sm font-semibold text-text-high group-hover:text-white transition-colors">
                  {adapter.name}
                </span>
                <span className="text-xs text-text-low">
                  Enter address & pay via QR
                </span>
              </div>

              <Badge
                variant="secondary"
                className="text-[10px] bg-surface-700/50 text-text-low border-0 gap-1"
              >
                {TYPE_ICONS.manual}
                {TYPE_LABELS.manual}
              </Badge>
            </button>
          ))}
        </div>

        {availableAdapters.length === 0 && (
          <div className="text-center py-8 text-text-low text-sm">
            No wallets detected. Install a wallet extension or configure API keys.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
