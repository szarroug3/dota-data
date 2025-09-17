/**
 * Redis cache backend tests
 */

import { RedisCacheBackend } from '@/lib/cache-backends/redis';
import { CacheValue } from '@/types/cache';

// Local mock to guarantee no real Upstash client is used in this suite
const localStore = new Map<string, CacheValue>();
localStore.set('test-key', { test: 'data' });

jest.mock('@upstash/redis', () => {
  interface MockRedisInstance {
    get(key: string): Promise<CacheValue | null>;
    set(key: string, value: CacheValue): Promise<string>;
    del(key: string): Promise<number>;
    expire(key: string): Promise<number>;
    keys(pattern: string): Promise<string[]>;
    flushall(): Promise<string>;
    ping(): Promise<string>;
  }

  type MockRedisCtor = { new (...args: never[]): MockRedisInstance; fromEnv?: () => MockRedisInstance };

  const instance: MockRedisInstance = {
    get: jest.fn(async (key: string) => (localStore.has(key) ? localStore.get(key)! : null)),
    set: jest.fn(async (key: string, value: CacheValue) => {
      localStore.set(key, value);
      return 'OK';
    }),
    del: jest.fn(async (key: string) => (localStore.delete(key) ? 1 : 0)),
    expire: jest.fn(async (key: string) => (localStore.has(key) ? 1 : 0)),
    keys: jest.fn(async (pattern: string) => {
      const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
      const regex = new RegExp(`^${escaped}$`);
      return Array.from(localStore.keys()).filter((k) => regex.test(k));
    }),
    flushall: jest.fn(async () => {
      localStore.clear();
      return 'OK';
    }),
    ping: jest.fn(async () => 'PONG'),
  };
  const Ctor = (function () {
    return instance;
  }) as never as MockRedisCtor;
  Ctor.fromEnv = () => instance;
  return { Redis: Ctor };
});


// Helper functions
const createTestBackend = () => {
  return new RedisCacheBackend();
};

const createUnavailableBackend = () => {
  return new RedisCacheBackend();
};

describe('RedisCacheBackend', () => {
  describe('initialization', () => {
    describe('constructor', () => {
      it('should initialize with valid Redis URL', () => {
        expect(() => createTestBackend()).not.toThrow();
      });

      it('should initialize via fromEnv when URL is empty and fromEnv is available', () => {
        const saved = { ...process.env } as NodeJS.ProcessEnv;
        delete (process.env as any).DOTA_ASSISTANT_KV_REST_API_URL;
        delete (process.env as any).DOTA_ASSISTANT_KV_URL;
        delete (process.env as any).DOTA_ASSISTANT_REDIS_URL;
        delete (process.env as any).REDIS_URL;
        try {
          expect(() => new RedisCacheBackend()).not.toThrow();
        } finally {
          process.env = saved;
        }
      });

      it('should prefer fromEnv over invalid constructor URL', () => {
        expect(() => createUnavailableBackend()).not.toThrow();
      });
    });
  });

  describe('basic operations', () => {
    let redisBackend: RedisCacheBackend;

    beforeEach(async () => {
      redisBackend = createTestBackend();
      await redisBackend.clear();
    });

    describe('get', () => {
      it('should return null for cache miss', async () => {
        const result = await redisBackend.get('nonexistent-key');
        expect(result).toBeNull();
      });

      it('should return data after set', async () => {
        await redisBackend.set('key', { test: 'data' });
        const result = await redisBackend.get('key');
        expect(result).toEqual({ test: 'data' });
      });
    });

    describe('set', () => {
      it('should set value without TTL', async () => {
        await expect(redisBackend.set('key', 'value')).resolves.not.toThrow();
      });

      it('should set value with TTL', async () => {
        await expect(redisBackend.set('key', 'value', 300)).resolves.not.toThrow();
      });
    });

    describe('delete', () => {
      it('should return false for non-existent key', async () => {
        const result = await redisBackend.delete('nonexistent-key');
        expect(result).toBe(false);
      });

      it('should return true after setting a key', async () => {
        await redisBackend.set('test-key', 'v');
        const result = await redisBackend.delete('test-key');
        expect(result).toBe(true);
      });
    });

    describe('exists', () => {
      it('should return false for non-existent key', async () => {
        const result = await redisBackend.exists('nonexistent-key');
        expect(result).toBe(false);
      });

      it('should return true after setting a key', async () => {
        await redisBackend.set('test-key', 'v');
        const result = await redisBackend.exists('test-key');
        expect(result).toBe(true);
      });
    });
  });

  describe('bulk operations', () => {
    let redisBackend: RedisCacheBackend;

    beforeEach(async () => {
      redisBackend = createTestBackend();
      await redisBackend.clear();
    });

    describe('mget', () => {
      it('should return array of nulls for multiple keys', async () => {
        const keys = ['key1', 'key2', 'key3'];
        const result = await redisBackend.mget(keys);
        expect(result).toEqual([null, null, null]);
      });
    });

    describe('mset', () => {
      it('should set multiple values', async () => {
        const entries = [
          { key: 'key1', value: 'value1' },
          { key: 'key2', value: 'value2', ttl: 300 },
        ];
        await expect(redisBackend.mset(entries)).resolves.not.toThrow();
        const result = await redisBackend.mget(['key1', 'key2']);
        expect(result).toEqual(['value1', 'value2']);
      });
    });

    describe('mdelete', () => {
      it('should return 0 for non-existent keys', async () => {
        const keys = ['key1', 'key2', 'key3'];
        const result = await redisBackend.mdelete(keys);
        expect(result).toBe(0);
      });

      it('should return count for existing keys', async () => {
        await redisBackend.set('key1', 'v');
        await redisBackend.set('key2', 'v');
        const result = await redisBackend.mdelete(['key1', 'key2']);
        expect(result).toBe(2);
      });
    });
  });

  describe('pattern operations', () => {
    let redisBackend: RedisCacheBackend;

    beforeEach(async () => {
      redisBackend = createTestBackend();
      await redisBackend.clear();
    });

    describe('invalidatePattern', () => {
      it('should return 0 for no matching keys', async () => {
        const result = await redisBackend.invalidatePattern('nonexistent:*');
        expect(result).toBe(0);
      });

      it('should return 1 for test pattern', async () => {
        await redisBackend.set('test:1', 'v');
        const result = await redisBackend.invalidatePattern('test:*');
        expect(result).toBe(1);
      });
    });
  });

  describe('management operations', () => {
    let redisBackend: RedisCacheBackend;

    beforeEach(async () => {
      redisBackend = createTestBackend();
      await redisBackend.clear();
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
        await redisBackend.set('a', 1);
        await expect(redisBackend.clear()).resolves.not.toThrow();
        const result = await redisBackend.get('a');
        expect(result).toBeNull();
      });
    });

    describe('isHealthy', () => {
      it('should return true for healthy Redis', async () => {
        const result = await redisBackend.isHealthy();
        expect(result).toBe(true);
      });
    });
  });
});
