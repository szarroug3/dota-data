import { Redis } from '@upstash/redis';
import * as fs from 'fs';
import * as path from 'path';
import { shouldMockService } from './mock-data-writer';
import { rateLimiter } from './rate-limiter';
import { logWithTimestampToFile } from './server-logger';

if (typeof window !== 'undefined') {
  throw new Error('[cache-service.ts] Mocking logic should never run on the client!');
}

// Helper function to determine the entity type from filename
function getEntityTypeFromFilename(filename: string): 'players' | 'matches' | 'heroes' | 'teams' | 'leagues' | 'unknown' {
  if (filename.includes('player')) return 'players';
  if (filename.includes('match')) return 'matches';
  if (filename.includes('hero')) return 'heroes';
  if (filename.includes('team')) return 'teams';
  if (filename.includes('league')) return 'leagues';
  return 'unknown';
}

/**
 * CacheService manages caching, queueing, and rate limiting for API data.
 * Supports both Redis (production) and in-memory/file-based mock cache (development/testing).
 * Handles get/set/invalidate/queueRequest, queue stats, and rate limiting.
 */
class CacheService {
  private config: { ttl: number; maxAge: number };
  private redis: Redis | null = null;
  private rateLimiter: typeof rateLimiter;
  private mockMemoryCache: Map<string, unknown> = new Map(); // In-memory cache for mock mode
  private mockCacheDir = 'data-cache';
  private pendingRequests: Map<string, { status: string; result?: unknown }> = new Map();

  constructor(config: { ttl: number; maxAge: number } = {
    ttl: 5 * 60 * 1000, // 5 minutes default TTL
    maxAge: 24 * 60 * 60 * 1000 // 24 hours max age
  }) {
    this.config = config;
    this.rateLimiter = rateLimiter;
    if (!shouldMockService('db')) {
      try {
        this.redis = Redis.fromEnv();
        logWithTimestampToFile('log', '[CacheService] Using real Redis database');
      } catch (error) {
        logWithTimestampToFile('warn', '[CacheService] Failed to initialize Redis:', error);
      }
    } else {
      logWithTimestampToFile('log', '[CacheService] Using mock/in-memory cache for DB');
    }
  }

  // --- Public API ---

  /**
   * Retrieves a value from cache (mock or Redis), checking for expiry.
   * @template T
   * @param cacheKey - The logical cache key (used for Redis).
   * @param filename - The filename for mock/file cache.
   * @param ttl - Optional time-to-live in ms (overrides default).
   * @returns The cached value or null if not found/expired.
   */
  async get<T>(cacheKey: string, filename: string, ttl?: number): Promise<T | null> {
    const isMock = shouldMockService('db');
    if (isMock) {
      const mem = this.getFromMockCache<T>(filename);
      if (mem !== null) return mem;
      return await this.getFromMockFile<T>(filename);
    }
    const res = await this.getFromRedis<T>(cacheKey);
    if (this.isExpired(res, ttl)) {
      this.invalidate(cacheKey, filename);
      return null;
    }
    return res;
  }

  /**
   * Stores a value in cache (mock or Redis).
   * @template T
   * @param service - The service name (for stats/logging).
   * @param cacheKey - The logical cache key (used for Redis).
   * @param data - The value to cache.
   * @param ttl - Optional time-to-live in ms (overrides default).
   * @param filename - The filename for mock/file cache.
   */
  async set<T>(service: string, cacheKey: string, data: T, ttl: number | undefined, filename: string): Promise<void> {
    const isMock = shouldMockService('db');
    if (isMock) {
      await this.setMockCache<T>(filename, data);
      return;
    }
    const cacheTTL = ttl || this.config.ttl;
    await this.setRedisCache<T>(cacheKey, data, cacheTTL);
  }

  /**
   * Invalidates a cache entry (mock or Redis).
   * @param cacheKey - The logical cache key (used for Redis).
   * @param filename - The filename for mock/file cache.
   */
  async invalidate(cacheKey: string, filename: string): Promise<void> {
    const isMock = shouldMockService('db');
    if (isMock) {
      await this.invalidateMockCache(filename);
      return;
    }
    await this.invalidateRedisCache(cacheKey);
  }

