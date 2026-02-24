/**
 * Wallet Adapter Types
 *
 * Shared types for the pluggable wallet adapter system.
 * Platform-agnostic — no DOM/window dependencies in types.
 */

// ── Core Adapter Interface ───────────────────────────────────────────

/** Wallet integration method */
export type WalletType = 'extension' | 'mobile' | 'hardware' | 'manual';

/** Metadata describing an available wallet adapter */
export interface WalletAdapterInfo {
  /** Unique identifier (e.g. 'crossmark', 'xaman', 'ledger') */
  readonly id: string;
  /** Human-readable display name */
  readonly name: string;
  /** Icon identifier or URL */
  readonly icon: string;
  /** Integration type */
  readonly type: WalletType;
  /** Whether this adapter supports programmatic tx signing */
  readonly supportsDirectSigning: boolean;
}

/** Result of a successful wallet connection */
export interface ConnectionResult {
  address: string;
  network: string;
  publicKey?: string;
  walletName: string;
}

/** Result of signing + submitting a transaction */
export interface SignResult {
  hash: string;
  txBlob?: string;
  raw?: unknown;
}

// ── Error Classes ────────────────────────────────────────────────────

/** Base class for wallet-related errors */
export class WalletError extends Error {
  public readonly code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = 'WalletError';
    this.code = code;
  }
}

/** Thrown when a required wallet extension/app is not installed */
export class WalletNotInstalledError extends WalletError {
  constructor(walletName: string) {
    super(`${walletName} is not installed or not available`, 'WALLET_NOT_INSTALLED');
    this.name = 'WalletNotInstalledError';
  }
}

/** Thrown when user rejects a connection or transaction */
export class WalletRejectedError extends WalletError {
  constructor(walletName: string) {
    super(`Request was rejected by the user in ${walletName}`, 'WALLET_REJECTED');
    this.name = 'WalletRejectedError';
  }
}

/** Thrown when a wallet request times out */
export class WalletTimeoutError extends WalletError {
  constructor(walletName: string) {
    super(`Request timed out in ${walletName}`, 'WALLET_TIMEOUT');
    this.name = 'WalletTimeoutError';
  }
}
