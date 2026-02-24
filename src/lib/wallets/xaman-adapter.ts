/**
 * Xaman (Xumm) Wallet Adapter
 *
 * Uses xrpl-connect's built-in XamanAdapter which wraps the Xumm SDK.
 * Supports QR-code / deeplink based signing flow.
 *
 * Requires NEXT_PUBLIC_XAMAN_API_KEY environment variable.
 *
 * @see https://docs.xaman.dev/js-ts-sdk/xumm-sdk-intro
 * @see context7: /xrpl-commons/xrpl-connect (benchmark 96.6)
 */

import type { RegisteredAdapter } from './registry';

/** Xaman adapter metadata for the wallet registry */
export const xamanAdapterInfo: RegisteredAdapter = {
  id: 'xaman',
  name: 'Xaman',
  icon: 'xaman',
  type: 'mobile',
  supportsDirectSigning: true,
  isAvailable: () => {
    // Xaman is always available as a mobile app (QR-code based flow)
    // It requires an API key to function
    return !!getXamanApiKey();
  },
};

/** Get the Xaman API key from environment */
export function getXamanApiKey(): string | undefined {
  if (typeof process !== 'undefined' && process.env) {
    return process.env.NEXT_PUBLIC_XAMAN_API_KEY;
  }
  return undefined;
}
