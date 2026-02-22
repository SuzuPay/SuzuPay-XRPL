'use client';

/**
 * XRPL Wallet Context
 *
 * Provides wallet connection state throughout the app using xrpl-connect.
 * Supports multiple wallet adapters: CrossMark, Xaman, Ledger, WalletConnect.
 *
 * @see context7: /xrpl-commons/xrpl-connect (benchmark 96.6)
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { WalletManager, Adapters, STANDARD_NETWORKS } from 'xrpl-connect';
import type { Account } from 'xrpl-connect';

import {
  createDefaultRegistry,
  crossmarkConnect,
  crossmarkSignAndSubmitTx,
  getXamanApiKey,
  getWalletConnectProjectId,
  WalletRejectedError,
  WalletTimeoutError,
} from './wallets';
import type { RegisteredAdapter, ConnectionResult, SignResult } from './wallets';
import { isCrossmarkInstalled } from './crossmark-sdk';

// ── State Types ──────────────────────────────────────────────────────

interface WalletState {
  isConnected: boolean;
  isConnecting: boolean;
  address: string | null;
  network: string | null;
  walletName: string | null;
  balance: string | null;
  error: string | null;
  activeWalletId: string | null;
}

interface WalletContextType extends WalletState {
  walletManager: WalletManager | null;
  connect: (walletId?: string) => Promise<void>;
  disconnect: () => Promise<void>;
  signAndSubmit: (transaction: any) => Promise<any>;
  refreshBalance: () => Promise<void>;
  availableAdapters: RegisteredAdapter[];
}

const initialState: WalletState = {
  isConnected: false,
  isConnecting: false,
  address: null,
  network: null,
  walletName: null,
  balance: null,
  error: null,
  activeWalletId: null,
};

const WalletContext = createContext<WalletContextType | null>(null);

// ── Wallet Manager Factory ───────────────────────────────────────────

/**
 * Build xrpl-connect WalletManager with all available adapters.
 * Only adds adapters that have the required config (API keys, etc).
 */
function createWalletManager() {
  const adapters = [];
  const registeredIds: string[] = [];

  // CrossMark — always register; xrpl-connect handles extension detection
  adapters.push(new Adapters.Crossmark());
  registeredIds.push('crossmark');

  // Xaman — requires API key
  const xamanApiKey = getXamanApiKey();
  if (xamanApiKey) {
    adapters.push(new Adapters.Xaman({ apiKey: xamanApiKey }));
    registeredIds.push('xaman');
  }

  // WalletConnect — requires project ID
  const walletConnectId = getWalletConnectProjectId();
  if (walletConnectId) {
    adapters.push(new Adapters.WalletConnect({ projectId: walletConnectId }));
    registeredIds.push('walletconnect');
  }

  // Ledger — requires WebUSB support
  if (typeof window !== 'undefined' && (navigator as any)?.usb) {
    try {
      adapters.push(new Adapters.Ledger());
      registeredIds.push('ledger');
    } catch {
      console.info('[WalletContext] Ledger adapter initialization failed, skipping');
    }
  }

  const manager = new WalletManager({
    adapters,
    network: STANDARD_NETWORKS.testnet,
    autoConnect: true,
    logger: { level: 'info' },
  });

  return { manager, registeredIds };
}

