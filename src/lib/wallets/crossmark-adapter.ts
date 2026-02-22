/**
 * CrossMark Wallet Adapter
 *
 * Wraps the existing CrossMark SDK utility module into a SuzuPay wallet adapter.
 * Uses @crossmarkio/sdk for extension detection, sign-in, and transaction signing.
 *
 * @see https://docs.crossmark.io/
 */

import type { RegisteredAdapter } from './registry';
import type { ConnectionResult, SignResult } from './types';
import { WalletNotInstalledError, WalletRejectedError, WalletTimeoutError } from './types';
import {
  isCrossmarkInstalled,
  crossmarkSignIn,
  crossmarkSignAndSubmit,
  CrossmarkRejectedError,
  CrossmarkExpiredError,
} from '../crossmark-sdk';

/** CrossMark adapter metadata for the wallet registry */
export const crossmarkAdapterInfo: RegisteredAdapter = {
  id: 'crossmark',
  name: 'CrossMark',
  icon: 'crossmark',
  type: 'extension',
  supportsDirectSigning: true,
  isAvailable: () => isCrossmarkInstalled(),
};

/** Connect to CrossMark extension and get the user's address */
export async function crossmarkConnect(): Promise<ConnectionResult> {
  if (!isCrossmarkInstalled()) {
    throw new WalletNotInstalledError('CrossMark');
  }

  try {
    const address = await crossmarkSignIn();
    return {
      address,
      network: 'testnet', // Matches STANDARD_NETWORKS.testnet in wallet-context
      walletName: 'CrossMark',
    };
  } catch (error: unknown) {
    if (error instanceof CrossmarkRejectedError) {
      throw new WalletRejectedError('CrossMark');
    }
    if (error instanceof CrossmarkExpiredError) {
      throw new WalletTimeoutError('CrossMark');
    }
    throw error;
  }
}

/** Sign and submit a transaction through CrossMark */
export async function crossmarkSignAndSubmitTx(
  transaction: Record<string, unknown>,
  description?: string,
): Promise<SignResult> {
  if (!isCrossmarkInstalled()) {
    throw new WalletNotInstalledError('CrossMark');
  }

  try {
    const result = await crossmarkSignAndSubmit(
      transaction as Record<string, any>,
      description,
    );
    return {
      hash: result.hash,
      raw: result.raw,
    };
  } catch (error: unknown) {
    if (error instanceof CrossmarkRejectedError) {
      throw new WalletRejectedError('CrossMark');
    }
    if (error instanceof CrossmarkExpiredError) {
      throw new WalletTimeoutError('CrossMark');
    }
    throw error;
  }
}
