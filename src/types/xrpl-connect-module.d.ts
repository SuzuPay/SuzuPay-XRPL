/**
 * Type declarations for xrpl-connect library
 * The package doesn't ship with TypeScript definitions
 */

declare module 'xrpl-connect' {
  export interface Account {
    address: string;
    publicKey?: string;
    network: {
      name: string;
      server: string;
    };
  }

  export interface WalletAdapter {
    id: string;
    name: string;
    icon?: string;
    isAvailable?(): boolean | Promise<boolean>;
    connect(): Promise<Account>;
    disconnect(): Promise<void>;
  }

  export interface WalletManagerConfig {
    adapters: WalletAdapter[];
    network?: string | { server: string; name: string };
    autoConnect?: boolean;
    logger?: { level: string };
  }

  export class WalletManager {
    constructor(config: WalletManagerConfig);
    
    account: Account | null;
    adapters: WalletAdapter[];
    wallets: WalletAdapter[];
    wallet: WalletAdapter | null;
    connected: boolean;
    
    getAvailableWallets(): Promise<WalletAdapter[]>;
    
    connect(walletId?: string): Promise<Account>;
    disconnect(): Promise<void>;
    signAndSubmit(transaction: any): Promise<any>;
    
    on(event: 'connect', callback: (account: Account) => void): void;
    on(event: 'disconnect', callback: () => void): void;
    on(event: 'accountChanged', callback: (account: Account) => void): void;
    on(event: 'error', callback: (error: Error) => void): void;
    
    off(event: 'connect', callback: (account: Account) => void): void;
    off(event: 'disconnect', callback: () => void): void;
    off(event: 'accountChanged', callback: (account: Account) => void): void;
    off(event: 'error', callback: (error: Error) => void): void;
    
    removeAllListeners(): void;
  }

  export namespace Adapters {
    export class Xaman implements WalletAdapter {
      constructor(config: { apiKey: string });
      id: string;
      name: string;
      connect(): Promise<Account>;
      disconnect(): Promise<void>;
    }

    export class Crossmark implements WalletAdapter {
      constructor();
      id: string;
      name: string;
      connect(): Promise<Account>;
      disconnect(): Promise<void>;
    }

    export class GemWallet implements WalletAdapter {
      constructor();
      id: string;
      name: string;
      connect(): Promise<Account>;
      disconnect(): Promise<void>;
    }

    export class WalletConnect implements WalletAdapter {
      constructor(config: { projectId: string });
      id: string;
      name: string;
      connect(): Promise<Account>;
      disconnect(): Promise<void>;
    }

    export class Ledger implements WalletAdapter {
      constructor();
      id: string;
      name: string;
      connect(): Promise<Account>;
      disconnect(): Promise<void>;
    }
  }

  export const STANDARD_NETWORKS: {
    mainnet: { server: string; name: string };
    testnet: { server: string; name: string };
    devnet: { server: string; name: string };
  };

  // Aliased exports used by some examples
  export { Adapters as XamanAdapter };
  export { Adapters as CrossmarkAdapter };
  export { Adapters as GemWalletAdapter };
}
