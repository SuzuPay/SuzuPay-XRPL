/**
 * Ledger Hardware Wallet Adapter
 *
 * Uses xrpl-connect's built-in LedgerAdapter which wraps:
 * - @ledgerhq/hw-app-xrp for XRP address derivation and transaction signing
 * - @ledgerhq/hw-transport-webusb for browser USB communication
 * - ripple-binary-codec for transaction encoding
 *
 * The Ledger signs transactions but does NOT submit them.
 * Submission is handled by xrpl-connect's WalletManager via xrpl.js.
 *
 * @see context7: /ledgerhq/app-xrp — BIP44 path 44'/144'/0'/0/0
 * @see https://developers.ledger.com/docs/device-interaction/ledgerjs
 */

import type { RegisteredAdapter } from './registry';

/** Ledger adapter metadata for the wallet registry */
export const ledgerAdapterInfo: RegisteredAdapter = {
  id: 'ledger',
  name: 'Ledger',
  icon: 'ledger',
  type: 'hardware',
  supportsDirectSigning: true,
  isAvailable: () => {
    // WebUSB is available in Chrome-based browsers
    if (typeof window === 'undefined') return false;
    // WebUSB types not in default lib.dom.d.ts
    return !!(navigator as any)?.usb;
  },
};
