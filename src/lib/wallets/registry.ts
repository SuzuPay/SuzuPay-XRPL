/**
 * Wallet Adapter Registry
 *
 * Pluggable registry for managing wallet adapters.
 * Adapters can be registered/unregistered at runtime.
 */

import type { WalletAdapterInfo } from './types';

/** Adapter registration entry — extends info with availability check */
export interface RegisteredAdapter extends WalletAdapterInfo {
  isAvailable: () => boolean | Promise<boolean>;
}

/**
 * Manages a collection of wallet adapters.
 * Allows registration, lookup, and availability filtering.
 */
export class WalletRegistry {
  private adapters: Map<string, RegisteredAdapter> = new Map();

  /** Register an adapter. Replaces existing adapter with same id. */
  register(adapter: RegisteredAdapter): void {
    this.adapters.set(adapter.id, adapter);
  }

  /** Unregister an adapter by id. */
  unregister(id: string): boolean {
    return this.adapters.delete(id);
  }

  /** Get all registered adapters (regardless of availability). */
  getAll(): RegisteredAdapter[] {
    return Array.from(this.adapters.values());
  }

  /** Get a specific adapter by id. Returns undefined if not found. */
  get(id: string): RegisteredAdapter | undefined {
    return this.adapters.get(id);
  }

  /** Get only adapters that are currently available. */
  async getAvailable(): Promise<RegisteredAdapter[]> {
    const results: RegisteredAdapter[] = [];

    for (const adapter of this.adapters.values()) {
      try {
        const available = await adapter.isAvailable();
        if (available) {
          results.push(adapter);
        }
      } catch {
        // If availability check throws, treat as unavailable
      }
    }

    return results;
  }

  /** Check if a specific adapter is registered. */
  has(id: string): boolean {
    return this.adapters.has(id);
  }

  /** Get the number of registered adapters. */
  get size(): number {
    return this.adapters.size;
  }

  /** Clear all registered adapters. */
  clear(): void {
    this.adapters.clear();
  }
}
