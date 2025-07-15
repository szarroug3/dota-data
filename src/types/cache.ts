/**
 * Cache-related type definitions
 *
 * Contains interfaces and types for cache service, backends, and cache keys.
 */

// ============================================================================
// CACHE VALUE TYPES
// ============================================================================

/**
 * Valid cache value types
 * 
 * Cache can store any JSON-serializable value including:
 * - Primitive types (string, number, boolean, null)
 * - Arrays of primitive types
 * - Objects with string keys and primitive values
 */

// ============================================================================
// CACHE BACKEND TYPES
// ============================================================================

/**
 * Cache backend type enumeration
 */
export type CacheBackendType = 'redis' | 'memory';

/**
 * Cache backend interface that all cache implementations must implement
 */
export interface CacheBackend {
  /**
   * Get a value from cache
   */
  get(key: string): Promise<CacheValue | null>;

  /**
   * Set a value in cache with optional TTL
   */
  set(key: string, value: CacheValue, ttl?: number): Promise<void>;

  /**
   * Delete a value from cache
   */
  delete(key: string): Promise<boolean>;

  /**
   * Check if a key exists in cache
   */
  exists(key: string): Promise<boolean>;

  /**
   * Get multiple values from cache
   */
  mget(keys: string[]): Promise<(CacheValue | null)[]>;

  /**
   * Set multiple values in cache
   */
  mset(entries: Array<{ key: string; value: CacheValue; ttl?: number }>): Promise<void>;

  /**
   * Delete multiple keys from cache
   */
  mdelete(keys: string[]): Promise<number>;

  /**
   * Invalidate keys matching a pattern
   */
  invalidatePattern(pattern: string): Promise<number>;

  /**
   * Get cache statistics
   */
  getStats(): Promise<CacheStats>;

  /**
   * Clear all cache data
   */
  clear(): Promise<void>;
}

/**
 * Cache statistics
 */
export interface CacheStats {
  keys: number;
  memoryUsage?: number;
  hitRate: number;
  missRate: number;
  uptime: number;
  backend: CacheBackendType;
}

// ============================================================================
// CACHE SERVICE TYPES
// ============================================================================

/**
 * Cache service configuration
 */
export interface CacheServiceConfig {
  useRedis: boolean;
  redisUrl?: string;
  fallbackToMemory: boolean;
  defaultTtl?: number;
  maxMemoryUsage?: number;
}

/**
 * Cache service interface
 */
export interface CacheService {
  /**
   * Get a value from cache
   */
  get<T>(key: string): Promise<T | null>;

  /**
   * Set a value in cache with optional TTL
   */
  set<T>(key: string, value: T, ttl?: number): Promise<void>;

  /**
   * Delete a value from cache
   */
  delete(key: string): Promise<boolean>;

  /**
   * Check if a key exists in cache
   */
  exists(key: string): Promise<boolean>;

  /**
   * Get multiple values from cache
   */
  mget<T>(keys: string[]): Promise<(T | null)[]>;

  /**
   * Set multiple values in cache
   */
  mset<T>(entries: Array<{ key: string; value: T; ttl?: number }>): Promise<void>;

  /**
   * Delete multiple keys from cache
   */
  mdelete(keys: string[]): Promise<number>;

  /**
   * Invalidate keys matching a pattern
   */
  invalidatePattern(pattern: string): Promise<number>;

  /**
   * Get cache statistics
   */
  getStats(): Promise<CacheStats>;

  /**
   * Clear all cache data
   */
  clear(): Promise<void>;

  /**
   * Check if the cache service is healthy
   */
  isHealthy(): Promise<boolean>;

  /**
   * Get the current backend type
   */
  getBackendType(): CacheBackendType;
}

// ============================================================================
// CACHE KEY TYPES
// ============================================================================

/**
 * Cache key namespace enumeration
 */
export type CacheNamespace = 
  | 'api'
  | 'hero'
  | 'player'
  | 'team'
  | 'match'
  | 'league'
  | 'rate-limit'
  | 'job'
  | 'config';

/**
 * Cache key builder interface
 */
export interface CacheKeyBuilder {
  /**
   * Build a cache key with namespace and identifier
   */
  build(namespace: CacheNamespace, identifier: string, ...parts: string[]): string;

  /**
   * Build a pattern for cache invalidation
   */
  buildPattern(namespace: CacheNamespace, pattern: string): string;

  /**
   * Parse a cache key to extract components
   */
  parse(key: string): {
    namespace: CacheNamespace;
    identifier: string;
    parts: string[];
  } | null;
}

/**
 * Cache key configuration
 */
export interface CacheKeyConfig {
  separator: string;
  maxLength: number;
  encoding: 'utf8' | 'base64';
}

// ============================================================================
// CACHE ERROR TYPES
// ============================================================================

/**
 * Cache error types
 */
export type CacheErrorType = 
  | 'connection_failed'
  | 'timeout'
  | 'serialization_error'
  | 'deserialization_error'
  | 'key_too_long'
  | 'value_too_large'
  | 'memory_full'
  | 'network_error';

/**
 * Cache error interface
 */
export interface CacheError extends Error {
  type: CacheErrorType;
  key?: string;
  backend: CacheBackendType;
  retryable: boolean;
}

// ============================================================================
// CACHE UTILITY TYPES
// ============================================================================

/**
 * Cache entry with metadata
 */
export interface CacheEntry<T> {
  value: T;
  ttl: number;
  createdAt: number;
  accessedAt: number;
  accessCount: number;
}

/**
 * Cache warming configuration
 */
export interface CacheWarmingConfig {
  keys: string[];
  priority: 'low' | 'normal' | 'high';
  concurrency: number;
  timeout: number;
}

/**
 * Cache warming result
 */
export interface CacheWarmingResult {
  total: number;
  successful: number;
  failed: number;
  errors: Array<{
    key: string;
    error: string;
  }>;
  duration: number;
} 