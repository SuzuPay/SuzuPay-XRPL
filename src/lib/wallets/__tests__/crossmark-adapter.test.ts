/**
 * CrossMark Adapter Unit Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the crossmark-sdk module before importing adapter
vi.mock('../../crossmark-sdk', () => ({
  isCrossmarkInstalled: vi.fn(),
  crossmarkSignIn: vi.fn(),
  crossmarkSignAndSubmit: vi.fn(),
  CrossmarkRejectedError: class CrossmarkRejectedError extends Error {
    constructor() { super('Rejected'); this.name = 'CrossmarkRejectedError'; }
  },
  CrossmarkExpiredError: class CrossmarkExpiredError extends Error {
    constructor() { super('Expired'); this.name = 'CrossmarkExpiredError'; }
  },
}));

import {
  crossmarkAdapterInfo,
  crossmarkConnect,
  crossmarkSignAndSubmitTx,
} from '../crossmark-adapter';
import { WalletNotInstalledError, WalletRejectedError, WalletTimeoutError } from '../types';
import {
  isCrossmarkInstalled,
  crossmarkSignIn,
  crossmarkSignAndSubmit,
  CrossmarkRejectedError,
  CrossmarkExpiredError,
} from '../../crossmark-sdk';

const mockIsCrossmarkInstalled = vi.mocked(isCrossmarkInstalled);
const mockCrossmarkSignIn = vi.mocked(crossmarkSignIn);
const mockCrossmarkSignAndSubmit = vi.mocked(crossmarkSignAndSubmit);

describe('CrossMark Adapter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('crossmarkAdapterInfo', () => {
    it('should have correct metadata', () => {
      expect(crossmarkAdapterInfo.id).toBe('crossmark');
      expect(crossmarkAdapterInfo.name).toBe('CrossMark');
      expect(crossmarkAdapterInfo.type).toBe('extension');
      expect(crossmarkAdapterInfo.supportsDirectSigning).toBe(true);
    });

    it('should report availability from isCrossmarkInstalled', () => {
      mockIsCrossmarkInstalled.mockReturnValue(true);
      expect(crossmarkAdapterInfo.isAvailable()).toBe(true);

      mockIsCrossmarkInstalled.mockReturnValue(false);
      expect(crossmarkAdapterInfo.isAvailable()).toBe(false);
    });
  });

  describe('crossmarkConnect', () => {
    it('should return address on successful sign-in', async () => {
      mockIsCrossmarkInstalled.mockReturnValue(true);
      mockCrossmarkSignIn.mockResolvedValue('rTestAddress123');

      const result = await crossmarkConnect();
      expect(result.address).toBe('rTestAddress123');
      expect(result.walletName).toBe('CrossMark');
    });

    it('should throw WalletNotInstalledError when not installed', async () => {
      mockIsCrossmarkInstalled.mockReturnValue(false);
      await expect(crossmarkConnect()).rejects.toThrow(WalletNotInstalledError);
    });

    it('should map CrossmarkRejectedError to WalletRejectedError', async () => {
      mockIsCrossmarkInstalled.mockReturnValue(true);
      mockCrossmarkSignIn.mockRejectedValue(new CrossmarkRejectedError());
      await expect(crossmarkConnect()).rejects.toThrow(WalletRejectedError);
    });

    it('should map CrossmarkExpiredError to WalletTimeoutError', async () => {
      mockIsCrossmarkInstalled.mockReturnValue(true);
      mockCrossmarkSignIn.mockRejectedValue(new CrossmarkExpiredError());
      await expect(crossmarkConnect()).rejects.toThrow(WalletTimeoutError);
    });
  });

  describe('crossmarkSignAndSubmitTx', () => {
    it('should return hash on successful sign+submit', async () => {
      mockIsCrossmarkInstalled.mockReturnValue(true);
      mockCrossmarkSignAndSubmit.mockResolvedValue({
        hash: 'ABC123HASH',
        meta: {} as any,
        raw: { something: true },
      });

      const result = await crossmarkSignAndSubmitTx({ TransactionType: 'Payment' });
      expect(result.hash).toBe('ABC123HASH');
    });

    it('should throw WalletNotInstalledError when not installed', async () => {
      mockIsCrossmarkInstalled.mockReturnValue(false);
      await expect(crossmarkSignAndSubmitTx({})).rejects.toThrow(WalletNotInstalledError);
    });

    it('should map rejection errors', async () => {
      mockIsCrossmarkInstalled.mockReturnValue(true);
      mockCrossmarkSignAndSubmit.mockRejectedValue(new CrossmarkRejectedError());
      await expect(crossmarkSignAndSubmitTx({})).rejects.toThrow(WalletRejectedError);
    });
  });
});
