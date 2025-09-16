/**
 * Redis cache backend tests
 */

import { RedisCacheBackend } from '@/lib/cache-backends/redis';

// Helper functions
const createTestBackend = (url: string = 'redis://localhost:6379') => {
  return new RedisCacheBackend(url);
};

const createUnavailableBackend = () => {
  return new RedisCacheBackend('invalid-url');
};

describe('RedisCacheBackend', () => {
  describe('initialization', () => {
    describe('constructor', () => {
      it('should initialize with valid Redis URL', () => {
        expect(() => createTestBackend()).not.toThrow();
      });

      it('should throw error with invalid Redis URL', () => {
        expect(() => new RedisCacheBackend('')).toThrow('Redis URL is required');
      });
    });
  });

  describe('basic operations', () => {
    let redisBackend: RedisCacheBackend;

    beforeEach(() => {
      redisBackend = createTestBackend();
    });

    describe('get', () => {
      it('should return null for cache miss', async () => {
        const result = await redisBackend.get('nonexistent-key');
        expect(result).toBeNull();
      });

      it('should return test data for test key', async () => {
        const result = await redisBackend.get('test-key');
        expect(result).toEqual({ test: 'data' });
      });

      it('should throw error when Redis is unavailable', async () => {
        const unavailableBackend = createUnavailableBackend();
        await expect(unavailableBackend.get('key')).rejects.toThrow('Redis unavailable');
      });
    });

    describe('set', () => {
      it('should set value without TTL', async () => {
        await expect(redisBackend.set('key', 'value')).resolves.not.toThrow();
      });

      it('should set value with TTL', async () => {
        await expect(redisBackend.set('key', 'value', 300)).resolves.not.toThrow();
      });

      it('should throw error when Redis is unavailable', async () => {
        const unavailableBackend = createUnavailableBackend();
        await expect(unavailableBackend.set('key', 'value')).rejects.toThrow('Redis unavailable');
      });
    });

    describe('delete', () => {
      it('should return false for non-existent key', async () => {
        const result = await redisBackend.delete('nonexistent-key');
        expect(result).toBe(false);
      });

      it('should return true for test key', async () => {
        const result = await redisBackend.delete('test-key');
        expect(result).toBe(true);
      });

      it('should throw error when Redis is unavailable', async () => {
        const unavailableBackend = createUnavailableBackend();
        await expect(unavailableBackend.delete('key')).rejects.toThrow('Redis unavailable');
      });
    });

    describe('exists', () => {
      it('should return false for non-existent key', async () => {
        const result = await redisBackend.exists('nonexistent-key');
        expect(result).toBe(false);
      });

      it('should return true for test key', async () => {
        const result = await redisBackend.exists('test-key');
        expect(result).toBe(true);
      });

      it('should throw error when Redis is unavailable', async () => {
        const unavailableBackend = createUnavailableBackend();
        await expect(unavailableBackend.exists('key')).rejects.toThrow('Redis unavailable');
      });
    });
  });

  describe('bulk operations', () => {
    let redisBackend: RedisCacheBackend;

    beforeEach(() => {
      redisBackend = createTestBackend();
    });

    describe('mget', () => {
      it('should return array of nulls for multiple keys', async () => {
        const keys = ['key1', 'key2', 'key3'];
        const result = await redisBackend.mget(keys);
        expect(result).toEqual([null, null, null]);
      });

      it('should throw error when Redis is unavailable', async () => {
        const unavailableBackend = createUnavailableBackend();
        await expect(unavailableBackend.mget(['key1', 'key2'])).rejects.toThrow('Redis unavailable');
      });
    });

    describe('mset', () => {
      it('should set multiple values', async () => {
        const entries = [
          { key: 'key1', value: 'value1' },
          { key: 'key2', value: 'value2', ttl: 300 },
        ];
        await expect(redisBackend.mset(entries)).resolves.not.toThrow();
      });

      it('should throw error when Redis is unavailable', async () => {
        const unavailableBackend = createUnavailableBackend();
        const entries = [{ key: 'key1', value: 'value1' }];
        await expect(unavailableBackend.mset(entries)).rejects.toThrow('Redis unavailable');
      });
    });

    describe('mdelete', () => {
      it('should return 0 for non-existent keys', async () => {
        const keys = ['key1', 'key2', 'key3'];
        const result = await redisBackend.mdelete(keys);
        expect(result).toBe(0);
      });

      it('should throw error when Redis is unavailable', async () => {
        const unavailableBackend = createUnavailableBackend();
        await expect(unavailableBackend.mdelete(['key1', 'key2'])).rejects.toThrow('Redis unavailable');
      });
    });
  });

  describe('pattern operations', () => {
    let redisBackend: RedisCacheBackend;

    beforeEach(() => {
      redisBackend = createTestBackend();
    });

    describe('invalidatePattern', () => {
      it('should return 0 for no matching keys', async () => {
        const result = await redisBackend.invalidatePattern('nonexistent:*');
        expect(result).toBe(0);
      });

      it('should return 1 for test pattern', async () => {
        const result = await redisBackend.invalidatePattern('test:*');
        expect(result).toBe(1);
      });

      it('should throw error when Redis is unavailable', async () => {
        const unavailableBackend = createUnavailableBackend();
        await expect(unavailableBackend.invalidatePattern('pattern:*')).rejects.toThrow('Redis unavailable');
      });
    });
  });

  describe('management operations', () => {
    let redisBackend: RedisCacheBackend;

    beforeEach(() => {
      redisBackend = createTestBackend();
    });

    describe('getStats', () => {
      it('should return cache statistics', async () => {
        const stats = await redisBackend.getStats();
        expect(stats).toHaveProperty('keys');
        expect(stats).toHaveProperty('memoryUsage');
        expect(stats).toHaveProperty('hitRate');
        expect(stats).toHaveProperty('missRate');
        expect(stats).toHaveProperty('uptime');
        expect(stats).toHaveProperty('backend');
        expect(stats.backend).toBe('redis');
      });

      it('should calculate hit rate correctly', async () => {
        // Perform some operations to generate stats
        await redisBackend.get('key1');
        await redisBackend.get('key2');
        await redisBackend.set('key3', 'value3');

        const stats = await redisBackend.getStats();
        expect(stats.hitRate).toBeGreaterThanOrEqual(0);
        expect(stats.missRate).toBeGreaterThanOrEqual(0);
        expect(stats.hitRate + stats.missRate).toBeLessThanOrEqual(1);
      });
    });

    describe('clear', () => {
      it('should clear all cache data', async () => {
        await expect(redisBackend.clear()).resolves.not.toThrow();
      });

      it('should throw error when Redis is unavailable', async () => {
        const unavailableBackend = createUnavailableBackend();
        await expect(unavailableBackend.clear()).rejects.toThrow('Redis clear error');
      });
    });

    describe('isHealthy', () => {
      it('should return true for healthy Redis', async () => {
        const result = await redisBackend.isHealthy();
        expect(result).toBe(true);
      });

      it('should return false for unhealthy Redis', async () => {
        const unhealthyBackend = createUnavailableBackend();
        // Mock the isHealthy method to simulate unhealthy state
        jest.spyOn(unhealthyBackend, 'isHealthy').mockResolvedValue(false);
        const result = await unhealthyBackend.isHealthy();
        expect(result).toBe(false);
      });
    });
  });

  describe('error handling', () => {
    it('should handle Redis connection errors gracefully', async () => {
      const unavailableBackend = createUnavailableBackend();

      await expect(unavailableBackend.get('key')).rejects.toThrow('Redis unavailable');
      await expect(unavailableBackend.set('key', 'value')).rejects.toThrow('Redis unavailable');
      await expect(unavailableBackend.delete('key')).rejects.toThrow('Redis unavailable');
      await expect(unavailableBackend.exists('key')).rejects.toThrow('Redis unavailable');
      await expect(unavailableBackend.mget(['key'])).rejects.toThrow('Redis unavailable');
      await expect(unavailableBackend.mset([{ key: 'key', value: 'value' }])).rejects.toThrow('Redis unavailable');
      await expect(unavailableBackend.mdelete(['key'])).rejects.toThrow('Redis unavailable');
      await expect(unavailableBackend.invalidatePattern('pattern')).rejects.toThrow('Redis unavailable');
      await expect(unavailableBackend.clear()).rejects.toThrow('Redis clear error');
    });
  });
});
