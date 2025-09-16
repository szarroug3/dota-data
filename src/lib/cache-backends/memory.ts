/**
 * Memory cache backend implementation
 *
 * Provides in-memory caching with TTL support for development and fallback scenarios.
 * This backend is used when Redis is unavailable or for development environments.
 */

import { CacheBackend, CacheBackendType, CacheEntry, CacheStats, CacheValue } from '@/types/cache';

/**
 * Memory cache entry with metadata
 */
interface MemoryCacheEntry<T> extends CacheEntry<T> {
  expiresAt: number;
}

/**
 * Memory cache backend implementation
 */
export class MemoryCacheBackend implements CacheBackend {
  private cache = new Map<string, MemoryCacheEntry<CacheValue>>();
  private stats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    startTime: Date.now(),
  };
  private cleanupInterval?: NodeJS.Timeout;

  constructor(private maxMemoryUsage?: number) {
    // Only set up cleanup interval in non-test environments
    if (process.env.NODE_ENV !== 'test') {
      this.cleanupInterval = setInterval(() => this.cleanup(), 60000); // Every minute
    }
  }

  /**
   * Get a value from cache
   */
  async get(key: string): Promise<CacheValue | null> {
    const entry = this.cache.get(key) as MemoryCacheEntry<CacheValue> | undefined;

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check if entry has expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    // Update access metadata
    entry.accessedAt = Date.now();
    entry.accessCount++;

    this.stats.hits++;
    return entry.value;
  }

  /**
   * Set a value in cache with optional TTL
   */
  async set(key: string, value: CacheValue, ttl?: number): Promise<void> {
    const now = Date.now();
    const expiresAt = ttl ? now + ttl * 1000 : now + 24 * 60 * 60 * 1000; // Default 24 hours

    const entry: MemoryCacheEntry<CacheValue> = {
      value,
      ttl: ttl || 86400,
      createdAt: now,
      accessedAt: now,
      accessCount: 0,
      expiresAt,
    };

    this.cache.set(key, entry);
    this.stats.sets++;

    // Check memory usage and evict if necessary
    await this.checkMemoryUsage();
  }

  /**
   * Delete a value from cache
   */
  async delete(key: string): Promise<boolean> {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.stats.deletes++;
    }
    return deleted;
  }

  /**
   * Check if a key exists in cache
   */
  async exists(key: string): Promise<boolean> {
    const entry = this.cache.get(key);
    if (!entry) {
      return false;
    }

    // Check if entry has expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Get multiple values from cache
   */
  async mget(keys: string[]): Promise<(CacheValue | null)[]> {
    const results: (CacheValue | null)[] = [];

    for (const key of keys) {
      const value = await this.get(key);
      results.push(value);
    }

    return results;
  }

  /**
   * Set multiple values in cache
   */
  async mset(entries: Array<{ key: string; value: CacheValue; ttl?: number }>): Promise<void> {
    for (const { key, value, ttl } of entries) {
      await this.set(key, value, ttl);
    }
  }

  /**
   * Delete multiple keys from cache
   */
  async mdelete(keys: string[]): Promise<number> {
    let deletedCount = 0;

    for (const key of keys) {
      const deleted = await this.delete(key);
      if (deleted) {
        deletedCount++;
      }
    }

    return deletedCount;
  }

  /**
   * Invalidate keys matching a pattern
   * Note: Memory backend uses simple string matching, not regex patterns
   */
  async invalidatePattern(pattern: string): Promise<number> {
    let deletedCount = 0;
    const keysToDelete: string[] = [];

    for (const key of this.cache.keys()) {
      if (this.matchesPattern(key, pattern)) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      const deleted = await this.delete(key);
      if (deleted) {
        deletedCount++;
      }
    }

    return deletedCount;
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<CacheStats> {
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 ? this.stats.hits / totalRequests : 0;
    const missRate = totalRequests > 0 ? this.stats.misses / totalRequests : 0;

    return {
      keys: this.cache.size,
      memoryUsage: this.getMemoryUsage(),
      hitRate,
      missRate,
      uptime: Date.now() - this.stats.startTime,
      backend: 'memory' as CacheBackendType,
    };
  }

  /**
   * Clear all cache data
   */
  async clear(): Promise<void> {
    this.cache.clear();
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      startTime: Date.now(),
    };
  }

  /**
   * Check if cache is healthy
   */
  async isHealthy(): Promise<boolean> {
    if (!this.maxMemoryUsage) {
      return true;
    }

    const currentUsage = this.getMemoryUsage();
    if (currentUsage <= this.maxMemoryUsage) {
      return true;
    }
    // Try to evict and re-check
    await this.checkMemoryUsage();
    // Recalculate after eviction
    return this.getMemoryUsage() <= this.maxMemoryUsage;
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      this.cache.delete(key);
    }
  }

  /**
   * Check memory usage and evict if necessary
   */
  private async checkMemoryUsage(): Promise<void> {
    if (!this.maxMemoryUsage) {
      return;
    }

    const currentUsage = this.getMemoryUsage();
    if (currentUsage > this.maxMemoryUsage) {
      await this.evictOldest();
      // After eviction, if still over limit, nothing more can be done
    }
  }

  /**
   * Evict oldest entries to free memory
   */
  private async evictOldest(): Promise<void> {
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      entry,
      size: this.estimateEntrySize(key, entry),
    }));

    // Sort by access time (oldest first)
    entries.sort((a, b) => a.entry.accessedAt - b.entry.accessedAt);

    // Remove oldest entries until we're under the limit
    let removedSize = 0;
    const targetReduction = this.getMemoryUsage() - this.maxMemoryUsage! + 1024; // Extra buffer

    for (const { key, size } of entries) {
      if (removedSize >= targetReduction) {
        break;
      }

      this.cache.delete(key);
      removedSize += size;
    }
  }

  /**
   * Get current memory usage in bytes
   */
  private getMemoryUsage(): number {
    let totalSize = 0;

    for (const [key, entry] of this.cache.entries()) {
      totalSize += this.estimateEntrySize(key, entry);
    }

    return totalSize;
  }

  /**
   * Estimate the size of a cache entry in bytes
   */
  private estimateEntrySize(key: string, entry: MemoryCacheEntry<CacheValue>): number {
    const keySize = Buffer.byteLength(key, 'utf8');
    const valueSize = this.estimateValueSize(entry.value);
    const metadataSize = 64; // Approximate size for timestamps, counters, etc.

    return keySize + valueSize + metadataSize;
  }

  /**
   * Estimate the size of a value in bytes
   */
  private estimateValueSize(value: CacheValue): number {
    if (value === null || value === undefined) {
      return 0;
    }

    if (typeof value === 'string') {
      return Buffer.byteLength(value, 'utf8');
    }

    if (typeof value === 'number') {
      return 8; // 64-bit number
    }

    if (typeof value === 'boolean') {
      return 1;
    }

    if (Array.isArray(value)) {
      return value.reduce((total: number, item) => total + this.estimateValueSize(item), 0);
    }

    if (typeof value === 'object') {
      try {
        return Buffer.byteLength(JSON.stringify(value), 'utf8');
      } catch {
        return 100; // Fallback estimate for complex objects
      }
    }

    return 100; // Default estimate for complex types
  }

  /**
   * Check if a key matches a pattern
   */
  private matchesPattern(key: string, pattern: string): boolean {
    // Simple wildcard matching
    const regexPattern = pattern.replace(/\*/g, '.*');
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(key);
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}