  public async invalidateAll(): Promise<void> {
    const isMock = shouldMockService('db');
    if (isMock) {
      await this.clearAllMockCacheAndLog();
      return;
    }
    await this.clearAllRedisCacheAndLog();
  }

  /**
   * Queues a request for async processing, returning a queued status if already in progress.
   * If not already queued, starts the request in the background and returns queued status.
   * Uses the global RequestQueue via rateLimiter for all queue management.
   * @template T
   * @param service - The service name (for stats/logging).
   * @param cacheKey - The logical cache key (used for Redis).
   * @param requestFn - The function to execute for the request.
   * @param ttl - Optional time-to-live in ms (overrides default).
   * @param filename - The filename for mock/file cache.
   * @param skipSet - If true, does not set the result in cache (for special cases).
   * @returns The result if available, or a queued status object.
   */
  async queueRequest<T>(
    service: string,
    cacheKey: string,
    requestFn: () => Promise<T>,
    ttl: number | undefined,
    filename: string,
    skipSet: boolean = false
  ): Promise<T | { status: string; signature: string }> {
    const cached = await this.get<T>(cacheKey, filename);
    if (cached !== null && cached !== undefined) {
      return cached;
    }

    // Always use the global RequestQueue via rateLimiter for queue management
    try {
      const result = await this.rateLimiter.queueRequest<T>(service, async () => {
        const data = await requestFn();
        if (!skipSet) {
          await this.set<T>(service, cacheKey, data, ttl, filename);
        }
        return data;
      }, cacheKey);
      // If the result is a queued status, return it as-is
      if (result && typeof result === 'object' && 'status' in result && result.status === 'already_queued') {
        return { status: 'queued', signature: cacheKey };
      }
      return result;
    } catch (err) {
      logWithTimestampToFile('error', `[CacheService] queueRequest: Error for ${cacheKey}:`, err);
      return { status: 'queued', signature: cacheKey };
    }
  }

  async waitForRateLimit(service: string): Promise<void> {
    logWithTimestampToFile('log', `[CacheService] waitForRateLimit called for ${service}`);
    await this.rateLimiter.waitForRateLimit(service);
    logWithTimestampToFile('log', `[CacheService] waitForRateLimit completed for ${service}`);
  }

  async canMakeRequest(service: string): Promise<boolean> {
    logWithTimestampToFile('log', `[CacheService] canMakeRequest called for ${service}`);
    const result = await this.rateLimiter.canMakeRequest(service);
    logWithTimestampToFile('log', `[CacheService] canMakeRequest result for ${service}: ${result}`);
    return result;
  }

  async recordRateLimitHit(service: string, retryAfter?: number): Promise<void> {
    logWithTimestampToFile('log', `[CacheService] recordRateLimitHit called for ${service}, retryAfter: ${retryAfter || 'not specified'}`);
    await this.rateLimiter.recordRateLimitHit(service, retryAfter);
    logWithTimestampToFile('log', `[CacheService] recordRateLimitHit completed for ${service}`);
  }

  /**
   * Clears the queue for a given service.
   * @param service - The service name.
   */
  clearQueue(service: string) {
    logWithTimestampToFile('log', `[CacheService] clearQueue called for ${service}`);
    this.rateLimiter.clearQueue(service);
    logWithTimestampToFile('log', `[CacheService] clearQueue completed for ${service}`);
  }

  // --- Private Helpers ---

  /**
   * Checks if a cache entry is expired based on timestamp and TTL.
   * @param cacheData - The cached data object.
   * @param ttl - Optional time-to-live in ms (overrides default).
   * @returns True if expired, false otherwise.
   */
  private isExpired(cacheData: unknown, ttl?: number): boolean {
    if (!cacheData || typeof cacheData !== 'object' || cacheData === null) return false;
    // Type guard for timestamp and ttl
    const data = cacheData as { timestamp?: number; ttl?: number };
    if (typeof data.timestamp !== 'number') return false;
    const now = Date.now();
    if (ttl !== undefined) {
      if (now - data.timestamp > ttl) return true;
    } else if (typeof data.ttl === 'number') {
      if (now - data.timestamp > data.ttl) return true;
    }
    if (now - data.timestamp > this.config.maxAge) return true;
    return false;
  }

