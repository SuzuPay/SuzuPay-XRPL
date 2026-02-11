'use client';

/**
 * XRPL Wallet Context
 * Provides wallet connection state throughout the app using xrpl-connect
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { WalletManager, Adapters, STANDARD_NETWORKS } from 'xrpl-connect';
import type { Account } from 'xrpl-connect';

// Wallet state interface
interface WalletState {
  isConnected: boolean;
  isConnecting: boolean;
  address: string | null;
  network: string | null;
  walletName: string | null;
  balance: string | null;
  error: string | null;
}

// Context interface
interface WalletContextType extends WalletState {
  walletManager: WalletManager | null;
  connect: (walletId?: string) => Promise<void>;
  disconnect: () => Promise<void>;
  signAndSubmit: (transaction: any) => Promise<any>;
  refreshBalance: () => Promise<void>;
  availableWallets: string[];
}

const initialState: WalletState = {
  isConnected: false,
  isConnecting: false,
  address: null,
  network: null,
  walletName: null,
  balance: null,
  error: null,
};

const WalletContext = createContext<WalletContextType | null>(null);

// Initialize WalletManager
function createWalletManager(): WalletManager {
  const adapters = [];

  // Add Xaman adapter if API key is available
  const xamanApiKey = process.env.NEXT_PUBLIC_XAMAN_API_KEY;
  if (xamanApiKey) {
    adapters.push(new Adapters.Xaman({ apiKey: xamanApiKey }));
  }

  // Add Crossmark adapter (browser extension)
  adapters.push(new Adapters.Crossmark());

  // Add WalletConnect if project ID is available
  const walletConnectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
  if (walletConnectId) {
    adapters.push(new Adapters.WalletConnect({ projectId: walletConnectId }));
  }

  // Fallback: if no adapters configured, just use Crossmark
  if (adapters.length === 0) {
    adapters.push(new Adapters.Crossmark());
  }

  return new WalletManager({
    adapters,
    network: STANDARD_NETWORKS.testnet,
    autoConnect: true,
    logger: { level: 'info' },
  });
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [walletManager, setWalletManager] = useState<WalletManager | null>(null);
  const [state, setState] = useState<WalletState>(initialState);

  // Initialize wallet manager
  useEffect(() => {
    const manager = createWalletManager();
    setWalletManager(manager);

    // Event handlers
    const handleConnect = (account: Account) => {
      setState(prev => ({
        ...prev,
        isConnected: true,
        isConnecting: false,
        address: account.address,
        network: account.network?.name || 'testnet',
        walletName: manager.wallet?.name || 'Unknown',
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
      }));
    };

    const handleError = (error: Error) => {
      setState(prev => ({
        ...prev,
        isConnecting: false,
        error: error.message,
      }));
    };

    manager.on('connect', handleConnect);
    manager.on('disconnect', handleDisconnect);
    manager.on('error', handleError);

    // Check if already connected
    if (manager.connected && manager.account) {
      handleConnect(manager.account);
    }

    return () => {
      manager.off('connect', handleConnect);
      manager.off('disconnect', handleDisconnect);
      manager.off('error', handleError);
    };
  }, []);

  // Connect wallet
  const connect = useCallback(async (walletId?: string) => {
    if (!walletManager) return;
    
    setState(prev => ({ ...prev, isConnecting: true, error: null }));
    try {
      // Get available wallets and use the first one if no walletId provided
      const wallets = walletManager.wallets || [];
      const defaultWalletId = wallets.length > 0 ? wallets[0].id : 'crossmark';
      const targetWalletId = walletId || defaultWalletId;
      
      console.log('[WalletContext] Connecting to wallet:', targetWalletId);
      await walletManager.connect(targetWalletId);
    } catch (error: any) {
      console.error('[WalletContext] Connection error:', error);
      setState(prev => ({
        ...prev,
        isConnecting: false,
        error: error.message || 'Failed to connect wallet',
      }));
    }
  }, [walletManager]);

  // Disconnect wallet
  const disconnect = useCallback(async () => {
    if (!walletManager) return;
    
    try {
      await walletManager.disconnect();
    } catch (error: any) {
      console.error('Disconnect error:', error);
    }
  }, [walletManager]);

  // Sign and submit transaction
  const signAndSubmit = useCallback(async (transaction: any) => {
    if (!walletManager || !walletManager.connected) {
      throw new Error('Wallet not connected');
    }

    try {
      const result = await (walletManager as any).signAndSubmit(transaction, true);

      if (!result) {
        throw new Error('Wallet returned an empty response');
      }

      return result;
    } catch (error: any) {
      const message = error?.message || String(error);

      // Crossmark sometimes surfaces an undefined response; use SDK fallback when available.
      if (message.includes("Cannot read properties of undefined (reading 'result')")) {
        const crossmark = (window as any)?.xrpl?.crossmark;
        if (crossmark?.async?.signAndSubmitAndWait) {
          try {
            const fallback = await crossmark.async.signAndSubmitAndWait(transaction, {
              description: 'Sign transaction in Crossmark',
            });
            const resp = fallback?.response?.data?.resp ?? fallback?.response?.data ?? fallback?.response ?? fallback;
            if (resp?.result?.hash || resp?.hash) {
              return { hash: resp.result?.hash ?? resp.hash, raw: resp };
            }
            return resp;
          } catch (fallbackError) {
            console.error('Crossmark SDK fallback failed:', fallbackError);
          }
        }
      }

      console.error('Transaction error:', error);
      throw error;
    }
  }, [walletManager]);

  // Refresh balance
  const refreshBalance = useCallback(async () => {
    if (!state.address) return;

    try {
      const { getBalance } = await import('./xrpl-client');
      const balance = await getBalance(state.address);
      setState(prev => ({ ...prev, balance }));
    } catch (error: any) {
      // Handle unfunded accounts gracefully (common on testnet)
      if (error?.message?.includes('Account not found') || error?.data?.error === 'actNotFound') {
        console.log('[WalletContext] Account not funded yet, setting balance to 0');
        setState(prev => ({ ...prev, balance: '0' }));
      } else {
        console.error('Failed to fetch balance:', error);
      }
    }
  }, [state.address]);

  // Auto-refresh balance when connected
  useEffect(() => {
    if (state.isConnected && state.address) {
      refreshBalance();
    }
  }, [state.isConnected, state.address, refreshBalance]);

  // Ensure Crossmark approval panel can scroll by avoiding any page scroll locks
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const crossmark = (window as any)?.xrpl?.crossmark;
    if (!crossmark?.on) return;

    const enableScroll = () => {
      document.documentElement.classList.add('crossmark-open');
      document.body.classList.add('crossmark-open');
    };

    const disableScroll = () => {
      document.documentElement.classList.remove('crossmark-open');
      document.body.classList.remove('crossmark-open');
    };

    crossmark.on('open', enableScroll);
    crossmark.on('close', disableScroll);

    return () => {
      crossmark.off?.('open', enableScroll);
      crossmark.off?.('close', disableScroll);
      disableScroll();
    };
  }, []);

  // Get available wallet IDs from wallets array
  const availableWallets = walletManager?.wallets?.map((w: any) => w.id) || ['crossmark'];

  const contextValue: WalletContextType = {
    ...state,
    walletManager,
    connect,
    disconnect,
    signAndSubmit,
    refreshBalance,
    availableWallets,
  };

  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  );
}

// Hook to use wallet context
export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
