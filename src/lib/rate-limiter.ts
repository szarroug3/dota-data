/**
 * Redis-based rate limiter for external API calls
 *
 * Implements distributed rate limiting using Redis to coordinate across Vercel instances.
 * Uses sliding window algorithm with Redis sorted sets for precise rate limiting.
 */

import { Redis } from '@upstash/redis';

import { CacheService } from '@/lib/cache-service';
import { getEnv } from '@/lib/config/environment';
import { cacheLogger } from '@/lib/logger';
import {
  RateLimitBackend,
  ExternalService,
  RateLimitConfig,
  RateLimitError,
  RateLimitErrorType,
  DEFAULT_SERVICE_LIMITS,
} from '@/types/rate-limit';

// ============================================================================
// REDIS RATE LIMITER IMPLEMENTATION
// ============================================================================

/**
 * Redis-based rate limiter backend
 */
class RedisRateLimiter implements RateLimitBackend {
  private redis: Redis;
  private configs: Map<ExternalService, RateLimitConfig>;
  private lastRequestTimes: Map<ExternalService, number>;

  constructor(redisUrl: string) {
    // Parse Redis URL to extract token
    const url = new URL(redisUrl);
    const token = url.password;

    this.redis = new Redis({
      url: redisUrl,
      token: token,
    });
    this.configs = new Map();
    this.lastRequestTimes = new Map();

    // Initialize with default configs
    Object.entries(DEFAULT_SERVICE_LIMITS).forEach(([service, config]) => {
      this.configs.set(service as ExternalService, config);
    });
  }

