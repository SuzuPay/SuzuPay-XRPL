/**
 * WalletRegistry Unit Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { WalletRegistry } from '../registry';
import type { RegisteredAdapter } from '../registry';

// ── Test Helpers ─────────────────────────────────────────────────────

function createMockAdapter(overrides: Partial<RegisteredAdapter> = {}): RegisteredAdapter {
  return {
    id: 'mock-wallet',
    name: 'Mock Wallet',
    icon: 'mock',
    type: 'extension',
    supportsDirectSigning: true,
    isAvailable: () => true,
    ...overrides,
  };
}

// ── Tests ────────────────────────────────────────────────────────────

describe('WalletRegistry', () => {
  let registry: WalletRegistry;

  beforeEach(() => {
    registry = new WalletRegistry();
  });

  describe('register', () => {
    it('should register an adapter', () => {
      const adapter = createMockAdapter();
      registry.register(adapter);
      expect(registry.size).toBe(1);
      expect(registry.has('mock-wallet')).toBe(true);
    });

    it('should replace an existing adapter with the same id', () => {
      const adapter1 = createMockAdapter({ name: 'First' });
      const adapter2 = createMockAdapter({ name: 'Second' });
      registry.register(adapter1);
      registry.register(adapter2);
      expect(registry.size).toBe(1);
      expect(registry.get('mock-wallet')?.name).toBe('Second');
    });

    it('should register multiple adapters with different ids', () => {
      registry.register(createMockAdapter({ id: 'wallet-a' }));
      registry.register(createMockAdapter({ id: 'wallet-b' }));
      registry.register(createMockAdapter({ id: 'wallet-c' }));
      expect(registry.size).toBe(3);
    });
  });

  describe('unregister', () => {
    it('should remove a registered adapter', () => {
      registry.register(createMockAdapter());
      expect(registry.unregister('mock-wallet')).toBe(true);
      expect(registry.size).toBe(0);
    });

    it('should return false for non-existent adapter', () => {
      expect(registry.unregister('non-existent')).toBe(false);
    });
  });

  describe('get', () => {
    it('should return the adapter by id', () => {
      const adapter = createMockAdapter({ id: 'crossmark', name: 'CrossMark' });
      registry.register(adapter);
      expect(registry.get('crossmark')?.name).toBe('CrossMark');
    });

    it('should return undefined for non-existent id', () => {
      expect(registry.get('non-existent')).toBeUndefined();
    });
  });

  describe('getAll', () => {
    it('should return all registered adapters', () => {
      registry.register(createMockAdapter({ id: 'a' }));
      registry.register(createMockAdapter({ id: 'b' }));
      const all = registry.getAll();
      expect(all).toHaveLength(2);
      expect(all.map(a => a.id)).toEqual(['a', 'b']);
    });

    it('should return empty array when no adapters registered', () => {
      expect(registry.getAll()).toEqual([]);
    });
  });

  describe('getAvailable', () => {
    it('should return only available adapters', async () => {
      registry.register(createMockAdapter({ id: 'available', isAvailable: () => true }));
      registry.register(createMockAdapter({ id: 'unavailable', isAvailable: () => false }));
      const available = await registry.getAvailable();
      expect(available).toHaveLength(1);
      expect(available[0].id).toBe('available');
    });

    it('should handle async isAvailable checks', async () => {
      registry.register(createMockAdapter({
        id: 'async-available',
        isAvailable: () => Promise.resolve(true),
      }));
      registry.register(createMockAdapter({
        id: 'async-unavailable',
        isAvailable: () => Promise.resolve(false),
      }));
      const available = await registry.getAvailable();
      expect(available).toHaveLength(1);
      expect(available[0].id).toBe('async-available');
    });

    it('should treat throwing isAvailable as unavailable', async () => {
      registry.register(createMockAdapter({
        id: 'throws',
        isAvailable: () => { throw new Error('check failed'); },
      }));
      const available = await registry.getAvailable();
      expect(available).toHaveLength(0);
    });
  });

  describe('clear', () => {
    it('should remove all adapters', () => {
      registry.register(createMockAdapter({ id: 'a' }));
      registry.register(createMockAdapter({ id: 'b' }));
      registry.clear();
      expect(registry.size).toBe(0);
      expect(registry.getAll()).toEqual([]);
    });
  });
});