  private getFromMockCache<T>(filename: string): T | null {
    if (this.mockMemoryCache.has(filename)) {
      return this.mockMemoryCache.get(filename) as T;
    }
    return null;
  }

  private async getFromMockFile<T>(filename: string): Promise<T | null> {
    const fileData = await this.readMockCacheFile(filename);
    if (fileData !== null) {
      this.mockMemoryCache.set(filename, fileData);
      return fileData as T;
    }
    return null;
  }

  private async getFromRedis<T>(cacheKey: string): Promise<T | null> {
    if (!this.redis) {
      logWithTimestampToFile('warn', '[CacheService] Redis not available, returning null');
      return null;
    }
    logWithTimestampToFile('log', `[CacheService] Server-side cache get from Redis for cacheKey: ${cacheKey}`);
    const cached = await this.redis.get(cacheKey);
    if (!cached) {
      logWithTimestampToFile('log', `[CacheService] Cache miss for cacheKey: ${cacheKey}`);
      return null;
    }
    if (typeof cached !== 'string') {
      logWithTimestampToFile('warn', `[CacheService] Redis returned non-string value for cacheKey: ${cacheKey}`);
      return null;
    }
    const cacheData = JSON.parse(cached);
    if (this.isExpired(cacheData)) {
      logWithTimestampToFile('log', `[CacheService] Cache expired for cacheKey: ${cacheKey}`);
      await this.redis.del(cacheKey);
      return null;
    }
    logWithTimestampToFile('log', `[CacheService] Returning fresh cache data for cacheKey: ${cacheKey}`);
    return cacheData.data as T;
  }

  private async setMockCache<T>(filename: string, data: T): Promise<void> {
    this.mockMemoryCache.set(filename, data);
    await this.writeMockCacheFile(filename, data);
    logWithTimestampToFile('log', `[CacheService] [MOCK] Set in-memory and file cache for filename: ${filename}`);
  }

  private async setRedisCache<T>(filename: string, data: T, ttl: number): Promise<void> {
    if (!this.redis) {
      logWithTimestampToFile('warn', '[CacheService] Redis not available, skipping cache set');
      return;
    }
    const now = Date.now();
    const cacheEntry = { data, timestamp: now, ttl };
    const redisTTL = Math.ceil(ttl / 1000);
    logWithTimestampToFile('log', `[CacheService] Server-side cache set for filename: ${String(filename)}, ttl: ${redisTTL}s`);
    await this.redis.setex(String(filename), redisTTL, JSON.stringify(cacheEntry));
    logWithTimestampToFile('log', `[CacheService] Successfully cached data for filename: ${String(filename)}`);
  }

  private async invalidateMockCache(filename: string): Promise<void> {
    this.mockMemoryCache.delete(filename);
    await this.deleteMockCacheFile(filename);
    logWithTimestampToFile('log', `[CacheService] [MOCK] Invalidated in-memory and file cache for filename: ${filename}`);
  }

  private async invalidateRedisCache(filename: string): Promise<void> {
    if (!this.redis) {
      logWithTimestampToFile('warn', '[CacheService] Redis not available, skipping cache invalidate');
      return;
    }
    logWithTimestampToFile('log', `[CacheService] Server-side cache invalidate for Redis filename: ${String(filename)}`);
    await this.redis.del(String(filename));
    logWithTimestampToFile('log', `[CacheService] Redis invalidate completed for filename: ${String(filename)}`);
  }

  private async clearAllMockCacheAndLog(): Promise<void> {
    await this.clearAllMockCache();
    logWithTimestampToFile('log', '[CacheService] invalidateAll: Cleared all mock cache');
  }

