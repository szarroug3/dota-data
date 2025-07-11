/**
 * Memory rate limiting backend tests
 */

import { MemoryRateLimitBackend } from '@/lib/rate-limit-backends/memory';
import { RateLimitConfig } from '@/lib/types/rate-limit';

// Helper functions
const createTestConfig = (overrides: Partial<RateLimitConfig> = {}): RateLimitConfig => ({
  window: 60,
  max: 10,
  service: 'test',
  identifier: 'user:123',
  ...overrides
});

const createTestBackend = () => {
  return new MemoryRateLimitBackend();
};

describe('MemoryRateLimitBackend', () => {
  describe('checkLimit', () => {
    let memoryBackend: MemoryRateLimitBackend;

    beforeEach(() => {
      memoryBackend = createTestBackend();
    });

    describe('basic functionality', () => {
      it('should allow first request', async () => {
        const config = createTestConfig();

        const result = await memoryBackend.checkLimit('test-key', config);
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(9);
        expect(result.resetTime).toBeGreaterThan(Date.now() / 1000);
      });

      it('should block request exceeding limit', async () => {
        const config = createTestConfig({ max: 1 });

        // First request
        const result1 = await memoryBackend.checkLimit('test-key', config);
        expect(result1.allowed).toBe(true);

        // Second request (exceeds limit)
        const result2 = await memoryBackend.checkLimit('test-key', config);
        expect(result2.allowed).toBe(false);
        expect(result2.remaining).toBe(0);
        expect(result2.retryAfter).toBeGreaterThan(0);
      });

      it('should track multiple keys independently', async () => {
        const config = createTestConfig({ max: 1 });

        // Request for key1
        const result1 = await memoryBackend.checkLimit('key1', config);
        expect(result1.allowed).toBe(true);

        // Request for key2 (should be allowed)
        const result2 = await memoryBackend.checkLimit('key2', config);
        expect(result2.allowed).toBe(true);

        // Second request for key1 (should be blocked)
        const result3 = await memoryBackend.checkLimit('key1', config);
        expect(result3.allowed).toBe(false);
      });
    });

    describe('window expiration', () => {
      it('should reset after window expires', async () => {
        const config = createTestConfig({ window: 1, max: 1 }); // 1 second window

        // First request
        const result1 = await memoryBackend.checkLimit('test-key', config);
        expect(result1.allowed).toBe(true);

        // Second request (blocked)
        const result2 = await memoryBackend.checkLimit('test-key', config);
        expect(result2.allowed).toBe(false);

        // Wait for window to expire
        await new Promise(resolve => setTimeout(resolve, 1100));

        // Third request should be allowed again
        const result3 = await memoryBackend.checkLimit('test-key', config);
        expect(result3.allowed).toBe(true);
      });

      it('should handle sliding window correctly', async () => {
        const config = createTestConfig({ window: 2, max: 3 }); // 2 second window

        // Make 3 requests (all allowed)
        for (let i = 0; i < 3; i++) {
          const result = await memoryBackend.checkLimit('test-key', config);
          expect(result.allowed).toBe(true);
        }

        // Fourth request should be blocked
        const result4 = await memoryBackend.checkLimit('test-key', config);
        expect(result4.allowed).toBe(false);

        // Wait 1 second (still in window)
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Fifth request should still be blocked
        const result5 = await memoryBackend.checkLimit('test-key', config);
        expect(result5.allowed).toBe(false);

        // Wait another 1.5 seconds (window should be reset)
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Sixth request should be allowed
        const result6 = await memoryBackend.checkLimit('test-key', config);
        expect(result6.allowed).toBe(true);
      });
    });
  });

  describe('retry delay management', () => {
    let memoryBackend: MemoryRateLimitBackend;

    beforeEach(() => {
      memoryBackend = createTestBackend();
    });

    describe('setRetryDelay', () => {
      it('should set retry delay for service', async () => {
        await expect(memoryBackend.setRetryDelay('test-service', 60)).resolves.not.toThrow();
      });

      it('should handle multiple services', async () => {
        await memoryBackend.setRetryDelay('service1', 30);
        await memoryBackend.setRetryDelay('service2', 60);

        const delay1 = await memoryBackend.getRetryDelay('service1');
        const delay2 = await memoryBackend.getRetryDelay('service2');

        expect(delay1).toBe(30);
        expect(delay2).toBe(60);
      });
    });

    describe('getRetryDelay', () => {
      it('should return 0 for unknown service', async () => {
        const delay = await memoryBackend.getRetryDelay('unknown-service');
        expect(delay).toBe(0);
      });

      it('should return set delay for known service', async () => {
        await memoryBackend.setRetryDelay('test-service', 120);
        const delay = await memoryBackend.getRetryDelay('test-service');
        expect(delay).toBe(120);
      });
    });
  });

  describe('statistics and monitoring', () => {
    let memoryBackend: MemoryRateLimitBackend;

    beforeEach(() => {
      memoryBackend = createTestBackend();
    });

    describe('getStats', () => {
      it('should return initial statistics', async () => {
        const stats = await memoryBackend.getStats();
        expect(stats.totalRequests).toBe(0);
        expect(stats.allowedRequests).toBe(0);
        expect(stats.blockedRequests).toBe(0);
        expect(stats.fallbackCount).toBe(0);
        expect(stats.backend).toBe('memory');
        expect(stats.uptime).toBeGreaterThan(0);
      });

      it('should track requests correctly', async () => {
        const config = createTestConfig({ max: 1 });

        // Make some requests
        await memoryBackend.checkLimit('key1', config); // allowed
        await memoryBackend.checkLimit('key1', config); // blocked
        await memoryBackend.checkLimit('key2', config); // allowed

        const stats = await memoryBackend.getStats();
        expect(stats.totalRequests).toBe(3);
        expect(stats.allowedRequests).toBe(2);
        expect(stats.blockedRequests).toBe(1);
      });
    });

    describe('isHealthy', () => {
      it('should return true for memory backend', async () => {
        const healthy = await memoryBackend.isHealthy();
        expect(healthy).toBe(true);
      });
    });
  });

  describe('data management', () => {
    let memoryBackend: MemoryRateLimitBackend;

    beforeEach(() => {
      memoryBackend = createTestBackend();
    });

    describe('clear', () => {
      it('should clear all rate limiting data', async () => {
        const config = createTestConfig({ max: 1 });

        // Make a request
        await memoryBackend.checkLimit('test-key', config);

        // Set a retry delay
        await memoryBackend.setRetryDelay('test-service', 60);

        // Clear data
        await memoryBackend.clear();

        // Check stats are reset
        const stats = await memoryBackend.getStats();
        expect(stats.totalRequests).toBe(0);
        expect(stats.allowedRequests).toBe(0);
        expect(stats.blockedRequests).toBe(0);

        // Check retry delay is cleared
        const delay = await memoryBackend.getRetryDelay('test-service');
        expect(delay).toBe(0);
      });
    });
  });

  describe('error handling and edge cases', () => {
    let memoryBackend: MemoryRateLimitBackend;

    beforeEach(() => {
      memoryBackend = createTestBackend();
    });

    describe('error handling', () => {
      it('should handle invalid configuration gracefully', async () => {
        const config = createTestConfig({ window: -1 }); // Invalid window

        // Should not throw for memory backend
        await expect(memoryBackend.checkLimit('test-key', config)).resolves.not.toThrow();
      });

      it('should handle edge cases', async () => {
        const config = createTestConfig({ max: 0 }); // No requests allowed

        const result = await memoryBackend.checkLimit('test-key', config);
        expect(result.allowed).toBe(false);
        expect(result.remaining).toBe(0);
      });
    });

    describe('concurrent requests', () => {
      it('should handle concurrent requests correctly', async () => {
        const config = createTestConfig({ max: 5 });

        // Make concurrent requests
        const promises = Array.from({ length: 10 }, () =>
          memoryBackend.checkLimit('test-key', config)
        );

        const results = await Promise.all(promises);
        const allowed = results.filter(r => r.allowed).length;
        const blocked = results.filter(r => !r.allowed).length;

        expect(allowed).toBe(5); // Should allow exactly 5 requests
        expect(blocked).toBe(5); // Should block the rest
      });
    });
  });
}); 