// ── Provider ─────────────────────────────────────────────────────────

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [walletManager, setWalletManager] = useState<WalletManager | null>(null);
  const [state, setState] = useState<WalletState>(initialState);
  const [availableAdapters, setAvailableAdapters] = useState<RegisteredAdapter[]>([]);

  // Initialize wallet manager + adapter registry
  useEffect(() => {
    const { manager, registeredIds } = createWalletManager();
    setWalletManager(manager);

    // Build adapter registry for UI — only show adapters that exist in WalletManager
    const registry = createDefaultRegistry();
    const allAdapters = registry.getAll();
    // Filter to only adapters that were actually registered with xrpl-connect
    const syncedAdapters = allAdapters.filter(a => registeredIds.includes(a.id));
    setAvailableAdapters(syncedAdapters);

    // ── Event Handlers ──────────────────────────────────────────────
    const handleConnect = (account: Account) => {
      setState(prev => ({
        ...prev,
        isConnected: true,
        isConnecting: false,
        address: account.address,
        network: account.network?.name || 'testnet',
        walletName: manager.wallet?.name || 'Unknown',
        activeWalletId: manager.wallet?.id || null,
        error: null,
      }));
    };

    const handleDisconnect = () => {
      setState(prev => ({
        ...prev,
        isConnected: false,
        address: null,
        network: null,
        walletName: null,
        balance: null,
        activeWalletId: null,
      }));
    };

    const handleError = (error: Error) => {
      setState(prev => ({
        ...prev,
        isConnecting: false,
        error: error.message,
      }));
    };

    // Per xrpl-connect docs: accountChange and networkChange events
    const handleAccountChange = (account: Account) => {
      setState(prev => ({
        ...prev,
        address: account.address,
        walletName: manager.wallet?.name || prev.walletName,
      }));
    };

    const handleNetworkChange = (network: any) => {
      setState(prev => ({
        ...prev,
        network: network?.name || prev.network,
      }));
    };

    manager.on('connect', handleConnect);
    manager.on('disconnect', handleDisconnect);
    manager.on('error', handleError);
    // xrpl-connect v0.5.2 types are incomplete — these events exist at runtime
    // (confirmed via context7: /xrpl-commons/xrpl-connect api-reference.md)
    (manager as any).on('accountChange', handleAccountChange);
    (manager as any).on('networkChange', handleNetworkChange);

    // Check if already connected (e.g. autoConnect)
    if (manager.connected && manager.account) {
      handleConnect(manager.account);
    }

    return () => {
      manager.off('connect', handleConnect);
      manager.off('disconnect', handleDisconnect);
      manager.off('error', handleError);
      (manager as any).off('accountChange', handleAccountChange);
      (manager as any).off('networkChange', handleNetworkChange);
    };
  }, []);

  // ── Connect ───────────────────────────────────────────────────────

  const connect = useCallback(async (walletId?: string) => {
    if (!walletManager) return;

    setState(prev => ({ ...prev, isConnecting: true, error: null }));

    try {
      // Determine which wallet to connect
      const wallets = walletManager.wallets || [];
      const defaultWalletId = wallets.length > 0 ? wallets[0].id : 'crossmark';
      const targetWalletId = walletId || defaultWalletId;

      console.log('[WalletContext] Connecting to wallet:', targetWalletId);

      // Primary: use xrpl-connect's unified connect
      await walletManager.connect(targetWalletId);

      if (!walletManager.account?.address) {
        throw new Error('No address returned from wallet connection');
      }
    } catch (error: any) {
      console.warn('[WalletContext] xrpl-connect failed, trying direct adapter:', error.message);

      // CrossMark direct SDK fallback (known xrpl-connect interop issue)
      if (isCrossmarkInstalled() && (walletId === 'crossmark' || !walletId)) {
        try {
          const result: ConnectionResult = await crossmarkConnect();
          setState(prev => ({
            ...prev,
            isConnected: true,
            isConnecting: false,
            address: result.address,
            network: result.network,
            walletName: result.walletName,
            activeWalletId: 'crossmark',
            error: null,
          }));
          return;
        } catch (fallbackError: any) {
          if (fallbackError instanceof WalletRejectedError) {
            setState(prev => ({ ...prev, isConnecting: false, error: 'Connection rejected' }));
            return;
          }
          console.error('[WalletContext] CrossMark fallback failed:', fallbackError.message);
        }
      }

      setState(prev => ({
        ...prev,
        isConnecting: false,
        error: error.message || 'Failed to connect wallet',
      }));
    }
  }, [walletManager]);

  // ── Disconnect ────────────────────────────────────────────────────

  const disconnect = useCallback(async () => {
    if (!walletManager) return;

    try {
      await walletManager.disconnect();
    } catch (error: any) {
      console.error('[WalletContext] Disconnect error:', error.message);
    }
    // Always reset state (even on error) for clean disconnect UX
    setState(prev => ({
      ...prev,
      isConnected: false,
      address: null,
      network: null,
      walletName: null,
      balance: null,
      activeWalletId: null,
    }));
  }, [walletManager]);

  // ── Sign & Submit ─────────────────────────────────────────────────

  const signAndSubmit = useCallback(async (transaction: any) => {
    if (!walletManager || !state.isConnected) {
      throw new Error('Wallet not connected');
    }

    try {
      // Primary: use xrpl-connect's unified signAndSubmit
      // 2nd arg = true → wait for ledger validation (per context7 docs)
      // xrpl-connect v0.5.2 types only declare 1 arg, runtime accepts 2
      const result = await (walletManager as any).signAndSubmit(transaction, true);
      if (!result) {
        throw new Error('Wallet returned an empty response');
      }
      return result;
    } catch (error: any) {
      const message = error?.message || String(error);
      console.warn('[WalletContext] signAndSubmit failed:', message);

      // CrossMark direct SDK fallback — only when CrossMark is the active wallet
      // (was previously triggering for all wallets if CrossMark extension installed)
      if (state.activeWalletId === 'crossmark') {
        try {
          const result: SignResult = await crossmarkSignAndSubmitTx(
            transaction,
            'SuzuPay Transaction',
          );
          return { hash: result.hash, raw: result.raw };
        } catch (fallbackError: any) {
          if (fallbackError instanceof WalletRejectedError) {
            throw new Error('Transaction rejected — you declined the request.');
          }
          if (fallbackError instanceof WalletTimeoutError) {
            throw new Error('Transaction expired — the approval window timed out.');
          }
          throw fallbackError;
        }
      }

      throw error;
    }
  }, [walletManager, state.isConnected, state.activeWalletId]);

  // ── Balance ───────────────────────────────────────────────────────

  const refreshBalance = useCallback(async () => {
    if (!state.address) return;

    try {
      const { getBalance } = await import('./xrpl-client');
      const balance = await getBalance(state.address);
      setState(prev => ({ ...prev, balance }));
    } catch (error: any) {
      if (error?.message?.includes('Account not found') || error?.data?.error === 'actNotFound') {
        setState(prev => ({ ...prev, balance: '0' }));
      } else {
        console.error('[WalletContext] Failed to fetch balance:', error.message);
      }
    }
  }, [state.address]);

  // Auto-refresh balance when connected
  useEffect(() => {
    if (state.isConnected && state.address) {
      refreshBalance();
    }
  }, [state.isConnected, state.address, refreshBalance]);

  // ── Context Value ─────────────────────────────────────────────────

  const contextValue: WalletContextType = {
    ...state,
    walletManager,
    connect,
    disconnect,
    signAndSubmit,
    refreshBalance,
    availableAdapters,
  };

  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  );
}

// ── Hook ─────────────────────────────────────────────────────────────

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
