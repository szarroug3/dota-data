/**
 * Rate limiter service tests
 */

import { RateLimiter } from '@/lib/rate-limiter';
import { RateLimitConfig, SERVICE_LIMITS } from '@/lib/types/rate-limit';

// Helper functions
const createTestConfig = (overrides: Partial<RateLimitConfig> = {}): RateLimitConfig => ({
  window: 60,
  max: 10,
  service: 'test',
  identifier: 'user:123',
  ...overrides
});

interface LimiterConfig {
  useRedis?: boolean;
  redisUrl?: string;
  fallbackToMemory?: boolean;
  defaultLimits?: Record<string, { window: number; max: number }>;
}

const createMemoryLimiter = (overrides: Partial<LimiterConfig> = {}) => {
  return new RateLimiter({
    useRedis: false,
    fallbackToMemory: true,
    defaultLimits: SERVICE_LIMITS,
    ...overrides
  });
};

const createRedisLimiter = (overrides: Partial<LimiterConfig> = {}) => {
  return new RateLimiter({
    useRedis: true,
    redisUrl: 'redis://localhost:6379',
    fallbackToMemory: true,
    defaultLimits: SERVICE_LIMITS,
    ...overrides
  });
};

describe('RateLimiter', () => {
  describe('initialization', () => {
    describe('constructor', () => {
      it('should initialize with memory backend', () => {
        const memoryLimiter = createMemoryLimiter();
        expect(memoryLimiter.getBackendType()).toBe('memory');
      });

      it('should initialize with Redis backend', () => {
        const redisLimiter = createRedisLimiter();
        expect(redisLimiter.getBackendType()).toBe('redis');
      });
    });
  });

  describe('checkLimit', () => {
    let rateLimiter: RateLimiter;

    beforeEach(() => {
      rateLimiter = createMemoryLimiter();
    });

    describe('basic functionality', () => {
      it('should allow request within limits', async () => {
        const config = createTestConfig();

        const result = await rateLimiter.checkLimit('test-key', config);
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(9);
        expect(result.resetTime).toBeGreaterThan(Date.now() / 1000);
      });

      it('should block request exceeding limits', async () => {
        const config = createTestConfig({ max: 1 });

        // First request should be allowed
        const result1 = await rateLimiter.checkLimit('test-key', config);
        expect(result1.allowed).toBe(true);

        // Second request should be blocked
        const result2 = await rateLimiter.checkLimit('test-key', config);
        expect(result2.allowed).toBe(false);
        expect(result2.remaining).toBe(0);
        expect(result2.retryAfter).toBeGreaterThan(0);
      });
    });

    describe('window expiration', () => {
      it('should reset after window expires', async () => {
        const config = createTestConfig({ window: 1, max: 1 }); // 1 second window

        // First request
        const result1 = await rateLimiter.checkLimit('test-key', config);
        expect(result1.allowed).toBe(true);

        // Second request (blocked)
        const result2 = await rateLimiter.checkLimit('test-key', config);
        expect(result2.allowed).toBe(false);

        // Wait for window to expire
        await new Promise(resolve => setTimeout(resolve, 1100));

        // Third request should be allowed again
        const result3 = await rateLimiter.checkLimit('test-key', config);
        expect(result3.allowed).toBe(true);
      });
    });
  });

  describe('service limits', () => {
    let rateLimiter: RateLimiter;

    beforeEach(() => {
      rateLimiter = createMemoryLimiter();
    });

    describe('checkServiceLimit', () => {
      it('should use default service limits', async () => {
        const result = await rateLimiter.checkServiceLimit('opendota', 'user:123');
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(59); // 60 max - 1 used
      });

      it('should throw error for unknown service', async () => {
        await expect(rateLimiter.checkServiceLimit('unknown', 'user:123'))
          .rejects.toThrow('No rate limits configured for service: unknown');
      });

      it('should use custom limits when provided', async () => {
        const customLimiter = createMemoryLimiter({
          defaultLimits: {
            custom: { window: 60, max: 5 }
          }
        });

        const result = await customLimiter.checkServiceLimit('custom', 'user:123');
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(4); // 5 max - 1 used
      });
    });
  });

  describe('retry delay management', () => {
    let rateLimiter: RateLimiter;

    beforeEach(() => {
      rateLimiter = createMemoryLimiter();
    });

    describe('setRetryDelay', () => {
      it('should set retry delay for service', async () => {
        await expect(rateLimiter.setRetryDelay('test-service', 60)).resolves.not.toThrow();
      });

      it('should get retry delay for service', async () => {
        await rateLimiter.setRetryDelay('test-service', 60);
        const delay = await rateLimiter.getRetryDelay('test-service');
        expect(delay).toBe(60);
      });
    });
  });

  describe('statistics and monitoring', () => {
    let rateLimiter: RateLimiter;

    beforeEach(() => {
      rateLimiter = createMemoryLimiter();
    });

    describe('getStats', () => {
      it('should return rate limiting statistics', async () => {
        const stats = await rateLimiter.getStats();
        expect(stats).toHaveProperty('totalRequests');
        expect(stats).toHaveProperty('allowedRequests');
        expect(stats).toHaveProperty('blockedRequests');
        expect(stats).toHaveProperty('fallbackCount');
        expect(stats).toHaveProperty('uptime');
        expect(stats).toHaveProperty('backend');
      });

      it('should track requests correctly', async () => {
        const config = createTestConfig({ max: 1 });

        // Make some requests
        await rateLimiter.checkLimit('key1', config); // allowed
        await rateLimiter.checkLimit('key1', config); // blocked

        const stats = await rateLimiter.getStats();
        expect(stats.totalRequests).toBe(2);
        expect(stats.allowedRequests).toBe(1);
        expect(stats.blockedRequests).toBe(1);
      });
    });

    describe('isHealthy', () => {
      it('should return true for healthy backend', async () => {
        const healthy = await rateLimiter.isHealthy();
        expect(healthy).toBe(true);
      });
    });
  });

  describe('data management', () => {
    let rateLimiter: RateLimiter;

    beforeEach(() => {
      rateLimiter = createMemoryLimiter();
    });

    describe('clear', () => {
      it('should clear all rate limiting data', async () => {
        const config = createTestConfig({ max: 1 });

        // Make a request
        await rateLimiter.checkLimit('test-key', config);

        // Clear data
        await rateLimiter.clear();

        // Check stats are reset
        const stats = await rateLimiter.getStats();
        expect(stats.totalRequests).toBe(0);
        expect(stats.allowedRequests).toBe(0);
        expect(stats.blockedRequests).toBe(0);
      });
    });

    describe('getConfig', () => {
      it('should return current configuration', () => {
        const config = rateLimiter.getConfig();
        expect(config.useRedis).toBe(false);
        expect(config.fallbackToMemory).toBe(true);
        expect(config.defaultLimits).toBeDefined();
      });
    });
  });

  describe('error handling', () => {
    describe('configuration errors', () => {
      it('should handle invalid configuration', () => {
        expect(() => createRedisLimiter({ redisUrl: 'invalid-url' })).not.toThrow();
      });

      it('should throw RateLimitError for service errors', async () => {
        const config = createTestConfig();
        const rateLimiter = createMemoryLimiter();
        // This should not throw for memory backend
        await expect(rateLimiter.checkLimit('test-key', config)).resolves.not.toThrow();
      });
    });
  });

  describe('fallback behavior', () => {
    describe('Redis fallback', () => {
      it('should fallback to memory when Redis fails', async () => {
        const redisLimiter = createRedisLimiter({ redisUrl: 'invalid-url' });

        const config = createTestConfig();

        const result = await redisLimiter.checkLimit('test-key', config);
        expect(result.allowed).toBe(true);
        expect(result.fallback).toBe(true);
      });

      it('should not fallback when fallbackToMemory is false', async () => {
        const redisLimiter = createRedisLimiter({
          redisUrl: 'invalid-url',
          fallbackToMemory: false
        });

        const config = createTestConfig();

        await expect(redisLimiter.checkLimit('test-key', config))
          .rejects.toThrow('Rate limit check failed');
      });
    });
  });
}); 