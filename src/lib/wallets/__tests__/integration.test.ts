/**
 * Integration Test Template
 *
 * Demonstrates how to use the xrpl-mcp MCP server and XRPL testnet
 * for integration testing of wallet adapters.
 *
 * These tests require:
 * - Network connectivity to XRPL testnet
 * - MCP server connections (xrpl-mcp)
 *
 * Run with: pnpm exec vitest run src/lib/wallets/__tests__/integration.test.ts
 */

import { describe, it, expect } from 'vitest';
import { WalletRegistry } from '../registry';
import { createDefaultRegistry } from '../index';

describe('Wallet Integration', () => {
  describe('Default Registry', () => {
    it('should create a registry with all adapters', () => {
      const registry = createDefaultRegistry();
      expect(registry.size).toBeGreaterThanOrEqual(5);
      expect(registry.has('crossmark')).toBe(true);
      expect(registry.has('xaman')).toBe(true);
      expect(registry.has('ledger')).toBe(true);
      expect(registry.has('walletconnect')).toBe(true);
      expect(registry.has('atomic')).toBe(true);
      expect(registry.has('manual')).toBe(true);
    });

    it('should allow querying available adapters', async () => {
      const registry = createDefaultRegistry();
      const available = await registry.getAvailable();
      // At minimum, manual adapters should always be available
      expect(available.length).toBeGreaterThanOrEqual(1);
      expect(available.some(a => a.type === 'manual')).toBe(true);
    });
  });

  describe('Adapter Metadata Consistency', () => {
    it('all adapters should have required fields', () => {
      const registry = createDefaultRegistry();
      for (const adapter of registry.getAll()) {
        expect(adapter.id).toBeTruthy();
        expect(adapter.name).toBeTruthy();
        expect(adapter.icon).toBeTruthy();
        expect(['extension', 'mobile', 'hardware', 'manual']).toContain(adapter.type);
        expect(typeof adapter.supportsDirectSigning).toBe('boolean');
        expect(typeof adapter.isAvailable).toBe('function');
      }
    });

    it('manual adapters should not support direct signing', () => {
      const registry = createDefaultRegistry();
      const manualAdapters = registry.getAll().filter(a => a.type === 'manual');
      for (const adapter of manualAdapters) {
        expect(adapter.supportsDirectSigning).toBe(false);
      }
    });

    it('extension/mobile/hardware adapters should support direct signing', () => {
      const registry = createDefaultRegistry();
      const signingAdapters = registry.getAll().filter(a => a.type !== 'manual');
      for (const adapter of signingAdapters) {
        expect(adapter.supportsDirectSigning).toBe(true);
      }
    });
  });

  // ── MCP Server Integration Templates ────────────────────────────

  /**
   * Template for XRPL testnet integration tests using xrpl-mcp.
   *
   * Usage with MCP servers:
   *
   * 1. xrpl-mcp — Query account info and verify transactions:
   *    - Check if test account exists on testnet
   *    - Verify tx hash after signing
   *    - Get account balance
   *
   * 2. @firecrawl — Validate SDK docs haven't changed:
   *    - Scrape wallet SDK release pages
   *    - Compare API signatures
   *
   * 3. @exa — Monitor ecosystem:
   *    - Search for new wallet SDK releases
   *    - Check for breaking changes
   *
   * Example xrpl-mcp test (pseudo-code):
   *
   *   const accountInfo = await xrplMcp.getAccountInfo('rTestAddress');
   *   expect(accountInfo.result.account_data.Balance).toBeDefined();
   *
   *   const txResult = await xrplMcp.submitTransaction(signedBlob);
   *   expect(txResult.result.engine_result).toBe('tesSUCCESS');
   */
});
