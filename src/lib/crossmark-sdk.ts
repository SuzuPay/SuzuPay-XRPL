/**
 * Crossmark SDK Utility Module
 *
 * Properly wraps the official @crossmarkio/sdk for:
 * - Extension detection
 * - Sign-in
 * - Transaction signing & submission
 * - Correct response parsing per Crossmark docs
 *
 * @see https://docs.crossmark.io/
 */

import sdk from '@crossmarkio/sdk';

// ── Types ────────────────────────────────────────────────────────────

/** Crossmark meta flags returned with every response */
export interface CrossmarkMeta {
  isError: boolean;
  isRejected: boolean;
  isExpired: boolean;
  isSigned: boolean;
  isPending: boolean;
  isSuccess: boolean;
  isFail: boolean;
  isVerified: boolean;
}

/** Normalised result we surface to the rest of the app */
export interface CrossmarkTxResult {
  hash: string;
  meta: CrossmarkMeta;
  raw: any;
}

/** Error thrown when the user rejects the Crossmark popup */
export class CrossmarkRejectedError extends Error {
  constructor() {
    super('Transaction was rejected by the user in Crossmark');
    this.name = 'CrossmarkRejectedError';
  }
}

/** Error thrown when the Crossmark request expired */
export class CrossmarkExpiredError extends Error {
  constructor() {
    super('Transaction request expired in Crossmark');
    this.name = 'CrossmarkExpiredError';
  }
}

// ── Detection ────────────────────────────────────────────────────────

/**
 * Check whether the Crossmark browser extension is installed.
 * The extension injects `window.xrpl.crossmark` on page load.
 */
export function isCrossmarkInstalled(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(window as any)?.xrpl?.crossmark;
}

// ── Sign-In ──────────────────────────────────────────────────────────

/**
 * Sign in with Crossmark using the official SDK.
 *
 * ```ts
 * const address = await crossmarkSignIn();
 * ```
 *
 * @returns The connected wallet address
 * @throws  If Crossmark is not installed or user rejects
 */
export async function crossmarkSignIn(): Promise<string> {
  if (!isCrossmarkInstalled()) {
    throw new Error('Crossmark extension is not installed');
  }

  const { response } = await sdk.methods.signInAndWait();
  
  // Crossmark response structure can vary slightly
  const data = (response as any)?.data ?? response;
  const address = data?.address ?? (response as any)?.address ?? data?.resp?.address;

  if (!address) {
    console.error('[Crossmark SDK] Sign-in response missing address:', response);
    throw new Error('Crossmark sign-in returned no address');
  }

  return address;
}

// ── Sign & Submit ────────────────────────────────────────────────────

/**
 * Sign and submit a transaction through the official Crossmark SDK.
 *
 * Uses `sdk.methods.signAndSubmitAndWait()` which:
 * 1. Opens the Crossmark popup for approval
 * 2. Signs the transaction
 * 3. Submits it to the XRPL
 * 4. Waits for validation
 *
 * @param transaction  Standard XRPL transaction object (e.g. Payment)
 * @param description  Optional human-readable description for the popup
 * @returns            Normalised result with hash and meta flags
 *
 * @see https://docs.crossmark.io/ — "Sign Payload" section
 */
export async function crossmarkSignAndSubmit(
  transaction: Record<string, any>,
  description?: string,
): Promise<CrossmarkTxResult> {
  if (!isCrossmarkInstalled()) {
    throw new Error('Crossmark extension is not installed');
  }

  // Official SDK call per Crossmark docs
  const result = await sdk.methods.signAndSubmitAndWait(
    transaction as any,
    description ? { description } : undefined,
  );

  // ── Parse response ────────────────────────────────────────────────
  // Crossmark response structure (from docs):
  //   { request, response: { data: { resp: { result: { hash } }, meta } }, createdAt, resolvedAt }
  const data = (result as any)?.response?.data ?? (result as any)?.response ?? {};
  const meta: CrossmarkMeta = data?.meta ?? {
    isError: false,
    isRejected: false,
    isExpired: false,
    isSigned: false,
    isPending: false,
    isSuccess: false,
    isFail: false,
    isVerified: false,
  };

  // Check rejection / expiry states BEFORE looking for hash
  if (meta.isRejected) {
    throw new CrossmarkRejectedError();
  }

  if (meta.isExpired) {
    throw new CrossmarkExpiredError();
  }

  if (meta.isFail || meta.isError) {
    const errorMsg = data?.errorMessage || data?.resp?.result?.errorMessage || 'Unknown error';
    throw new Error(
      `Crossmark transaction failed: ${errorMsg}`,
    );
  }

  // Extract the transaction hash from the nested response
  const resp = data?.resp;
  const hash: string | undefined =
    resp?.result?.hash ??
    resp?.hash ??
    (result as any)?.hash;

  if (!hash) {
    throw new Error('Crossmark returned a successful response but no transaction hash');
  }

  return { hash, meta, raw: result };
}

// ── Helpers ──────────────────────────────────────────────────────────

/**
 * Get the Crossmark SDK version string.
 */
export function getCrossmarkVersion(): string | undefined {
  try {
    return (sdk as any)?.version ?? (sdk as any)?.VERSION;
  } catch {
    return undefined;
  }
}
