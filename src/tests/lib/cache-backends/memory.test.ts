/**
 * Memory cache backend tests
 */

import { MemoryCacheBackend } from '@/lib/cache-backends/memory';

function testGet(getCache: () => MemoryCacheBackend) {
  describe('get', () => {
    it('should return null for non-existent key', async () => {
      const result = await getCache().get('non-existent');
      expect(result).toBeNull();
    });
    it('should return cached value', async () => {
      const testData = { id: 1, name: 'test' };
      await getCache().set('test-key', testData);
      const result = await getCache().get('test-key');
      expect(result).toEqual(testData);
    });
    it('should return null for expired entry', async () => {
      await getCache().set('expired-key', 'value', 1);
      await new Promise((resolve) => setTimeout(resolve, 1100));
      const result = await getCache().get('expired-key');
      expect(result).toBeNull();
    });
    it('should update access metadata on get', async () => {
      const testData = { id: 1, name: 'test' };
      await getCache().set('test-key', testData);
      await getCache().get('test-key');
      const stats = await getCache().getStats();
      expect(stats.hitRate).toBe(1);
    });
  });
}

function testSet(getCache: () => MemoryCacheBackend) {
  describe('set', () => {
    it('should store value with default TTL', async () => {
      const testData = { id: 1, name: 'test' };
      await getCache().set('test-key', testData);
      const result = await getCache().get('test-key');
      expect(result).toEqual(testData);
    });
    it('should store value with custom TTL', async () => {
      const testData = { id: 1, name: 'test' };
      await getCache().set('test-key', testData, 5);
      const result = await getCache().get('test-key');
      expect(result).toEqual(testData);
    });
    it('should handle different data types', async () => {
      await getCache().set('string', 'test string');
      await getCache().set('number', 42);
      await getCache().set('boolean', true);
      await getCache().set('object', { key: 'value' });
      await getCache().set('array', [1, 2, 3]);
      expect(await getCache().get('string')).toBe('test string');
      expect(await getCache().get('number')).toBe(42);
      expect(await getCache().get('boolean')).toBe(true);
      expect(await getCache().get('object')).toEqual({ key: 'value' });
      expect(await getCache().get('array')).toEqual([1, 2, 3]);
    });
  });
}

function testDelete(getCache: () => MemoryCacheBackend) {
  describe('delete', () => {
    it('should return false for non-existent key', async () => {
      const result = await getCache().delete('non-existent');
      expect(result).toBe(false);
    });
    it('should return true and delete existing key', async () => {
      await getCache().set('test-key', 'test value');
      const result = await getCache().delete('test-key');
      expect(result).toBe(true);
      const getResult = await getCache().get('test-key');
      expect(getResult).toBeNull();
    });
  });
}

function testExists(getCache: () => MemoryCacheBackend) {
  describe('exists', () => {
    it('should return false for non-existent key', async () => {
      const result = await getCache().exists('non-existent');
      expect(result).toBe(false);
    });
    it('should return true for existing key', async () => {
      await getCache().set('test-key', 'test value');
      const result = await getCache().exists('test-key');
      expect(result).toBe(true);
    });
    it('should return false for expired key', async () => {
      await getCache().set('test-key', 'test value', 1);
      await new Promise((resolve) => setTimeout(resolve, 1100));
      const result = await getCache().exists('test-key');
      expect(result).toBe(false);
    });
  });
}

function testMget(getCache: () => MemoryCacheBackend) {
  describe('mget', () => {
    it('should return array of values for multiple keys', async () => {
      await getCache().set('key1', 'value1');
      await getCache().set('key2', 'value2');
      await getCache().set('key3', 'value3');
      const results = await getCache().mget(['key1', 'key2', 'key3', 'non-existent']);
      expect(results).toEqual(['value1', 'value2', 'value3', null]);
    });
    it('should handle empty array', async () => {
      const results = await getCache().mget([]);
      expect(results).toEqual([]);
    });
  });
}

function testMset(getCache: () => MemoryCacheBackend) {
  describe('mset', () => {
    it('should set multiple values', async () => {
      const entries = [
        { key: 'key1', value: 'value1', ttl: 10 },
        { key: 'key2', value: 'value2', ttl: 20 },
        { key: 'key3', value: 'value3' },
      ];
      await getCache().mset(entries);
      expect(await getCache().get('key1')).toBe('value1');
      expect(await getCache().get('key2')).toBe('value2');
      expect(await getCache().get('key3')).toBe('value3');
    });
  });
}

function testMdelete(getCache: () => MemoryCacheBackend) {
  describe('mdelete', () => {
    it('should delete multiple keys and return count', async () => {
      await getCache().set('key1', 'value1');
      await getCache().set('key2', 'value2');
      await getCache().set('key3', 'value3');
      const deletedCount = await getCache().mdelete(['key1', 'key2', 'non-existent']);
      expect(deletedCount).toBe(2);
      expect(await getCache().get('key1')).toBeNull();
      expect(await getCache().get('key2')).toBeNull();
      expect(await getCache().get('key3')).toBe('value3');
    });
  });
}

