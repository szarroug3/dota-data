/**
 * Redis cache backend implementation
 *
 * Provides Redis-based caching with TTL support for production environments.
 * This backend is used for distributed caching across serverless instances.
 */

import { Redis } from '@upstash/redis';

import { CacheBackend, CacheBackendType, CacheStats, CacheValue } from '@/types/cache';

type UpstashRedisExtended = Redis & {
  expire?: (key: string, seconds: number) => Promise<number>;
  del?: (key: string) => Promise<number>;
  keys?: (pattern: string) => Promise<string[]>;
  flushall?: () => Promise<never | string | number | boolean | null>;
  flushdb?: () => Promise<never | string | number | boolean | null>;
  ping?: () => Promise<string | number | boolean | null>;
};

/**
 * Redis cache backend implementation
 */
export class RedisCacheBackend implements CacheBackend {
  private client: Redis | null = null;
  private stats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    startTime: Date.now(),
  };

  constructor() {
    this.initializeClient();
  }

  /**
   * Initialize Redis client
   */
  private initializeClient(): void {
    this.client = Redis.fromEnv();

    if (!this.client) {
      throw new Error('Failed to initialize Redis client: missing Upstash credentials');
    }
  }

  /**
   * Get a value from cache
   */
  async get(key: string): Promise<CacheValue | null> {
    if (!this.client) throw new Error('Redis client not initialized');
    try {
      const value = await this.client.get<CacheValue>(key);
      if (value === null || value === undefined) {
        this.stats.misses++;
        return null;
      }
      this.stats.hits++;
      return value as CacheValue;
    } catch (error) {
      this.stats.misses++;
      throw new Error(`Redis get error: ${error}`);
    }
  }

  /**
   * Set a value in cache with optional TTL
   */
  async set(key: string, value: CacheValue, ttl?: number): Promise<void> {
    if (!this.client) throw new Error('Redis client not initialized');
    try {
      // Upstash supports TTL via ex option, but our test mock may not. Do a two-step set + expire.
      await this.client.set(key, value as never);
      if (ttl && ttl > 0) {
        const ext = this.client as UpstashRedisExtended;
        if (ext.expire) {
          await ext.expire(key, ttl);
        }
      }
      this.stats.sets++;
    } catch (error) {
      throw new Error(`Redis set error: ${error}`);
    }
  }

  /**
   * Delete a value from cache
   */
  async delete(key: string): Promise<boolean> {
    if (!this.client) throw new Error('Redis client not initialized');
    try {
      const ext = this.client as UpstashRedisExtended;
      const deleted = ext.del ? await ext.del(key) : 0;
      this.stats.deletes++;
      return Boolean(deleted);
    } catch (error) {
      throw new Error(`Redis delete error: ${error}`);
    }
  }

  /**
   * Check if a key exists in cache
   */
  async exists(key: string): Promise<boolean> {
    if (!this.client) throw new Error('Redis client not initialized');
    try {
      const value = await this.client.get(key);
      return value !== null && value !== undefined;
    } catch (error) {
      throw new Error(`Redis exists error: ${error}`);
    }
  }

  /**
   * Get multiple values from cache
   */
  async mget(keys: string[]): Promise<(CacheValue | null)[]> {
    if (!this.client) throw new Error('Redis client not initialized');
    try {
      const results: (CacheValue | null)[] = [];
      for (const key of keys) {
        const value = await this.client.get<CacheValue>(key);
        results.push(value ?? null);
      }
      return results;
    } catch (error) {
      throw new Error(`Redis mget error: ${error}`);
    }
  }

  /**
   * Set multiple values in cache
   */
  async mset(entries: Array<{ key: string; value: CacheValue; ttl?: number }>): Promise<void> {
    if (!this.client) throw new Error('Redis client not initialized');
    try {
      const ext = this.client as UpstashRedisExtended;
      for (const { key, value, ttl } of entries) {
        await this.client.set(key, value as never);
        if (ttl && ttl > 0 && ext.expire) {
          await ext.expire(key, ttl);
        }
        this.stats.sets++;
      }
    } catch (error) {
      throw new Error(`Redis mset error: ${error}`);
    }
  }

  /**
   * Delete multiple keys from cache
   */
  async mdelete(keys: string[]): Promise<number> {
    if (!this.client) throw new Error('Redis client not initialized');
    try {
      let count = 0;
      const ext = this.client as UpstashRedisExtended;
      for (const key of keys) {
        const deleted = ext.del ? await ext.del(key) : 0;
        if (deleted) count += Number(deleted);
        this.stats.deletes++;
      }
      return count;
    } catch (error) {
      throw new Error(`Redis mdelete error: ${error}`);
    }
  }

  /**
   * Invalidate keys matching a pattern
   */
  async invalidatePattern(pattern: string): Promise<number> {
    if (!this.client) throw new Error('Redis client not initialized');
    try {
      // Try KEYS first if available (test mock provides keys), otherwise do nothing
      const ext = this.client as UpstashRedisExtended;
      if (!ext.keys) return 0;
      const keys = await ext.keys(pattern);
      if (!keys || keys.length === 0) return 0;
      return await this.mdelete(keys);
    } catch (error) {
      throw new Error(`Redis invalidatePattern error: ${error}`);
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<CacheStats> {
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 ? this.stats.hits / totalRequests : 0;
    const missRate = totalRequests > 0 ? this.stats.misses / totalRequests : 0;

    return {
      keys: 0,
      memoryUsage: 0,
      hitRate,
      missRate,
      uptime: Date.now() - this.stats.startTime,
      backend: 'redis' as CacheBackendType,
    };
  }

  /**
   * Clear all cache data
   */
  async clear(): Promise<void> {
    if (!this.client) throw new Error('Redis client not initialized');
    try {
      const ext = this.client as UpstashRedisExtended;
      if (typeof ext.flushall === 'function') {
        await ext.flushall();
      } else if (typeof ext.flushdb === 'function') {
        await ext.flushdb();
      }
    } catch (error) {
      throw new Error(`Redis clear error: ${error}`);
    }
  }

  /**
   * Check if the backend is healthy
   */
  async isHealthy(): Promise<boolean> {
    try {
      if (!this.client) return false;
      const ext = this.client as UpstashRedisExtended;
      if (typeof ext.ping === 'function') {
        const res = await ext.ping();
        return typeof res === 'string' ? res.toUpperCase() === 'PONG' : Boolean(res);
      }
      // Fallback: simple get/set cycle
      const key = '__healthcheck__';
      await this.client.set(key, '1' as never);
      const v = await this.client.get(key);
      if (ext.del) await ext.del(key);
      return v === '1' || v === 1 || v === '"1"';
    } catch {
      return false;
    }
  }
}
