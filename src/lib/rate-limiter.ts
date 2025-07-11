/**
 * Main rate limiting service
 *
 * Provides distributed rate limiting with automatic backend selection and fallback.
 * Uses Redis for production and memory for development/fallback scenarios.
 */

import { MemoryRateLimitBackend } from '@/lib/rate-limit-backends/memory';
import { RedisRateLimitBackend } from '@/lib/rate-limit-backends/redis';
import {
    RateLimitBackendError,
    RateLimitBackendType,
    RateLimitConfig,
    RateLimitError,
    RateLimitResult,
    RateLimitServiceConfig,
    RateLimitStats,
    SERVICE_LIMITS
} from '@/lib/types/rate-limit';

/**
 * Main rate limiting service with automatic backend selection
 */
export class RateLimiter {
  private redisBackend: RedisRateLimitBackend;
  private memoryBackend: MemoryRateLimitBackend;
  private config: RateLimitServiceConfig;

  constructor(config: RateLimitServiceConfig) {
    this.config = config;
    this.memoryBackend = new MemoryRateLimitBackend();
    
    // Only create Redis backend if Redis is enabled and URL is provided
    if (config.useRedis && config.redisUrl) {
      this.redisBackend = new RedisRateLimitBackend(config.redisUrl);
    } else {
      // Create a dummy Redis backend that will always throw errors
      this.redisBackend = new RedisRateLimitBackend('invalid-url');
    }
  }

  /**
   * Check if a request is allowed within the rate limit
   */
  async checkLimit(key: string, config: RateLimitConfig): Promise<RateLimitResult> {
    try {
      // Try Redis first if enabled
      if (this.config.useRedis) {
        try {
          return await this.redisBackend.checkLimit(key, config);
        } catch (error) {
          // If Redis fails and fallback is enabled, try memory
          if (this.config.fallbackToMemory && error instanceof RateLimitBackendError) {
            console.warn(`Redis rate limiting failed, falling back to memory: ${error.message}`);
            const result = await this.memoryBackend.checkLimit(key, config);
            return { ...result, fallback: true };
          }
          throw error;
        }
      }

      // Use memory backend
      return await this.memoryBackend.checkLimit(key, config);
    } catch (error) {
      throw new RateLimitError(
        `Rate limit check failed: ${error}`,
        undefined,
        config.service
      );
    }
  }

  /**
   * Check rate limit for a service with default limits
   */
  async checkServiceLimit(service: string, identifier: string): Promise<RateLimitResult> {
    const limits = this.config.defaultLimits?.[service] || SERVICE_LIMITS[service];
    
    if (!limits) {
      throw new RateLimitError(`No rate limits configured for service: ${service}`, undefined, service);
    }

    const key = `rate_limit:${service}:${identifier}`;
    const config: RateLimitConfig = {
      window: limits.window,
      max: limits.max,
      service,
      identifier
    };

    return this.checkLimit(key, config);
  }

  /**
   * Set a retry delay for a service
   */
  async setRetryDelay(service: string, delay: number): Promise<void> {
    try {
      if (this.config.useRedis) {
        try {
          await this.redisBackend.setRetryDelay(service, delay);
        } catch (error) {
          if (this.config.fallbackToMemory && error instanceof RateLimitBackendError) {
            console.warn(`Redis retry delay failed, falling back to memory: ${error.message}`);
            await this.memoryBackend.setRetryDelay(service, delay);
          } else {
            throw error;
          }
        }
      } else {
        await this.memoryBackend.setRetryDelay(service, delay);
      }
    } catch (error) {
      throw new RateLimitError(
        `Failed to set retry delay: ${error}`,
        undefined,
        service
      );
    }
  }

  /**
   * Get retry delay for a service
   */
  async getRetryDelay(service: string): Promise<number> {
    try {
      if (this.config.useRedis) {
        try {
          return await this.redisBackend.getRetryDelay(service);
        } catch (error) {
          if (this.config.fallbackToMemory && error instanceof RateLimitBackendError) {
            console.warn(`Redis retry delay failed, falling back to memory: ${error.message}`);
            return await this.memoryBackend.getRetryDelay(service);
          }
          throw error;
        }
      }

      return await this.memoryBackend.getRetryDelay(service);
    } catch (error) {
      throw new RateLimitError(
        `Failed to get retry delay: ${error}`,
        undefined,
        service
      );
    }
  }

  /**
   * Get rate limiting statistics
   */
  async getStats(): Promise<RateLimitStats> {
    try {
      if (this.config.useRedis) {
        try {
          return await this.redisBackend.getStats();
        } catch (error) {
          if (this.config.fallbackToMemory && error instanceof RateLimitBackendError) {
            console.warn(`Redis stats failed, falling back to memory: ${error.message}`);
            return await this.memoryBackend.getStats();
          }
          throw error;
        }
      }

      return await this.memoryBackend.getStats();
    } catch (error) {
      throw new RateLimitError(`Failed to get stats: ${error}`);
    }
  }

  /**
   * Check if the current backend is healthy
   */
  async isHealthy(): Promise<boolean> {
    try {
      if (this.config.useRedis) {
        try {
          return await this.redisBackend.isHealthy();
        } catch (error) {
          if (this.config.fallbackToMemory && error instanceof RateLimitBackendError) {
            console.warn(`Redis health check failed, falling back to memory: ${error.message}`);
            return await this.memoryBackend.isHealthy();
          }
          return false;
        }
      }

      return await this.memoryBackend.isHealthy();
    } catch {
      return false;
    }
  }

  /**
   * Clear all rate limiting data
   */
  async clear(): Promise<void> {
    try {
      if (this.config.useRedis) {
        try {
          await this.redisBackend.clear();
        } catch (error) {
          if (this.config.fallbackToMemory && error instanceof RateLimitBackendError) {
            console.warn(`Redis clear failed, falling back to memory: ${error.message}`);
            await this.memoryBackend.clear();
          } else {
            throw error;
          }
        }
      } else {
        await this.memoryBackend.clear();
      }
    } catch (error) {
      throw new RateLimitError(`Failed to clear rate limit data: ${error}`);
    }
  }

  /**
   * Get the current backend type
   */
  getBackendType(): RateLimitBackendType {
    return this.config.useRedis ? 'redis' : 'memory';
  }

  /**
   * Get the current configuration
   */
  getConfig(): RateLimitServiceConfig {
    return { ...this.config };
  }
} 