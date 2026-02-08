'use client';

/**
 * XRPL Wallet Connector Component
 * Uses the xrpl-wallet-connector web component for wallet selection UI
 */

import { useEffect, useRef, forwardRef, useImperativeHandle, type RefObject } from 'react';
import { useWallet } from './wallet-context';

// Import types - triggers the module augmentation
import '../types/xrpl-connect.d';

export interface WalletConnectorHandle {
  open: () => void;
  close: () => void;
}

interface WalletConnectorProps {
  onConnected?: (address: string) => void;
  onError?: (error: Error) => void;
  primaryWallet?: 'crossmark' | 'xaman';
  backgroundColor?: string;
  primaryColor?: string;
}

export const WalletConnector = forwardRef<WalletConnectorHandle, WalletConnectorProps>(
  function WalletConnector(
    {
      onConnected,
      onError,
      primaryWallet = 'crossmark',
      backgroundColor = '#0c0a1c',
      primaryColor = '#7c3aed',
    },
    ref
  ) {
    const connectorRef = useRef<HTMLElement & { 
      setWalletManager: (manager: any) => void;
      open: () => Promise<void>;
      close: () => void;
    }>(null);
    const { walletManager } = useWallet();

    // Expose open/close methods to parent
    useImperativeHandle(ref, () => ({
      open: () => {
        connectorRef.current?.open();
      },
      close: () => {
        connectorRef.current?.close();
      },
    }));

    // Register wallet manager with the web component
    useEffect(() => {
      if (!connectorRef.current || !walletManager) return;

      // Set the wallet manager on the web component
      connectorRef.current.setWalletManager(walletManager);

      // Handle connected event
      const handleConnected = (e: CustomEvent) => {
        const walletId = e.detail?.walletId;
        console.log('[WalletConnector] Connected via:', walletId);
        
        if (walletManager.account?.address) {
          onConnected?.(walletManager.account.address);
        }
        
        // Close the modal
        connectorRef.current?.close();
      };

      // Handle error event
      const handleError = (e: CustomEvent) => {
        const error = e.detail?.error || new Error('Connection failed');
        console.error('[WalletConnector] Error:', error);
        onError?.(error);
      };

      const element = connectorRef.current;
      element.addEventListener('connected', handleConnected as EventListener);
      element.addEventListener('error', handleError as EventListener);

      return () => {
        element.removeEventListener('connected', handleConnected as EventListener);
        element.removeEventListener('error', handleError as EventListener);
      };
    }, [walletManager, onConnected, onError]);

    return (
      <xrpl-wallet-connector
        ref={connectorRef as RefObject<any>}
        primary-wallet={primaryWallet}
        background-color={backgroundColor}
        primary-color={primaryColor}
        style={{ display: 'contents' }}
      />
    );
  }
);
