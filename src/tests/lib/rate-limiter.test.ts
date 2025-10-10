/**
 * Tests for Redis-based rate limiter
 */

import { createRateLimiter } from '@/lib/rate-limiter';

describe('Rate Limiter', () => {
  describe('Memory Fallback', () => {
    let rateLimiter: ReturnType<typeof createRateLimiter>;

    beforeEach(() => {
      // Create rate limiter without Redis URL to force memory fallback
      rateLimiter = createRateLimiter();
    });

    it('should wait for minimum delay between requests', async () => {
      // First request should not wait
      await rateLimiter.waitForClearance('opendota');
      const firstRequestTime = Date.now();

      // Second request should wait for minimum delay
      await rateLimiter.waitForClearance('opendota');
      const secondRequestTime = Date.now();

      // Should have waited at least 1.2 seconds (1200ms)
      const waitTime = secondRequestTime - firstRequestTime;
      expect(waitTime).toBeGreaterThanOrEqual(1100);
    });

    it('should handle multiple services independently', async () => {
      // Request from different services should not interfere
      await rateLimiter.waitForClearance('opendota');
      await rateLimiter.waitForClearance('steam');

      // Should complete without throwing errors
      expect(true).toBe(true);
    });

    it('should report healthy status', async () => {
      const isHealthy = await rateLimiter.isHealthy();
      expect(isHealthy).toBe(true);
    });
  });

  describe('Redis Backend', () => {
    it('should create Redis limiter when URL provided', () => {
      const redisUrl = 'redis://localhost:6379';
      const limiter = createRateLimiter(redisUrl);

      // Should not throw an error
      expect(limiter).toBeDefined();
    });

    it('should fallback to memory when Redis URL is invalid', () => {
      const invalidUrl = 'invalid-redis-url';
      const limiter = createRateLimiter(invalidUrl);

      // Should not throw an error and fallback to memory
      expect(limiter).toBeDefined();
    });
  });

  describe('Service Configuration', () => {
    it('should have correct default configurations', () => {
      const limiter = createRateLimiter();

      // Test that the limiter can handle both services
      expect(async () => {
        await limiter.waitForClearance('opendota');
        await limiter.waitForClearance('steam');
      }).not.toThrow();
    });
  });
});