  /**
   * Wait for rate limit clearance before making a request
   */
  async waitForClearance(service: ExternalService): Promise<void> {
    const config = this.configs.get(service);
    if (!config) {
      throw new Error(`No rate limit config found for service: ${service}`);
    }

    try {
      // Check minimum delay since last request
      const lastRequestTime = this.lastRequestTimes.get(service) || 0;
      const timeSinceLastRequest = Date.now() - lastRequestTime;

      if (timeSinceLastRequest < config.minDelayMs) {
        const waitTime = config.minDelayMs - timeSinceLastRequest;
        cacheLogger.debug('Rate Limiter', `Waiting ${waitTime}ms for minimum delay (${service})`);
        await this.sleep(waitTime);
      }

      // Check sliding window rate limit
      await this.checkSlidingWindowLimit(service, config);

      // Update last request time
      this.lastRequestTimes.set(service, Date.now());
    } catch (error) {
      cacheLogger.error(
        'Rate Limiter',
        `Rate limit check failed for ${service}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );

      // If Redis fails, fall back to minimum delay only
      const lastRequestTime = this.lastRequestTimes.get(service) || 0;
      const timeSinceLastRequest = Date.now() - lastRequestTime;

      if (timeSinceLastRequest < config.minDelayMs) {
        const waitTime = config.minDelayMs - timeSinceLastRequest;
        cacheLogger.warn('Rate Limiter', `Redis unavailable, using minimum delay fallback: ${waitTime}ms (${service})`);
        await this.sleep(waitTime);
      }
    }
  }

  /**
   * Check sliding window rate limit using Redis sorted sets
   */
  private async checkSlidingWindowLimit(service: ExternalService, config: RateLimitConfig): Promise<void> {
    const key = `rate_limit:${service}`;
    const now = Date.now();
    const windowStart = now - config.windowMs;

    // Use Redis pipeline for atomic operations
    const pipeline = this.redis.pipeline();

    // Remove expired entries
    pipeline.zremrangebyscore(key, 0, windowStart);

    // Count current requests in window
    pipeline.zcard(key);

    // Add current request
    pipeline.zadd(key, { score: now, member: `${now}-${Math.random()}` });

    // Set expiration
    pipeline.expire(key, Math.ceil(config.windowMs / 1000));

    const results = await pipeline.exec();

    if (!results || results.length < 2) {
      throw new Error('Redis pipeline execution failed');
    }

    const currentCount = results[1] as number;

    if (currentCount >= config.maxRequests) {
      // Calculate wait time until oldest request expires
      const oldestRequest = await this.redis.zrange(key, 0, 0, { withScores: true });
      if (oldestRequest && oldestRequest.length > 0) {
        const oldestTime = (oldestRequest[0] as { score: number }).score;
        const waitTime = oldestTime + config.windowMs - now;

        if (waitTime > 0) {
          cacheLogger.debug('Rate Limiter', `Rate limit exceeded, waiting ${waitTime}ms (${service})`);
          await this.sleep(waitTime);
        }
      }
    }
  }

  /**
   * Check if the backend is healthy
   */
  async isHealthy(): Promise<boolean> {
    try {
      await this.redis.ping();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Sleep utility function
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// ============================================================================
// FILE RATE LIMITER IMPLEMENTATION (MOCK MODE)
// ============================================================================

/**
 * File-based rate limiter for mock mode that simulates Redis behavior
 */
class FileRateLimiter implements RateLimitBackend {
  private cache: CacheService;
  private configs: Map<ExternalService, RateLimitConfig>;
  private lastRequestTimes: Map<ExternalService, number>;

  constructor() {
    this.cache = new CacheService();
    this.configs = new Map();
    this.lastRequestTimes = new Map();

    // Initialize with default configs
    Object.entries(DEFAULT_SERVICE_LIMITS).forEach(([service, config]) => {
      this.configs.set(service as ExternalService, config);
    });
  }

  /**
   * Wait for rate limit clearance before making a request
   */
  async waitForClearance(service: ExternalService): Promise<void> {
    cacheLogger.info('Rate Limiter', `File backend: waitForClearance called for ${service}`);

    const config = this.configs.get(service);
    if (!config) {
      throw new RateLimitErrorImpl(
        `Rate limit config not found for service: ${service}`,
        'service_unavailable',
        service,
        false,
      );
    }

    // Enforce minimum delay between requests
    const lastRequestTime = this.lastRequestTimes.get(service) || 0;
    const timeSinceLastRequest = Date.now() - lastRequestTime;

    if (timeSinceLastRequest < config.minDelayMs) {
      const waitTime = config.minDelayMs - timeSinceLastRequest;
      cacheLogger.info('Rate Limiter', `File backend: waiting ${waitTime}ms (${service})`);
      await this.sleep(waitTime);
    }

    // Check sliding window rate limit using file cache
    await this.checkSlidingWindowLimit(service, config);

    // Update last request time
    this.lastRequestTimes.set(service, Date.now());
  }

  private async checkSlidingWindowLimit(service: ExternalService, config: RateLimitConfig): Promise<void> {
    const key = `rate_limit:${service}`;
    const now = Date.now();
    const windowStart = now - config.windowMs;

    // Get current requests from cache
    const cachedData = await this.cache.get<{ requests: Array<{ timestamp: number; id: string }> }>(key);
    const requests = cachedData?.requests || [];

    // Remove expired requests
    const validRequests = requests.filter((req) => req.timestamp > windowStart);

    cacheLogger.info(
      'Rate Limiter',
      `File backend: ${validRequests.length}/${config.maxRequests} requests in window (${service})`,
    );

    // Check if we're within the limit
    if (validRequests.length >= config.maxRequests) {
      // Calculate wait time until oldest request expires
      const oldestRequest = validRequests.sort((a, b) => a.timestamp - b.timestamp)[0];
      const waitTime = oldestRequest.timestamp + config.windowMs - now;

      if (waitTime > 0) {
        cacheLogger.info('Rate Limiter', `File backend: rate limit exceeded, waiting ${waitTime}ms (${service})`);
        await this.sleep(waitTime);
      }
    }

    // Add current request
    const newRequest = { timestamp: now, id: `${now}-${Math.random()}` };
    const updatedRequests = [...validRequests, newRequest];

    // Store updated requests with TTL
    cacheLogger.info('Rate Limiter', `File backend: storing ${updatedRequests.length} requests for ${service}`);
    await this.cache.set(key, { requests: updatedRequests }, Math.ceil(config.windowMs / 1000));
  }

  /**
   * Check if the backend is healthy
   */
  async isHealthy(): Promise<boolean> {
    try {
      await this.cache.isHealthy();
      return true;
    } catch (error) {
      cacheLogger.error(
        'Rate Limiter',
        `File backend health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      return false;
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// ============================================================================
// MEMORY FALLBACK RATE LIMITER
// ============================================================================

/**
 * In-memory rate limiter for fallback when Redis is unavailable
 */
class MemoryRateLimiter implements RateLimitBackend {
  private configs: Map<ExternalService, RateLimitConfig>;
  private lastRequestTimes: Map<ExternalService, number>;

  constructor() {
    this.configs = new Map();
    this.lastRequestTimes = new Map();

    // Initialize with default configs
    Object.entries(DEFAULT_SERVICE_LIMITS).forEach(([service, config]) => {
      this.configs.set(service as ExternalService, config);
    });
  }

  /**
   * Wait for rate limit clearance before making a request
   */
  async waitForClearance(service: ExternalService): Promise<void> {
    const config = this.configs.get(service);
    if (!config) {
      throw new Error(`No rate limit config found for service: ${service}`);
    }

    const lastRequestTime = this.lastRequestTimes.get(service) || 0;
    const timeSinceLastRequest = Date.now() - lastRequestTime;

    if (timeSinceLastRequest < config.minDelayMs) {
      const waitTime = config.minDelayMs - timeSinceLastRequest;
      cacheLogger.debug('Rate Limiter', `Memory fallback: waiting ${waitTime}ms (${service})`);
      await this.sleep(waitTime);
    }

    this.lastRequestTimes.set(service, Date.now());
  }

  /**
   * Check if the backend is healthy
   */
  async isHealthy(): Promise<boolean> {
    return true; // Memory backend is always healthy
  }

  /**
   * Sleep utility function
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// ============================================================================
// RATE LIMITER FACTORY
// ============================================================================

/**
 * Create a rate limiter instance
 */
export function createRateLimiter(redisUrl?: string): RateLimitBackend {
  if (redisUrl) {
    try {
      const redisLimiter = new RedisRateLimiter(redisUrl);
      cacheLogger.info('Rate Limiter', 'Initialized Redis-based rate limiter');
      return redisLimiter;
    } catch (error) {
      cacheLogger.warn(
        'Rate Limiter',
        `Failed to initialize Redis rate limiter: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  cacheLogger.info('Rate Limiter', 'Using memory-based rate limiter fallback');
  return new MemoryRateLimiter();
}

/**
 * Global rate limiter instance
 */
export const rateLimiter = (() => {
  // In mock mode, use file-based rate limiter to simulate Redis persistence
  if (getEnv.USE_MOCK_API() || getEnv.USE_MOCK_DB()) {
    cacheLogger.info('Rate Limiter', 'Using file-based rate limiter (mock mode)');
    return new FileRateLimiter();
  }

  // In production, try Redis first, fallback to memory
  return createRateLimiter(process.env.UPSTASH_REDIS_REST_URL);
})();

/**
 * Rate limiter error class
 */
export class RateLimitErrorImpl extends Error implements RateLimitError {
  constructor(
    message: string,
    public type: RateLimitErrorType,
    public service: ExternalService,
    public retryable: boolean = true,
    public retryAfter?: number,
  ) {
    super(message);
    this.name = 'RateLimitError';
  }
}
