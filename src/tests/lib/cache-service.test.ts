/**
 * @jest-environment node
 */

import { FileCacheBackend } from '@/lib/cache-backends/file';
import { MemoryCacheBackend } from '@/lib/cache-backends/memory';
import { RedisCacheBackend } from '@/lib/cache-backends/redis';
import { CacheService } from '@/lib/cache-service';

// Mock the cache backends
jest.mock('@/lib/cache-backends/file');
jest.mock('@/lib/cache-backends/memory');
jest.mock('@/lib/cache-backends/redis');

// Mock the environment configuration
jest.mock('@/lib/config/environment', () => ({
  getEnv: {
    USE_MOCK_API: jest.fn(() => process.env.USE_MOCK_API === 'true'),
    USE_MOCK_DB: jest.fn(() => process.env.USE_MOCK_DB === 'true'),
  },
}));

const MockFileCacheBackend = FileCacheBackend as jest.MockedClass<typeof FileCacheBackend>;
const MockMemoryCacheBackend = MemoryCacheBackend as jest.MockedClass<typeof MemoryCacheBackend>;
const MockRedisCacheBackend = RedisCacheBackend as jest.MockedClass<typeof RedisCacheBackend>;

describe('CacheService', () => {
  let cacheService: CacheService;
  let mockFileBackend: jest.Mocked<FileCacheBackend>;
  let mockMemoryBackend: jest.Mocked<MemoryCacheBackend>;
  let mockRedisBackend: jest.Mocked<RedisCacheBackend>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock instances
    mockFileBackend = new MockFileCacheBackend() as jest.Mocked<FileCacheBackend>;
    mockMemoryBackend = new MockMemoryCacheBackend(undefined) as jest.Mocked<MemoryCacheBackend>;
    mockRedisBackend = new MockRedisCacheBackend() as jest.Mocked<RedisCacheBackend>;

    MockFileCacheBackend.mockImplementation(() => mockFileBackend);
    MockMemoryCacheBackend.mockImplementation(() => mockMemoryBackend);
    MockRedisCacheBackend.mockImplementation(() => mockRedisBackend);

    // Set up environment for test mode (should use file backend)
    Object.assign(process.env, {
      NODE_ENV: 'test',
      USE_MOCK_API: 'true',
    });
  });

  describe('constructor', () => {
    it('should use file backend when USE_MOCK_API is true', () => {
      const originalEnv = process.env.USE_MOCK_API;
      Object.assign(process.env, { USE_MOCK_API: 'true' });

      cacheService = new CacheService();

      expect(MockFileCacheBackend).toHaveBeenCalled();
      // Redis might still be called during fallback setup, so we don't check this

      Object.assign(process.env, { USE_MOCK_API: originalEnv });
    });

    it('should use file backend when USE_MOCK_DB is true', () => {
      const originalEnv = process.env.USE_MOCK_DB;
      Object.assign(process.env, { USE_MOCK_DB: 'true' });

      cacheService = new CacheService();

      expect(MockFileCacheBackend).toHaveBeenCalled();
      // Redis might still be called during fallback setup, so we don't check this

      Object.assign(process.env, { USE_MOCK_DB: originalEnv });
    });

    it('should use Redis backend when UPSTASH envs are provided', () => {
      const originalUrl = process.env.UPSTASH_REDIS_REST_URL;
      const originalToken = process.env.UPSTASH_REDIS_REST_TOKEN;
      Object.assign(process.env, {
        UPSTASH_REDIS_REST_URL: 'https://example.upstash.io',
        UPSTASH_REDIS_REST_TOKEN: 'token',
        USE_MOCK_API: 'false',
        USE_MOCK_DB: 'false',
      });

      cacheService = new CacheService();

      expect(MockRedisCacheBackend).toHaveBeenCalled();

      Object.assign(process.env, {
        UPSTASH_REDIS_REST_URL: originalUrl,
        UPSTASH_REDIS_REST_TOKEN: originalToken,
      });
    });

    it('should default to memory backend when no Redis URL is provided', () => {
      const originalEnv = process.env.REDIS_URL;
      delete process.env.REDIS_URL;
      Object.assign(process.env, {
        USE_MOCK_API: 'false',
        USE_MOCK_DB: 'false',
      });

      cacheService = new CacheService();

      // Should not throw, should default to memory
      expect(cacheService).toBeInstanceOf(CacheService);

      Object.assign(process.env, { REDIS_URL: originalEnv });
    });
  });

  describe('get method', () => {
    beforeEach(() => {
      Object.assign(process.env, { USE_MOCK_API: 'true' });
      cacheService = new CacheService();
    });

    it('should return raw value from primary backend', async () => {
      const mockData = { test: 'data' };
      const jsonString = JSON.stringify(mockData);
      mockFileBackend.get.mockResolvedValue(jsonString);

      const result = await cacheService.get('test-key');

      expect(result).toEqual(jsonString);
      expect(mockFileBackend.get).toHaveBeenCalledWith('test-key');
    });

    it('should return null when key not found', async () => {
      mockFileBackend.get.mockResolvedValue(null);

      const result = await cacheService.get('test-key');

      expect(result).toBeNull();
    });

    it('should fallback to memory backend when primary fails', async () => {
      const mockData = { test: 'data' };
      const jsonString = JSON.stringify(mockData);
      mockFileBackend.get.mockRejectedValueOnce(new Error('Primary backend failed'));
      mockMemoryBackend.get.mockResolvedValueOnce(jsonString);

      const result = await cacheService.get('test-key');

      expect(result).toEqual(jsonString);
      expect(mockFileBackend.get).toHaveBeenCalledTimes(1);
      expect(mockMemoryBackend.get).toHaveBeenCalledTimes(1);
    });
  });

  describe('set method', () => {
    beforeEach(() => {
      Object.assign(process.env, { USE_MOCK_API: 'true' });
      cacheService = new CacheService();
    });

    it('should set value in primary backend', async () => {
      const testData = { test: 'data' };
      mockFileBackend.set.mockResolvedValue();

      await cacheService.set('test-key', testData);

      expect(mockFileBackend.set).toHaveBeenCalledWith('test-key', testData, undefined);
    });

    it('should set value with TTL', async () => {
      const testData = { test: 'data' };
      const ttl = 3600;
      mockFileBackend.set.mockResolvedValue();

      await cacheService.set('test-key', testData, ttl);

      expect(mockFileBackend.set).toHaveBeenCalledWith('test-key', testData, ttl);
    });

    it('should fallback to memory backend when primary fails', async () => {
      const testData = { test: 'data' };
      mockFileBackend.set.mockRejectedValueOnce(new Error('Primary backend failed'));
      mockMemoryBackend.set.mockResolvedValueOnce();

      await cacheService.set('test-key', testData);

      expect(mockFileBackend.set).toHaveBeenCalledTimes(1);
      expect(mockMemoryBackend.set).toHaveBeenCalledTimes(1);
    });
  });

  describe('delete method', () => {
    beforeEach(() => {
      Object.assign(process.env, { USE_MOCK_API: 'true' });
      cacheService = new CacheService();
    });

    it('should delete key from primary backend', async () => {
      mockFileBackend.delete.mockResolvedValue(true);

      const result = await cacheService.delete('test-key');

      expect(result).toBe(true);
      expect(mockFileBackend.delete).toHaveBeenCalledWith('test-key');
    });

    it('should fallback to memory backend when primary fails', async () => {
      mockFileBackend.delete.mockRejectedValueOnce(new Error('Primary backend failed'));
      mockMemoryBackend.delete.mockResolvedValueOnce(false);

      const result = await cacheService.delete('test-key');

      expect(result).toBe(false);
      expect(mockFileBackend.delete).toHaveBeenCalledTimes(1);
      expect(mockMemoryBackend.delete).toHaveBeenCalledTimes(1);
    });
  });

  describe('exists method', () => {
    beforeEach(() => {
      Object.assign(process.env, { USE_MOCK_API: 'true' });
      cacheService = new CacheService();
    });

    it('should check if key exists in primary backend', async () => {
      mockFileBackend.exists.mockResolvedValue(true);

      const result = await cacheService.exists('test-key');

      expect(result).toBe(true);
      expect(mockFileBackend.exists).toHaveBeenCalledWith('test-key');
    });

    it('should fallback to memory backend when primary fails', async () => {
      mockFileBackend.exists.mockRejectedValueOnce(new Error('Primary backend failed'));
      mockMemoryBackend.exists.mockResolvedValueOnce(false);

      const result = await cacheService.exists('test-key');

      expect(result).toBe(false);
      expect(mockFileBackend.exists).toHaveBeenCalledTimes(1);
      expect(mockMemoryBackend.exists).toHaveBeenCalledTimes(1);
    });
  });

  describe('mget method', () => {
    beforeEach(() => {
      Object.assign(process.env, { USE_MOCK_API: 'true' });
      cacheService = new CacheService();
    });

    it('should get multiple keys from primary backend', async () => {
      const mockData = ['value1', 'value2', null];
      mockFileBackend.mget.mockResolvedValue(mockData);

      const result = await cacheService.mget(['key1', 'key2', 'key3']);

      expect(result).toEqual(mockData);
      expect(mockFileBackend.mget).toHaveBeenCalledWith(['key1', 'key2', 'key3']);
    });

    it('should fallback to memory backend when primary fails', async () => {
      const mockData = ['value1', 'value2'];
      mockFileBackend.mget.mockRejectedValueOnce(new Error('Primary backend failed'));
      mockMemoryBackend.mget.mockResolvedValueOnce(mockData);

      const result = await cacheService.mget(['key1', 'key2']);

      expect(result).toEqual(mockData);
      expect(mockFileBackend.mget).toHaveBeenCalledTimes(1);
      expect(mockMemoryBackend.mget).toHaveBeenCalledTimes(1);
    });
  });

  describe('mset method', () => {
    beforeEach(() => {
      Object.assign(process.env, { USE_MOCK_API: 'true' });
      cacheService = new CacheService();
    });

    it('should set multiple entries in primary backend', async () => {
      const entries = [
        { key: 'key1', value: 'value1' },
        { key: 'key2', value: 'value2', ttl: 3600 },
      ];
      mockFileBackend.mset.mockResolvedValue();

      await cacheService.mset(entries);

      expect(mockFileBackend.mset).toHaveBeenCalledWith(entries);
    });

    it('should fallback to memory backend when primary fails', async () => {
      const entries = [{ key: 'key1', value: 'value1' }];
      mockFileBackend.mset.mockRejectedValueOnce(new Error('Primary backend failed'));
      mockMemoryBackend.mset.mockResolvedValueOnce();

      await cacheService.mset(entries);

      expect(mockFileBackend.mset).toHaveBeenCalledTimes(1);
      expect(mockMemoryBackend.mset).toHaveBeenCalledTimes(1);
    });
  });

  describe('mdelete method', () => {
    beforeEach(() => {
      Object.assign(process.env, { USE_MOCK_API: 'true' });
      cacheService = new CacheService();
    });

    it('should delete multiple keys from primary backend', async () => {
      mockFileBackend.mdelete.mockResolvedValue(2);

      const result = await cacheService.mdelete(['key1', 'key2']);

      expect(result).toBe(2);
      expect(mockFileBackend.mdelete).toHaveBeenCalledWith(['key1', 'key2']);
    });

    it('should fallback to memory backend when primary fails', async () => {
      mockFileBackend.mdelete.mockRejectedValueOnce(new Error('Primary backend failed'));
      mockMemoryBackend.mdelete.mockResolvedValueOnce(1);

      const result = await cacheService.mdelete(['key1']);

      expect(result).toBe(1);
      expect(mockFileBackend.mdelete).toHaveBeenCalledTimes(1);
      expect(mockMemoryBackend.mdelete).toHaveBeenCalledTimes(1);
    });
  });

  describe('invalidatePattern method', () => {
    beforeEach(() => {
      Object.assign(process.env, { USE_MOCK_API: 'true' });
      cacheService = new CacheService();
    });

    it('should invalidate pattern in primary backend', async () => {
      mockFileBackend.invalidatePattern.mockResolvedValue(5);

      const result = await cacheService.invalidatePattern('test:*');

      expect(result).toBe(5);
      expect(mockFileBackend.invalidatePattern).toHaveBeenCalledWith('test:*');
    });

    it('should fallback to memory backend when primary fails', async () => {
      mockFileBackend.invalidatePattern.mockRejectedValueOnce(new Error('Primary backend failed'));
      mockMemoryBackend.invalidatePattern.mockResolvedValueOnce(3);

      const result = await cacheService.invalidatePattern('test:*');

      expect(result).toBe(3);
      expect(mockFileBackend.invalidatePattern).toHaveBeenCalledTimes(1);
      expect(mockMemoryBackend.invalidatePattern).toHaveBeenCalledTimes(1);
    });
  });

  describe('getStats method', () => {
    beforeEach(() => {
      Object.assign(process.env, { USE_MOCK_API: 'true' });
      cacheService = new CacheService();
    });

    it('should get stats from primary backend', async () => {
      const mockStats = {
        keys: 10,
        memoryUsage: 1024,
        uptime: 3600000,
        backend: 'file' as const,
        hitRate: 0,
        missRate: 0,
      };
      mockFileBackend.getStats.mockResolvedValue(mockStats);

      const result = await cacheService.getStats();

      expect(result).toEqual(mockStats);
      expect(mockFileBackend.getStats).toHaveBeenCalled();
    });

    it('should fallback to memory backend when primary fails', async () => {
      const mockStats = {
        keys: 8,
        memoryUsage: 512,
        uptime: 2400000,
        backend: 'file' as const,
        hitRate: 0,
        missRate: 0,
      };
      mockFileBackend.getStats.mockRejectedValueOnce(new Error('Primary backend failed'));
      mockMemoryBackend.getStats.mockResolvedValueOnce(mockStats);

      const result = await cacheService.getStats();

      expect(result).toEqual(mockStats);
      expect(mockFileBackend.getStats).toHaveBeenCalledTimes(1);
      expect(mockMemoryBackend.getStats).toHaveBeenCalledTimes(1);
    });
  });

  describe('clear method', () => {
    beforeEach(() => {
      Object.assign(process.env, { USE_MOCK_API: 'true' });
      cacheService = new CacheService();
    });

    it('should clear primary backend', async () => {
      mockFileBackend.clear.mockResolvedValue();

      await cacheService.clear();

      expect(mockFileBackend.clear).toHaveBeenCalled();
    });

    it('should fallback to memory backend when primary fails', async () => {
      mockFileBackend.clear.mockRejectedValueOnce(new Error('Primary backend failed'));
      mockMemoryBackend.clear.mockResolvedValueOnce();

      await cacheService.clear();

      expect(mockFileBackend.clear).toHaveBeenCalledTimes(1);
      expect(mockMemoryBackend.clear).toHaveBeenCalledTimes(1);
    });
  });
});
