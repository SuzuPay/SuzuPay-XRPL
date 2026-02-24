/**
 * Wallet Adapters — Barrel Export
 *
 * Re-exports all adapter types, registry, and a factory to create
 * a fully-configured WalletManager with all available adapters.
 */

// ── Types ────────────────────────────────────────────────────────────
export type {
  WalletType,
  WalletAdapterInfo,
  ConnectionResult,
  SignResult,
} from './types';

export {
  WalletError,
  WalletNotInstalledError,
  WalletRejectedError,
  WalletTimeoutError,
} from './types';

// ── Registry ─────────────────────────────────────────────────────────
export { WalletRegistry } from './registry';
export type { RegisteredAdapter } from './registry';

// ── Adapter Infos ────────────────────────────────────────────────────
export { crossmarkAdapterInfo, crossmarkConnect, crossmarkSignAndSubmitTx } from './crossmark-adapter';
export { xamanAdapterInfo, getXamanApiKey } from './xaman-adapter';
export { ledgerAdapterInfo } from './ledger-adapter';
export { walletConnectAdapterInfo, getWalletConnectProjectId } from './walletconnect-adapter';
export { atomicAdapterInfo, manualAdapterInfo } from './manual-adapter';

// ── Factory ──────────────────────────────────────────────────────────
import { WalletRegistry } from './registry';
import { crossmarkAdapterInfo } from './crossmark-adapter';
import { xamanAdapterInfo } from './xaman-adapter';
import { ledgerAdapterInfo } from './ledger-adapter';
import { walletConnectAdapterInfo } from './walletconnect-adapter';
import { atomicAdapterInfo, manualAdapterInfo } from './manual-adapter';

/**
 * Create a WalletRegistry pre-loaded with all known adapters.
 * Adapters self-report availability, so unavailable ones are gracefully skipped
 * when the UI queries `registry.getAvailable()`.
 */
export function createDefaultRegistry(): WalletRegistry {
  const registry = new WalletRegistry();

  registry.register(crossmarkAdapterInfo);
  registry.register(xamanAdapterInfo);
  registry.register(ledgerAdapterInfo);
  registry.register(walletConnectAdapterInfo);
  registry.register(atomicAdapterInfo);
  registry.register(manualAdapterInfo);

  return registry;
}
