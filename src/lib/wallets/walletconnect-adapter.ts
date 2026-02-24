/**
 * WalletConnect Adapter (Trust Wallet / Generic WC)
 *
 * Uses xrpl-connect's built-in WalletConnect adapter.
 * Requires NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID environment variable.
 *
 * ⚠️ Trust Wallet currently only supports EVM + Solana for dApp signing.
 *    XRPL transaction signing via WalletConnect is NOT yet supported.
 *    This adapter is included as a future-ready stub.
 *
 * @see https://developer.trustwallet.com/developer/develop-for-trust/mobile
 * @see firecrawl scrape: confirmed xrpl_support = false (EVM + Solana only)
 */

import type { RegisteredAdapter } from './registry';

/** WalletConnect adapter metadata for the wallet registry */
export const walletConnectAdapterInfo: RegisteredAdapter = {
  id: 'walletconnect',
  name: 'WalletConnect',
  icon: 'walletconnect',
  type: 'mobile',
  supportsDirectSigning: true, // Protocol supports it; individual wallets may not for XRPL
  isAvailable: () => {
    // WalletConnect is available when we have a project ID
    return !!getWalletConnectProjectId();
  },
};

/** Get WalletConnect project ID from environment */
export function getWalletConnectProjectId(): string | undefined {
  if (typeof process !== 'undefined' && process.env) {
    return process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
  }
  return undefined;
}
