/**
 * Redis rate limiting backend tests
 */

import { RedisRateLimitBackend } from '@/lib/rate-limit-backends/redis';
import { RateLimitConfig } from '@/lib/types/rate-limit';

// Helper functions
const createTestConfig = (overrides: Partial<RateLimitConfig> = {}): RateLimitConfig => ({
  window: 60,
  max: 10,
  service: 'test',
  identifier: 'user:123',
  ...overrides
});

const createTestBackend = (url: string = 'redis://localhost:6379') => {
  return new RedisRateLimitBackend(url);
};

const createUnavailableBackend = () => {
  return new RedisRateLimitBackend('invalid-url');
};

describe('RedisRateLimitBackend', () => {
  describe('initialization', () => {
    describe('constructor', () => {
      it('should initialize with valid Redis URL', () => {
        expect(() => createTestBackend()).not.toThrow();
      });

      it('should throw error with invalid Redis URL', () => {
        expect(() => new RedisRateLimitBackend('')).toThrow('Redis URL is required');
      });
    });
  });

  describe('checkLimit', () => {
    let redisBackend: RedisRateLimitBackend;

    beforeEach(() => {
      redisBackend = createTestBackend();
      // Reset simulated counts for each test
      (redisBackend as { resetSimulatedCounts: () => void }).resetSimulatedCounts();
    });

    describe('basic functionality', () => {
      it('should allow request within limits', async () => {
        const config = createTestConfig();

        const result = await redisBackend.checkLimit('test-key', config);
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(9);
        expect(result.resetTime).toBeGreaterThan(Date.now() / 1000);
      });

      it('should block request exceeding limits', async () => {
        const config = createTestConfig({ max: 1 });

        // First request should be allowed
        const result1 = await redisBackend.checkLimit('test-key', config);
        expect(result1.allowed).toBe(true);

        // Second request should be blocked
        const result2 = await redisBackend.checkLimit('test-key', config);
        expect(result2.allowed).toBe(false);
        expect(result2.remaining).toBe(0);
        expect(result2.retryAfter).toBeGreaterThan(0);
      });

      it('should track multiple keys independently', async () => {
        const config = createTestConfig({ max: 1 });

        // Request for key1
        const result1 = await redisBackend.checkLimit('key1', config);
        expect(result1.allowed).toBe(true);

        // Request for key2 (should be allowed)
        const result2 = await redisBackend.checkLimit('key2', config);
        expect(result2.allowed).toBe(true);

        // Second request for key1 (should be blocked)
        const result3 = await redisBackend.checkLimit('key1', config);
        expect(result3.allowed).toBe(false);
      });
    });

    describe('error handling', () => {
      it('should throw error when Redis is unavailable', async () => {
        const unavailableBackend = createUnavailableBackend();
        const config = createTestConfig();

        await expect(unavailableBackend.checkLimit('test-key', config))
          .rejects.toThrow('Redis rate limit check failed');
      });

      it('should handle invalid configuration gracefully', async () => {
        const config = createTestConfig({ window: -1 }); // Invalid window

        // Should not throw for Redis backend
        await expect(redisBackend.checkLimit('test-key', config)).resolves.not.toThrow();
      });
    });
  });

  describe('retry delay management', () => {
    let redisBackend: RedisRateLimitBackend;

    beforeEach(() => {
      redisBackend = createTestBackend();
    });

    describe('setRetryDelay', () => {
      it('should set retry delay for service', async () => {
        await expect(redisBackend.setRetryDelay('test-service', 60)).resolves.not.toThrow();
      });

      it('should throw error when Redis is unavailable', async () => {
        const unavailableBackend = createUnavailableBackend();
        await expect(unavailableBackend.setRetryDelay('test-service', 60))
          .rejects.toThrow('Failed to set retry delay');
      });
    });

    describe('getRetryDelay', () => {
      it('should return retry delay for service', async () => {
        const delay = await redisBackend.getRetryDelay('test-service');
        expect(delay).toBe(60); // Simulated value from implementation
      });

      it('should return 0 for unknown service', async () => {
        const delay = await redisBackend.getRetryDelay('unknown-service');
        expect(delay).toBe(0);
      });

      it('should throw error when Redis is unavailable', async () => {
        const unavailableBackend = createUnavailableBackend();
        await expect(unavailableBackend.getRetryDelay('test-service'))
          .rejects.toThrow('Failed to get retry delay');
      });
    });
  });

  describe('statistics and monitoring', () => {
    let redisBackend: RedisRateLimitBackend;

    beforeEach(() => {
      redisBackend = createTestBackend();
    });

    describe('getStats', () => {
      it('should return rate limiting statistics', async () => {
        const stats = await redisBackend.getStats();
        expect(stats).toHaveProperty('totalRequests');
        expect(stats).toHaveProperty('allowedRequests');
        expect(stats).toHaveProperty('blockedRequests');
        expect(stats).toHaveProperty('fallbackCount');
        expect(stats).toHaveProperty('uptime');
        expect(stats).toHaveProperty('backend');
        expect(stats.backend).toBe('redis');
      });

      it('should track requests correctly', async () => {
        const config = createTestConfig({ max: 1 });

        // Make some requests
        await redisBackend.checkLimit('key1', config); // allowed
        await redisBackend.checkLimit('key1', config); // blocked

        const stats = await redisBackend.getStats();
        expect(stats.totalRequests).toBe(2);
        expect(stats.allowedRequests).toBe(1);
        expect(stats.blockedRequests).toBe(1);
      });
    });

    describe('isHealthy', () => {
      it('should return true for healthy Redis backend', async () => {
        const healthy = await redisBackend.isHealthy();
        expect(healthy).toBe(true);
      });
    });
  });

  describe('data management', () => {
    let redisBackend: RedisRateLimitBackend;

    beforeEach(() => {
      redisBackend = createTestBackend();
    });

    describe('clear', () => {
      it('should clear all rate limiting data', async () => {
        const config = createTestConfig({ max: 1 });

        // Make a request
        await redisBackend.checkLimit('test-key', config);

        // Clear data
        await redisBackend.clear();

        // Check stats are reset
        const stats = await redisBackend.getStats();
        expect(stats.totalRequests).toBe(0);
        expect(stats.allowedRequests).toBe(0);
        expect(stats.blockedRequests).toBe(0);
      });

      it('should throw error when Redis is unavailable', async () => {
        const unavailableBackend = createUnavailableBackend();
        await expect(unavailableBackend.clear())
          .rejects.toThrow('Failed to clear Redis rate limit data');
      });
    });
  });

  describe('simulated Redis operations', () => {
    let redisBackend: RedisRateLimitBackend;

    beforeEach(() => {
      redisBackend = createTestBackend();
    });

    describe('GET operations', () => {
      it('should simulate Redis GET operations', async () => {
        const config = createTestConfig();

        // Test with unique key for GET simulation
        const result = await redisBackend.checkLimit('simulate-get-key', config);
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(4); // 10 max - 6 (5 existing + 1 new)
      });
    });

    describe('SET operations', () => {
      it('should simulate Redis SET operations', async () => {
        const config = createTestConfig();

        // This should trigger the simulated SET operation
        await expect(redisBackend.checkLimit('test-key', config)).resolves.not.toThrow();
      });
    });
  });

  describe('fallback behavior', () => {
    describe('error handling', () => {
      it('should handle Redis connection errors', async () => {
        const unavailableBackend = createUnavailableBackend();
        const config = createTestConfig();

        await expect(unavailableBackend.checkLimit('test-key', config))
          .rejects.toThrow('Redis rate limit check failed');
      });

      it('should handle Redis unavailability gracefully', async () => {
        const unavailableBackend = createUnavailableBackend();
        const config = createTestConfig();

        // Should throw but with proper error type
        await expect(unavailableBackend.checkLimit('test-key', config))
          .rejects.toThrow('Redis rate limit check failed');
      });
    });
  });
}); 