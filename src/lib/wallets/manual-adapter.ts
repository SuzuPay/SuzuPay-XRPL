/**
 * Manual Wallet Adapter (Atomic Wallet / Generic)
 *
 * For wallets with no dApp SDK (e.g. Atomic Wallet).
 * These wallets cannot programmatically connect or sign transactions.
 *
 * Flow:
 * 1. User manually enters their XRP address
 * 2. App generates a payment QR code / deeplink
 * 3. User scans QR in their wallet app and sends manually
 * 4. App monitors the XRPL for the incoming transaction
 *
 * @see exa search: Atomic Wallet has no public dApp SDK or browser extension
 */

import type { RegisteredAdapter } from './registry';

/** Atomic Wallet adapter metadata */
export const atomicAdapterInfo: RegisteredAdapter = {
  id: 'atomic',
  name: 'Atomic Wallet',
  icon: 'atomic',
  type: 'manual',
  supportsDirectSigning: false,
  isAvailable: () => true, // Always available — manual flow
};

/** Generic manual wallet adapter metadata */
export const manualAdapterInfo: RegisteredAdapter = {
  id: 'manual',
  name: 'Other Wallet',
  icon: 'manual',
  type: 'manual',
  supportsDirectSigning: false,
  isAvailable: () => true, // Always available — user enters address manually
};
