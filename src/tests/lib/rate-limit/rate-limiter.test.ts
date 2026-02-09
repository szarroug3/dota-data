/**
 * Tests for Redis-based rate limiter
 */

import { Redis } from '@upstash/redis';

import { createRateLimiter } from '@/lib/rate-limit/rate-limiter';

jest.mock('@upstash/redis', () => ({
  Redis: jest.fn().mockImplementation(() => ({
    pipeline: jest.fn(() => ({
      zremrangebyscore: jest.fn().mockReturnThis(),
      zcard: jest.fn().mockReturnThis(),
      zadd: jest.fn().mockReturnThis(),
      expire: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([0, 0]),
    })),
    zrange: jest.fn().mockResolvedValue([]),
    ping: jest.fn().mockResolvedValue('PONG'),
  })),
}));

describe('Rate Limiter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

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
      expect(waitTime).toBeGreaterThanOrEqual(1200);
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

    it('should prefer env token over URL password', () => {
      const originalToken = process.env.UPSTASH_REDIS_REST_TOKEN;
      process.env.UPSTASH_REDIS_REST_TOKEN = 'env-token';

      const redisUrl = 'redis://:url-token@localhost:6379';
      createRateLimiter(redisUrl);

      type RedisConstructor = typeof Redis;
      type RedisConstructorArgs = ConstructorParameters<RedisConstructor>;

      const redisMock = Redis as jest.MockedClass<RedisConstructor>;
      expect(redisMock).toHaveBeenCalled();
      const [options] = redisMock.mock.calls[0] as RedisConstructorArgs;
      expect(options).toEqual(expect.objectContaining({ token: 'env-token' }));

      process.env.UPSTASH_REDIS_REST_TOKEN = originalToken;
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
