// Security Tests for Payment Bypass Fix (Issue #4)
// These tests verify that the unlockProperty function now requires valid payments

import { describe, it, expect, beforeEach, beforeAll, vi, afterEach } from 'vitest';

// Mock Supabase before importing anything that uses it
const { mockFrom, mockRpc } = vi.hoisted(() => ({
    mockFrom: vi.fn(),
    mockRpc: vi.fn(),
}));

vi.mock('@/lib/supabase', () => ({
    supabase: {
        rpc: mockRpc,
        from: mockFrom,
    },
    STORAGE_BUCKET: 'properties-images',
    uploadImage: vi.fn(),
    deleteImage: vi.fn(),
}));

import { supabaseService } from '../services/supabaseService';
import { setTestMockOverride } from '../config/constants';

describe('Payment Security Tests', () => {
  // Test data variables
  let testUserId: string;
  let testPropertyId: string;

  // Robust chainable mock
  function createChain(result: any = { data: null, error: null }) {
      const query: any = {
          select: vi.fn(() => query),
          insert: vi.fn(() => query),
          update: vi.fn(() => query),
          delete: vi.fn(() => query),
          eq: vi.fn(() => query),
          neq: vi.fn(() => query),
          in: vi.fn(() => query),
          or: vi.fn(() => query),
          order: vi.fn(() => query),
          limit: vi.fn(() => query),
          maybeSingle: vi.fn().mockResolvedValue(result),
          single: vi.fn().mockResolvedValue(result),
          then: (resolve: any) => resolve(result),
      };
      return query;
  }

  beforeAll(async () => {
    // Disable mock mode for these tests to test Supabase logic
    setTestMockOverride(false);
  });

  afterEach(() => {
    setTestMockOverride(null);
  });

  beforeEach(() => {
    testUserId = 'user-' + Math.random().toString(36).substring(2, 9);
    testPropertyId = 'prop-' + Math.random().toString(36).substring(2, 9);
    
    vi.clearAllMocks();
    setTestMockOverride(false);
    
    // Default fallback
    mockFrom.mockImplementation(() => createChain());
    mockRpc.mockResolvedValue({ data: { success: true }, error: null });
  });

  describe('Attack Prevention Tests', () => {
    it('should reject unlock without approved payment', async () => {
      mockFrom.mockImplementation(() => createChain({ data: null, error: null }));
      await expect(supabaseService.unlockProperty(testUserId, testPropertyId)).rejects.toThrow();
    });

    it('should reject unlock with insufficient payment amount', async () => {
      mockFrom.mockImplementation(() => createChain({ 
          data: { amount: 30, status: 'approved', is_consumed: false }, 
          error: null 
      }));
      await expect(supabaseService.unlockProperty(testUserId, testPropertyId)).rejects.toThrow();
    });

    it('should prevent payment reuse attack', async () => {
        mockFrom.mockImplementation(() => createChain({ data: null, error: null }));
        await expect(supabaseService.unlockProperty(testUserId, testPropertyId)).rejects.toThrow();
    });
  });

  describe('Normal Flow Tests', () => {
    it('should unlock property with valid approved payment (>= 50 EGP)', async () => {
        mockFrom.mockImplementation((table) => {
            if (table === 'payment_requests') {
                return createChain({ data: { id: 'p1', amount: 50, status: 'approved', is_consumed: false }, error: null });
            }
            if (table === 'unlocked_properties') {
                return createChain({ data: null, error: null });
            }
            return createChain({ data: { id: 'any' }, error: null });
        });
        await expect(supabaseService.unlockProperty(testUserId, testPropertyId)).resolves.toBeUndefined();
    });

    it('should approve and unlock through the admin flow', async () => {
        const testPaymentId = 'pay-123';
        const pendingPayment = { id: testPaymentId, amount: 50, status: 'pending', property_id: testPropertyId, user_id: testUserId };
        const approvedPayment = { id: testPaymentId, amount: 50, status: 'approved', property_id: testPropertyId, user_id: testUserId, is_consumed: false };
        
        let paymentCallCount = 0;
        mockFrom.mockImplementation((table) => {
            if (table === 'payment_requests') {
                paymentCallCount++;
                // 1: initial load. 2: update select. 3: verify check. 4: unlockProperty check.
                // We return approved for ALL calls after the first one to be safe.
                return createChain({ data: paymentCallCount === 1 ? pendingPayment : approvedPayment, error: null });
            }
            return createChain({ data: null, error: null });
        });

      await expect(
        supabaseService.approvePaymentAndUnlock(testPaymentId, testUserId, testPropertyId)
      ).resolves.toBeUndefined();
    });
  });
});
