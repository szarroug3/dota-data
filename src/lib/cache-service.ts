import { MemoryCacheBackend } from '@/lib/cache-backends/memory';
import { RedisCacheBackend } from '@/lib/cache-backends/redis';
import { CacheBackend, CacheStats, CacheValue } from '@/types/cache';

/**
 * Main cache service with automatic backend selection and fallback
 */
export class CacheService implements CacheBackend {
  private backend: CacheBackend;
  private fallbackBackend: MemoryCacheBackend;

  constructor(config?: { useRedis?: boolean; redisUrl?: string; fallbackToMemory?: boolean }) {
    this.fallbackBackend = new MemoryCacheBackend();
    if (process.env.USE_MOCK_API === 'true' || process.env.USE_MOCK_DB === 'true') {
      this.backend = this.fallbackBackend;
    } else if (config?.redisUrl || process.env.REDIS_URL) {
      this.backend = new RedisCacheBackend(config?.redisUrl || process.env.REDIS_URL || '');
    } else {
      this.backend = this.fallbackBackend;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    let response;
    try {
      response = await this.backend.get(key);
    } catch {
      response = await this.fallbackBackend.get(key);
    }
    if (response) {
      return response as T;
    }
    return null;
  }

  async set(key: string, value: CacheValue, ttl?: number): Promise<void> {
    try {
      await this.backend.set(key, value, ttl);
    } catch {
      await this.fallbackBackend.set(key, value, ttl);
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      return await this.backend.delete(key);
    } catch {
      return await this.fallbackBackend.delete(key);
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      return await this.backend.exists(key);
    } catch {
      return await this.fallbackBackend.exists(key);
    }
  }

  async mget(keys: string[]): Promise<(CacheValue | null)[]> {
    try {
      return await this.backend.mget(keys);
    } catch {
      return await this.fallbackBackend.mget(keys);
    }
  }

  async mset(entries: Array<{ key: string; value: CacheValue; ttl?: number }>): Promise<void> {
    try {
      await this.backend.mset(entries);
    } catch {
      await this.fallbackBackend.mset(entries);
    }
  }

  async mdelete(keys: string[]): Promise<number> {
    try {
      return await this.backend.mdelete(keys);
    } catch {
      return await this.fallbackBackend.mdelete(keys);
    }
  }

  async invalidatePattern(pattern: string): Promise<number> {
    try {
      return await this.backend.invalidatePattern(pattern);
    } catch {
      return await this.fallbackBackend.invalidatePattern(pattern);
    }
  }

  async getStats(): Promise<CacheStats> {
    try {
      return await this.backend.getStats();
    } catch {
      return await this.fallbackBackend.getStats();
    }
  }

  async clear(): Promise<void> {
    try {
      await this.backend.clear();
    } catch {
      await this.fallbackBackend.clear();
    }
  }

  /**
   * Get the backend type (redis or memory)
   */
  getBackendType(): 'redis' | 'memory' {
    if (this.backend instanceof RedisCacheBackend) {
      return 'redis';
    }
    return 'memory';
  }

  /**
   * Check if the cache backend is healthy
   */
  async isHealthy(): Promise<boolean> {
    try {
      return await this.backend.isHealthy();
    } catch {
      return await this.fallbackBackend.isHealthy();
    }
  }
}
