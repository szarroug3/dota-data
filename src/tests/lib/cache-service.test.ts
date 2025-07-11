import { CacheService } from '@/lib/cache-service';
import { CacheValue } from '@/types/cache';

describe('CacheService', () => {
  const testKey = 'test:key';
  const testValue: CacheValue = { foo: 'bar', num: 42 };

  it('should set and get a value using memory backend', async () => {
    const cache = new CacheService({ useRedis: false });
    await cache.set(testKey, testValue, 60);
    const result = await cache.get(testKey);
    expect(result).toEqual(testValue);
  });

  it('should delete a value using memory backend', async () => {
    const cache = new CacheService({ useRedis: false });
    await cache.set(testKey, testValue, 60);
    await cache.delete(testKey);
    const result = await cache.get(testKey);
    expect(result).toBeNull();
  });

  it('should fallback to memory backend if Redis is unavailable', async () => {
    // Simulate Redis unavailable by passing an invalid URL
    const cache = new CacheService({ useRedis: true, redisUrl: 'invalid-url', fallbackToMemory: true });
    await cache.set(testKey, testValue, 60);
    const result = await cache.get(testKey);
    expect(result).toEqual(testValue);
    expect(cache.getBackendType()).toBe('memory');
  });

  it('should use Redis backend if available (stub)', async () => {
    // This will use the stub Redis backend, which always misses
    const cache = new CacheService({ useRedis: true, redisUrl: 'redis://localhost:6379', fallbackToMemory: false });
    await cache.set(testKey, testValue, 60);
    const result = await cache.get(testKey);
    // Stub always returns null
    expect(result).toBeNull();
    expect(cache.getBackendType()).toBe('redis');
  });

  it('should support mset and mget', async () => {
    const cache = new CacheService({ useRedis: false });
    const entries = [
      { key: 'k1', value: 1 },
      { key: 'k2', value: 2 },
      { key: 'k3', value: 3 },
    ];
    await cache.mset(entries);
    const results = await cache.mget(['k1', 'k2', 'k3']);
    expect(results).toEqual([1, 2, 3]);
  });

  it('should clear all values', async () => {
    const cache = new CacheService({ useRedis: false });
    await cache.set('clear-key', 'value', 60);
    await cache.clear();
    const result = await cache.get('clear-key');
    expect(result).toBeNull();
  });
}); 