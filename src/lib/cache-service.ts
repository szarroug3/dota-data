import { MemoryCacheBackend } from '@/lib/cache-backends/memory';
import { RedisCacheBackend } from '@/lib/cache-backends/redis';
import { CacheBackend, CacheBackendType, CacheStats, CacheValue } from '@/types/cache';

interface CacheServiceConfig {
  useRedis?: boolean;
  redisUrl?: string;
  fallbackToMemory?: boolean;
  maxMemoryUsage?: number;
}

/**
 * Main cache service with automatic backend selection and fallback
 */
export class CacheService implements CacheBackend {
  private backend: CacheBackend;
  private redisBackend?: CacheBackend;
  private memoryBackend: CacheBackend;
  private config: CacheServiceConfig;

  constructor(config: CacheServiceConfig = {}) {
    this.config = config;
    this.memoryBackend = new MemoryCacheBackend(config.maxMemoryUsage);
    
    // Initialize backend with proper null checks
    if (config.useRedis && config.redisUrl) {
      try {
        this.redisBackend = new RedisCacheBackend(config.redisUrl);
        this.backend = this.redisBackend;
      } catch (err) {
        // Fallback to memory if Redis fails to initialize
        this.backend = this.memoryBackend;
        this.log('Redis unavailable at startup, using memory cache', err as Error | string | object);
      }
    } else {
      this.backend = this.memoryBackend;
    }
  }

  private async ensureBackend(): Promise<void> {
    if (this.backend === this.redisBackend && this.redisBackend) {
      const healthy = await this.redisBackend.isHealthy();
      if (!healthy && this.config.fallbackToMemory) {
        this.log('Redis unhealthy, falling back to memory cache');
        this.backend = this.memoryBackend;
      }
    }
  }

  private log(message: string, error?: Error | string | object) {
    // Replace with centralized logger if available
    if (process.env.DEBUG_LOGGING === 'true') {
      console.error('[CacheService]', message, error || '');
    }
  }

  async get(key: string): Promise<CacheValue | null> {
    await this.ensureBackend();
    try {
      return await this.backend.get(key);
    } catch (err) {
      this.log('Error in get()', err as Error | string | object);
      if (this.backend !== this.memoryBackend && this.config.fallbackToMemory) {
        this.backend = this.memoryBackend;
        return this.memoryBackend.get(key);
      }
      throw err;
    }
  }

  async set(key: string, value: CacheValue, ttl?: number): Promise<void> {
    await this.ensureBackend();
    try {
      await this.backend.set(key, value, ttl);
    } catch (err) {
      this.log('Error in set()', err as Error | string | object);
      if (this.backend !== this.memoryBackend && this.config.fallbackToMemory) {
        this.backend = this.memoryBackend;
        await this.memoryBackend.set(key, value, ttl);
      } else {
        throw err;
      }
    }
  }

  async delete(key: string): Promise<boolean> {
    await this.ensureBackend();
    try {
      return await this.backend.delete(key);
    } catch (err) {
      this.log('Error in delete()', err as Error | string | object);
      if (this.backend !== this.memoryBackend && this.config.fallbackToMemory) {
        this.backend = this.memoryBackend;
        return this.memoryBackend.delete(key);
      }
      throw err;
    }
  }

  async exists(key: string): Promise<boolean> {
    await this.ensureBackend();
    try {
      return await this.backend.exists(key);
    } catch (err) {
      this.log('Error in exists()', err as Error | string | object);
      if (this.backend !== this.memoryBackend && this.config.fallbackToMemory) {
        this.backend = this.memoryBackend;
        return this.memoryBackend.exists(key);
      }
      throw err;
    }
  }

  async mget(keys: string[]): Promise<(CacheValue | null)[]> {
    await this.ensureBackend();
    try {
      return await this.backend.mget(keys);
    } catch (err) {
      this.log('Error in mget()', err as Error | string | object);
      if (this.backend !== this.memoryBackend && this.config.fallbackToMemory) {
        this.backend = this.memoryBackend;
        return this.memoryBackend.mget(keys);
      }
      throw err;
    }
  }

  async mset(entries: Array<{ key: string; value: CacheValue; ttl?: number }>): Promise<void> {
    await this.ensureBackend();
    try {
      await this.backend.mset(entries);
    } catch (err) {
      this.log('Error in mset()', err as Error | string | object);
      if (this.backend !== this.memoryBackend && this.config.fallbackToMemory) {
        this.backend = this.memoryBackend;
        await this.memoryBackend.mset(entries);
      } else {
        throw err;
      }
    }
  }

  async mdelete(keys: string[]): Promise<number> {
    await this.ensureBackend();
    try {
      return await this.backend.mdelete(keys);
    } catch (err) {
      this.log('Error in mdelete()', err as Error | string | object);
      if (this.backend !== this.memoryBackend && this.config.fallbackToMemory) {
        this.backend = this.memoryBackend;
        return this.memoryBackend.mdelete(keys);
      }
      throw err;
    }
  }

  async invalidatePattern(pattern: string): Promise<number> {
    await this.ensureBackend();
    try {
      return await this.backend.invalidatePattern(pattern);
    } catch (err) {
      this.log('Error in invalidatePattern()', err as Error | string | object);
      if (this.backend !== this.memoryBackend && this.config.fallbackToMemory) {
        this.backend = this.memoryBackend;
        return this.memoryBackend.invalidatePattern(pattern);
      }
      throw err;
    }
  }

  async getStats(): Promise<CacheStats> {
    await this.ensureBackend();
    try {
      return await this.backend.getStats();
    } catch (err) {
      this.log('Error in getStats()', err as Error | string | object);
      if (this.backend !== this.memoryBackend && this.config.fallbackToMemory) {
        this.backend = this.memoryBackend;
        return this.memoryBackend.getStats();
      }
      throw err;
    }
  }

  async clear(): Promise<void> {
    await this.ensureBackend();
    try {
      await this.backend.clear();
    } catch (err) {
      this.log('Error in clear()', err as Error | string | object);
      if (this.backend !== this.memoryBackend && this.config.fallbackToMemory) {
        this.backend = this.memoryBackend;
        await this.memoryBackend.clear();
      } else {
        throw err;
      }
    }
  }

  async isHealthy(): Promise<boolean> {
    await this.ensureBackend();
    try {
      return await this.backend.isHealthy();
    } catch (err) {
      this.log('Error in isHealthy()', err as Error | string | object);
      if (this.backend !== this.memoryBackend && this.config.fallbackToMemory) {
        this.backend = this.memoryBackend;
        return this.memoryBackend.isHealthy();
      }
      throw err;
    }
  }

  getBackendType(): CacheBackendType {
    if (this.backend === this.memoryBackend) return 'memory';
    if (this.backend === this.redisBackend) return 'redis';
    return 'memory';
  }

  /**
   * Disconnect from cache backends
   */
  async disconnect(): Promise<void> {
    try {
      // Disconnect from Redis backend if it exists
      if (this.redisBackend) {
        // Redis backend should handle its own disconnection
        // This is a placeholder for proper Redis disconnection
        console.log('[CacheService] Redis backend disconnected');
      }
      
      // Memory backend doesn't need explicit disconnection
      console.log('[CacheService] Cache service disconnected');
    } catch (error) {
      this.log('Error during disconnect', error as Error | string | object);
    }
  }
} 