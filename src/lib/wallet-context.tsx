'use client';

/**
 * XRPL Wallet Context
 * Provides wallet connection state throughout the app using xrpl-connect
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { WalletManager, Adapters, STANDARD_NETWORKS } from 'xrpl-connect';
import type { Account } from 'xrpl-connect';
import {
  isCrossmarkInstalled,
  crossmarkSignAndSubmit,
  CrossmarkRejectedError,
  CrossmarkExpiredError,
} from './crossmark-sdk';

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

  // Add Crossmark adapter only if extension is installed
  if (isCrossmarkInstalled()) {
    adapters.push(new Adapters.Crossmark());
  } else {
    console.info('[WalletContext] Crossmark extension not detected, skipping adapter');
  }

  // Add WalletConnect if project ID is available
  const walletConnectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
  if (walletConnectId) {
    adapters.push(new Adapters.WalletConnect({ projectId: walletConnectId }));
  }

  // Fallback: if no adapters configured, add Crossmark anyway (connection will fail gracefully)
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
      
      // Attempt connection via wallet manager
      const result = await walletManager.connect(targetWalletId);
      
      // Validation: Ensure we actually got a connected account
      if (!walletManager.account?.address) {
        throw new Error('No address returned from wallet connection');
      }

    } catch (error: any) {
      console.error('[WalletContext] Connection error:', error);
      
      // ── Crossmark Connect Fallback ────────────────────────────────
      // If xrpl-connect fails to get the address (common with Crossmark),
      // try to connect directly using the SDK wrapper.
      if (isCrossmarkInstalled() && (walletId === 'crossmark' || !walletId)) {
        console.log('[WalletContext] Attempting direct Crossmark sign-in fallback...');
        try {
          const { crossmarkSignIn } = await import('./crossmark-sdk');
          const address = await crossmarkSignIn();
          
          if (address) {
            console.log('[WalletContext] Direct Crossmark sign-in successful:', address);
            // Manually update state since walletManager won't emit the event
            setState(prev => ({
              ...prev,
              isConnected: true,
              isConnecting: false,
              address: address,
              network: 'mainnet', // Crossmark usually defaults to mainnet, or we can check
              walletName: 'Crossmark',
              error: null,
            }));
            return;
          }
        } catch (fallbackError) {
          console.error('[WalletContext] Direct Crossmark sign-in also failed:', fallbackError);
        }
      }

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
      // Primary path: use xrpl-connect's signAndSubmit
      const result = await (walletManager as any).signAndSubmit(transaction);

      if (!result) {
        throw new Error('Wallet returned an empty response');
      }

      return result;
    } catch (error: any) {
      const message = error?.message || String(error);
      console.warn('[WalletContext] xrpl-connect signAndSubmit failed:', message);

      // ── Crossmark SDK Fix ──────────────────────────────────────────
      // Check for known xrpl-connect/Crossmark bug: "Cannot read properties of undefined (reading 'result')"
      // OR if Crossmark is explicitly detected.
      const isKnownCrossmarkBug = message.includes('Cannot read properties of undefined') && message.includes('result');
      
      if (isCrossmarkInstalled() || isKnownCrossmarkBug) {
        try {
          console.log('[WalletContext] Attempting Crossmark SDK fallback...');
          // Import dynamically if needed, or use the one we have
          const sdkResult = await crossmarkSignAndSubmit(transaction, 'SuzuPay Transaction');
          
          return {
            hash: sdkResult.hash,
            raw: sdkResult.raw || sdkResult.meta
          };
        } catch (fallbackError: any) {
          // Surface user-facing rejection/expiry as distinct errors
          if (fallbackError instanceof CrossmarkRejectedError) {
            throw new Error('Transaction rejected — you declined the request in Crossmark.');
          }
          if (fallbackError instanceof CrossmarkExpiredError) {
            throw new Error('Transaction expired — the Crossmark approval window timed out.');
          }
          console.error('[WalletContext] Crossmark SDK fallback failed:', fallbackError);
          // If fallback fails, throw the fallback error, not the original
          throw fallbackError;
        }
      }

      console.error('[WalletContext] Transaction error (no fallback available):', error);
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
