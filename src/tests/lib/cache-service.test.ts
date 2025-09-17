/**
 * @jest-environment node
 */

import { MemoryCacheBackend } from '@/lib/cache-backends/memory';
import { RedisCacheBackend } from '@/lib/cache-backends/redis';
import { CacheService } from '@/lib/cache-service';

// Mock the cache backends
jest.mock('@/lib/cache-backends/memory');
jest.mock('@/lib/cache-backends/redis');

const MockMemoryCacheBackend = MemoryCacheBackend as jest.MockedClass<typeof MemoryCacheBackend>;
const MockRedisCacheBackend = RedisCacheBackend as jest.MockedClass<typeof RedisCacheBackend>;

describe('CacheService', () => {
  let cacheService: CacheService;
  let mockMemoryBackend: jest.Mocked<MemoryCacheBackend>;
  let mockRedisBackend: jest.Mocked<RedisCacheBackend>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock instances
    mockMemoryBackend = new MockMemoryCacheBackend(undefined) as jest.Mocked<MemoryCacheBackend>;
    mockRedisBackend = new MockRedisCacheBackend() as jest.Mocked<RedisCacheBackend>;

    MockMemoryCacheBackend.mockImplementation(() => mockMemoryBackend);
    MockRedisCacheBackend.mockImplementation(() => mockRedisBackend);
  });

  describe('constructor', () => {
    it('should use memory backend when USE_MOCK_API is true', () => {
      const originalEnv = process.env.USE_MOCK_API;
      process.env.USE_MOCK_API = 'true';

      cacheService = new CacheService();

      expect(MockMemoryCacheBackend).toHaveBeenCalled();
      // Redis might still be called during fallback setup, so we don't check this

      process.env.USE_MOCK_API = originalEnv;
    });

    it('should use memory backend when USE_MOCK_DB is true', () => {
      const originalEnv = process.env.USE_MOCK_DB;
      process.env.USE_MOCK_DB = 'true';

      cacheService = new CacheService();

      expect(MockMemoryCacheBackend).toHaveBeenCalled();
      // Redis might still be called during fallback setup, so we don't check this

      process.env.USE_MOCK_DB = originalEnv;
    });

    it('should use Redis backend when UPSTASH envs are provided', () => {
      const originalUrl = process.env.UPSTASH_REDIS_REST_URL;
      const originalToken = process.env.UPSTASH_REDIS_REST_TOKEN;
      process.env.UPSTASH_REDIS_REST_URL = 'https://example.upstash.io';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'token';
      process.env.USE_MOCK_API = 'false';
      process.env.USE_MOCK_DB = 'false';

      cacheService = new CacheService();

      expect(MockRedisCacheBackend).toHaveBeenCalled();

      process.env.UPSTASH_REDIS_REST_URL = originalUrl;
      process.env.UPSTASH_REDIS_REST_TOKEN = originalToken;
    });

    it('should default to memory backend when no Redis URL is provided', () => {
      const originalEnv = process.env.REDIS_URL;
      delete process.env.REDIS_URL;
      process.env.USE_MOCK_API = 'false';
      process.env.USE_MOCK_DB = 'false';

      cacheService = new CacheService();

      // Should not throw, should default to memory
      expect(cacheService).toBeInstanceOf(CacheService);

      process.env.REDIS_URL = originalEnv;
    });
  });

  describe('get method', () => {
    beforeEach(() => {
      process.env.USE_MOCK_API = 'true';
      cacheService = new CacheService();
    });

    it('should return raw value from primary backend', async () => {
      const mockData = { test: 'data' };
      const jsonString = JSON.stringify(mockData);
      mockMemoryBackend.get.mockResolvedValue(jsonString);

      const result = await cacheService.get('test-key');

      expect(result).toEqual(jsonString);
      expect(mockMemoryBackend.get).toHaveBeenCalledWith('test-key');
    });

    it('should return null when key not found', async () => {
      mockMemoryBackend.get.mockResolvedValue(null);

      const result = await cacheService.get('test-key');

      expect(result).toBeNull();
    });

    it('should fallback to memory backend when primary fails', async () => {
      const mockData = { test: 'data' };
      const jsonString = JSON.stringify(mockData);
      mockMemoryBackend.get
        .mockRejectedValueOnce(new Error('Primary backend failed'))
        .mockResolvedValueOnce(jsonString);

      const result = await cacheService.get('test-key');

      expect(result).toEqual(jsonString);
      expect(mockMemoryBackend.get).toHaveBeenCalledTimes(2);
    });
  });

  describe('set method', () => {
    beforeEach(() => {
      process.env.USE_MOCK_API = 'true';
      cacheService = new CacheService();
    });

    it('should set value in primary backend', async () => {
      const testData = { test: 'data' };
      mockMemoryBackend.set.mockResolvedValue();

      await cacheService.set('test-key', testData);

      expect(mockMemoryBackend.set).toHaveBeenCalledWith('test-key', testData, undefined);
    });

    it('should set value with TTL', async () => {
      const testData = { test: 'data' };
      const ttl = 3600;
      mockMemoryBackend.set.mockResolvedValue();

      await cacheService.set('test-key', testData, ttl);

      expect(mockMemoryBackend.set).toHaveBeenCalledWith('test-key', testData, ttl);
    });

    it('should fallback to memory backend when primary fails', async () => {
      const testData = { test: 'data' };
      mockMemoryBackend.set.mockRejectedValueOnce(new Error('Primary backend failed')).mockResolvedValueOnce();

      await cacheService.set('test-key', testData);

      expect(mockMemoryBackend.set).toHaveBeenCalledTimes(2);
    });
  });

  describe('delete method', () => {
    beforeEach(() => {
      process.env.USE_MOCK_API = 'true';
      cacheService = new CacheService();
    });

    it('should delete key from primary backend', async () => {
      mockMemoryBackend.delete.mockResolvedValue(true);

      const result = await cacheService.delete('test-key');

      expect(result).toBe(true);
      expect(mockMemoryBackend.delete).toHaveBeenCalledWith('test-key');
    });

    it('should fallback to memory backend when primary fails', async () => {
      mockMemoryBackend.delete.mockRejectedValueOnce(new Error('Primary backend failed')).mockResolvedValueOnce(false);

      const result = await cacheService.delete('test-key');

      expect(result).toBe(false);
      expect(mockMemoryBackend.delete).toHaveBeenCalledTimes(2);
    });
  });

  describe('exists method', () => {
    beforeEach(() => {
      process.env.USE_MOCK_API = 'true';
      cacheService = new CacheService();
    });

    it('should check if key exists in primary backend', async () => {
      mockMemoryBackend.exists.mockResolvedValue(true);

      const result = await cacheService.exists('test-key');

      expect(result).toBe(true);
      expect(mockMemoryBackend.exists).toHaveBeenCalledWith('test-key');
    });

    it('should fallback to memory backend when primary fails', async () => {
      mockMemoryBackend.exists.mockRejectedValueOnce(new Error('Primary backend failed')).mockResolvedValueOnce(false);

      const result = await cacheService.exists('test-key');

      expect(result).toBe(false);
      expect(mockMemoryBackend.exists).toHaveBeenCalledTimes(2);
    });
  });

  describe('mget method', () => {
    beforeEach(() => {
      process.env.USE_MOCK_API = 'true';
      cacheService = new CacheService();
    });

    it('should get multiple keys from primary backend', async () => {
      const mockData = ['value1', 'value2', null];
      mockMemoryBackend.mget.mockResolvedValue(mockData);

      const result = await cacheService.mget(['key1', 'key2', 'key3']);

      expect(result).toEqual(mockData);
      expect(mockMemoryBackend.mget).toHaveBeenCalledWith(['key1', 'key2', 'key3']);
    });

    it('should fallback to memory backend when primary fails', async () => {
      const mockData = ['value1', 'value2'];
      mockMemoryBackend.mget.mockRejectedValueOnce(new Error('Primary backend failed')).mockResolvedValueOnce(mockData);

      const result = await cacheService.mget(['key1', 'key2']);

      expect(result).toEqual(mockData);
      expect(mockMemoryBackend.mget).toHaveBeenCalledTimes(2);
    });
  });

  describe('mset method', () => {
    beforeEach(() => {
      process.env.USE_MOCK_API = 'true';
      cacheService = new CacheService();
    });

    it('should set multiple entries in primary backend', async () => {
      const entries = [
        { key: 'key1', value: 'value1' },
        { key: 'key2', value: 'value2', ttl: 3600 },
      ];
      mockMemoryBackend.mset.mockResolvedValue();

      await cacheService.mset(entries);

      expect(mockMemoryBackend.mset).toHaveBeenCalledWith(entries);
    });

    it('should fallback to memory backend when primary fails', async () => {
      const entries = [{ key: 'key1', value: 'value1' }];
      mockMemoryBackend.mset.mockRejectedValueOnce(new Error('Primary backend failed')).mockResolvedValueOnce();

      await cacheService.mset(entries);

      expect(mockMemoryBackend.mset).toHaveBeenCalledTimes(2);
    });
  });

  describe('mdelete method', () => {
    beforeEach(() => {
      process.env.USE_MOCK_API = 'true';
      cacheService = new CacheService();
    });

    it('should delete multiple keys from primary backend', async () => {
      mockMemoryBackend.mdelete.mockResolvedValue(2);

      const result = await cacheService.mdelete(['key1', 'key2']);

      expect(result).toBe(2);
      expect(mockMemoryBackend.mdelete).toHaveBeenCalledWith(['key1', 'key2']);
    });

    it('should fallback to memory backend when primary fails', async () => {
      mockMemoryBackend.mdelete.mockRejectedValueOnce(new Error('Primary backend failed')).mockResolvedValueOnce(1);

      const result = await cacheService.mdelete(['key1']);

      expect(result).toBe(1);
      expect(mockMemoryBackend.mdelete).toHaveBeenCalledTimes(2);
    });
  });

  describe('invalidatePattern method', () => {
    beforeEach(() => {
      process.env.USE_MOCK_API = 'true';
      cacheService = new CacheService();
    });

    it('should invalidate pattern in primary backend', async () => {
      mockMemoryBackend.invalidatePattern.mockResolvedValue(5);

      const result = await cacheService.invalidatePattern('test:*');

      expect(result).toBe(5);
      expect(mockMemoryBackend.invalidatePattern).toHaveBeenCalledWith('test:*');
    });

    it('should fallback to memory backend when primary fails', async () => {
      mockMemoryBackend.invalidatePattern
        .mockRejectedValueOnce(new Error('Primary backend failed'))
        .mockResolvedValueOnce(3);

      const result = await cacheService.invalidatePattern('test:*');

      expect(result).toBe(3);
      expect(mockMemoryBackend.invalidatePattern).toHaveBeenCalledTimes(2);
    });
  });

  describe('getStats method', () => {
    beforeEach(() => {
      process.env.USE_MOCK_API = 'true';
      cacheService = new CacheService();
    });

    it('should get stats from primary backend', async () => {
      const mockStats = {
        keys: 10,
        memoryUsage: 1024,
        hitRate: 0.8,
        missRate: 0.2,
        uptime: 3600000,
        backend: 'memory' as const,
      };
      mockMemoryBackend.getStats.mockResolvedValue(mockStats);

      const result = await cacheService.getStats();

      expect(result).toEqual(mockStats);
      expect(mockMemoryBackend.getStats).toHaveBeenCalled();
    });

    it('should fallback to memory backend when primary fails', async () => {
      const mockStats = {
        keys: 8,
        memoryUsage: 512,
        hitRate: 0.7,
        missRate: 0.3,
        uptime: 2400000,
        backend: 'memory' as const,
      };
      mockMemoryBackend.getStats
        .mockRejectedValueOnce(new Error('Primary backend failed'))
        .mockResolvedValueOnce(mockStats);

      const result = await cacheService.getStats();

      expect(result).toEqual(mockStats);
      expect(mockMemoryBackend.getStats).toHaveBeenCalledTimes(2);
    });
  });

  describe('clear method', () => {
    beforeEach(() => {
      process.env.USE_MOCK_API = 'true';
      cacheService = new CacheService();
    });

    it('should clear primary backend', async () => {
      mockMemoryBackend.clear.mockResolvedValue();

      await cacheService.clear();

      expect(mockMemoryBackend.clear).toHaveBeenCalled();
    });

    it('should fallback to memory backend when primary fails', async () => {
      mockMemoryBackend.clear.mockRejectedValueOnce(new Error('Primary backend failed')).mockResolvedValueOnce();

      await cacheService.clear();

      expect(mockMemoryBackend.clear).toHaveBeenCalledTimes(2);
    });
  });
});