  private async clearAllRedisCacheAndLog(): Promise<void> {
    if (!this.redis) {
      logWithTimestampToFile('warn', '[CacheService] Redis not available, skipping invalidateAll');
      return;
    }
    const keys = await this.redis.keys(`*`);
    if (Array.isArray(keys) && keys.length > 0) {
      await this.redis.del(...keys);
      logWithTimestampToFile('log', `[CacheService] invalidateAll: Deleted ${keys.length} Redis cache keys`);
    } else {
      logWithTimestampToFile('log', '[CacheService] invalidateAll: No Redis cache keys found');
    }
  }

  // --- File Helpers ---

  private getMockCacheFilePath(filename: string): string {
    if (!fs || !path) throw new Error('fs/path not available');
    
    // Determine entity type and organize into subfolders
    const entityType = getEntityTypeFromFilename(filename);
    const baseDir = entityType !== 'unknown' ? entityType : 'misc';
    
    return path.join(process.cwd(), this.mockCacheDir, baseDir, filename);
  }

  private async readMockCacheFile(filename: string): Promise<unknown | null> {
    if (!fs || !path) return null;
    const filePath = this.getMockCacheFilePath(filename);
    if (!fs.existsSync(filePath)) return null;
    try {
      const content = await fs.promises.readFile(filePath, 'utf8');
      // Try to parse as JSON, but if it fails, return as string (for HTML)
      try {
        return JSON.parse(content);
      } catch {
        return content;
      }
    } catch (e) {
      logWithTimestampToFile('error', `[CacheService] Error reading mock cache file for filename ${filename}:`, e);
      return null;
    }
  }

  private async writeMockCacheFile(filename: string, value: unknown): Promise<void> {
    if (!fs || !path) return;
    const filePath = this.getMockCacheFilePath(filename);
    let dataToWrite: string;
    if (typeof value === 'string') {
      dataToWrite = value;
    } else {
      dataToWrite = JSON.stringify(value, null, 2);
    }
    logWithTimestampToFile('log', `[CacheService] [MOCK] Writing to file ${filePath}: ${dataToWrite.substring(0, 200)}${dataToWrite.length > 200 ? '...' : ''}`);
    await fs.promises.writeFile(filePath, dataToWrite);
  }

  private async deleteMockCacheFile(filename: string): Promise<void> {
    if (!fs || !path) return;
    const filePath = this.getMockCacheFilePath(filename);
    try {
      if (typeof filePath === 'string') {
        await fs.promises.unlink(filePath);
      }
    } catch {
      logWithTimestampToFile('warn', `[CacheService] Failed to delete mock cache file: ${filename}`);
    }
  }

  public async clearAllMockCache(): Promise<void> {
    this.mockMemoryCache.clear();
    if (!fs || !path) return;
    const dir = path.join(process.cwd(), this.mockCacheDir);
    try {
      const subdirs = await fs.promises.readdir(dir);
      await Promise.all(
        subdirs.map(async (subdir: string) => {
          const subdirPath = path.join(dir, subdir);
          const stat = await fs.promises.stat(subdirPath);
          if (stat.isDirectory()) {
            const files = await fs.promises.readdir(subdirPath);
            await Promise.all(
              files.map((file: string) => fs.promises.unlink(path.join(subdirPath, file)))
            );
          }
        })
      );
    } catch {
      // Ignore if dir doesn't exist
    }
  }
}

export const cacheService = new CacheService();
export default cacheService;

export const CACHE_CONFIGS = {
  HEROES: { key: 'heroes.json', ttl: 24 * 60 * 60 * 1000 }, // 24 hours
  PLAYER_DATA: { key: 'player-data.json', ttl: 10 * 60 * 1000 }, // 10 minutes
  PLAYER_MATCHES: { key: 'player-matches.json', ttl: 10 * 60 * 1000 }, // 10 minutes
  TEAM_DATA: { key: 'team.json', ttl: 24 * 60 * 60 * 1000 }, // 24 hours
  MATCH_DETAILS: { key: 'match.json', ttl: 24 * 60 * 60 * 1000 }, // 24 hours
  // Add more configs as needed
};