function testInvalidatePattern(getCache: () => MemoryCacheBackend) {
  describe('invalidatePattern', () => {
    it('should delete keys matching pattern', async () => {
      await getCache().set('user:1:profile', 'profile1');
      await getCache().set('user:2:profile', 'profile2');
      await getCache().set('team:1:info', 'team1');
      await getCache().set('user:3:settings', 'settings3');
      const deletedCount = await getCache().invalidatePattern('user:*');
      expect(deletedCount).toBe(3);
      expect(await getCache().get('user:1:profile')).toBeNull();
      expect(await getCache().get('user:2:profile')).toBeNull();
      expect(await getCache().get('user:3:settings')).toBeNull();
      expect(await getCache().get('team:1:info')).toBe('team1');
    });
    it('should handle wildcard patterns', async () => {
      await getCache().set('hero:1', 'hero1');
      await getCache().set('hero:2', 'hero2');
      await getCache().set('player:1', 'player1');
      const deletedCount = await getCache().invalidatePattern('hero:*');
      expect(deletedCount).toBe(2);
      expect(await getCache().get('hero:1')).toBeNull();
      expect(await getCache().get('hero:2')).toBeNull();
      expect(await getCache().get('player:1')).toBe('player1');
    });
  });
}

function testGetStats(getCache: () => MemoryCacheBackend) {
  describe('getStats', () => {
    it('should return accurate statistics', async () => {
      await getCache().set('key1', 'value1');
      await getCache().get('key1');
      await getCache().get('key2');
      await getCache().delete('key1');
      const stats = await getCache().getStats();
      expect(stats.keys).toBe(0);
      expect(stats.hitRate).toBe(0.5);
      expect(stats.missRate).toBe(0.5);
      expect(stats.uptime).toBeGreaterThanOrEqual(0);
    });
  });
}

function testClear(getCache: () => MemoryCacheBackend) {
  describe('clear', () => {
    it('should clear all cache data', async () => {
      await getCache().set('key1', 'value1');
      await getCache().set('key2', 'value2');
      await getCache().clear();
      expect(await getCache().get('key1')).toBeNull();
      expect(await getCache().get('key2')).toBeNull();
      const stats = await getCache().getStats();
      expect(stats.keys).toBe(0);
    });
  });
}

function testTTLBehavior(getCache: () => MemoryCacheBackend) {
  describe('TTL behavior', () => {
    it('should respect TTL values', async () => {
      await getCache().set('short', 'value', 1);
      await getCache().set('long', 'value', 10);
      await new Promise((resolve) => setTimeout(resolve, 1100));
      expect(await getCache().get('short')).toBeNull();
      expect(await getCache().get('long')).toBe('value');
    });
    it('should use default TTL when not specified', async () => {
      await getCache().set('default-ttl', 'value');
      const result = await getCache().get('default-ttl');
      expect(result).toBe('value');
    });
  });
}

describe('MemoryCacheBackend', () => {
  let cache: MemoryCacheBackend;
  beforeEach(() => {
    cache = new MemoryCacheBackend();
  });
  afterEach(() => {
    cache.destroy();
  });
  const getCache = () => cache;
  testGet(getCache);
  testSet(getCache);
  testDelete(getCache);
  testExists(getCache);
  testMget(getCache);
  testMset(getCache);
  testMdelete(getCache);
  testInvalidatePattern(getCache);
  testGetStats(getCache);
  testClear(getCache);
  testTTLBehavior(getCache);

  describe('isHealthy', () => {
    it('should return true when under memory limit', async () => {
      const healthyCache = new MemoryCacheBackend(1024 * 1024);
      const result = await healthyCache.isHealthy();
      expect(result).toBe(true);
      healthyCache.destroy();
    });
    it('should not store values that exceed the memory limit', async () => {
      const limitedCache = new MemoryCacheBackend(50);
      await limitedCache.set('key1', 'a'.repeat(1000));
      const exists = await limitedCache.exists('key1');
      expect(exists).toBe(false);
      const result = await limitedCache.isHealthy();
      expect(result).toBe(true);
      limitedCache.destroy();
    });
  });

  describe('memory management', () => {
    it('should evict oldest entries when memory limit is exceeded', async () => {
      const limitedCache = new MemoryCacheBackend(200);
      await limitedCache.set('key1', 'value1');
      await limitedCache.set('key2', 'value2');
      await limitedCache.set('key3', 'value3');
      const stats = await limitedCache.getStats();
      expect(stats.keys).toBeLessThan(3);
      limitedCache.destroy();
    });
  });
});
