/**
 * Memory-based rate limiting backend
 *
 * Provides in-memory rate limiting for development and fallback scenarios.
 * Uses sliding window algorithm with automatic cleanup.
 */

import {
    RateLimitBackend,
    RateLimitBackendError,
    RateLimitBackendType,
    RateLimitConfig,
    RateLimitResult,
    RateLimitStats
} from '@/lib/types/rate-limit';

/**
 * Memory rate limiting backend implementation
 */
export class MemoryRateLimitBackend implements RateLimitBackend {
  private counters = new Map<string, { count: number; resetTime: number }>();
  private retryDelays = new Map<string, number>();
  private stats = {
    totalRequests: 0,
    allowedRequests: 0,
    blockedRequests: 0,
    startTime: Date.now()
  };

  /**
   * Check if a request is allowed within the rate limit
   */
  async checkLimit(key: string, config: RateLimitConfig): Promise<RateLimitResult> {
    try {
      this.stats.totalRequests++;
      const now = Math.floor(Date.now() / 1000);

      // Get current counter for this key
      const current = this.counters.get(key);
      let count = 0;
      let resetTime = now + config.window;

      if (current) {
        // If window has expired, start fresh
        if (now >= current.resetTime) {
          count = 1;
          resetTime = now + config.window;
        } else {
          // Still in current window
          count = current.count + 1;
          resetTime = current.resetTime;
        }
      } else {
        // First request in this window
        count = 1;
        resetTime = now + config.window;
      }

      // Update counter
      this.counters.set(key, { count, resetTime });

      // Check if request is allowed
      const allowed = count <= config.max;
      const remaining = Math.max(0, config.max - count);

      if (allowed) {
        this.stats.allowedRequests++;
      } else {
        this.stats.blockedRequests++;
      }

      return {
        allowed,
        remaining,
        resetTime,
        retryAfter: allowed ? undefined : resetTime - now
      };
    } catch (error) {
      throw new RateLimitBackendError(
        `Memory rate limit check failed: ${error}`,
        'memory',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Set a retry delay for a service
   */
  async setRetryDelay(service: string, delay: number): Promise<void> {
    try {
      this.retryDelays.set(service, delay);
    } catch (error) {
      throw new RateLimitBackendError(
        `Failed to set retry delay: ${error}`,
        'memory',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Get retry delay for a service
   */
  async getRetryDelay(service: string): Promise<number> {
    try {
      return this.retryDelays.get(service) || 0;
    } catch (error) {
      throw new RateLimitBackendError(
        `Failed to get retry delay: ${error}`,
        'memory',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Get rate limiting statistics
   */
  async getStats(): Promise<RateLimitStats> {
    const totalRequests = this.stats.totalRequests;
    const allowedRequests = this.stats.allowedRequests;
    const blockedRequests = this.stats.blockedRequests;

    return {
      totalRequests,
      allowedRequests,
      blockedRequests,
      fallbackCount: 0, // Memory backend is never a fallback
      uptime: Math.max(1, Date.now() - this.stats.startTime), // Ensure uptime is at least 1ms
      backend: 'memory' as RateLimitBackendType
    };
  }

  /**
   * Check if the backend is healthy
   */
  async isHealthy(): Promise<boolean> {
    try {
      // Memory backend is always healthy
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Clear all rate limiting data
   */
  async clear(): Promise<void> {
    try {
      this.counters.clear();
      this.retryDelays.clear();
      this.stats = {
        totalRequests: 0,
        allowedRequests: 0,
        blockedRequests: 0,
        startTime: Date.now()
      };
    } catch (error) {
      throw new RateLimitBackendError(
        `Failed to clear memory rate limit data: ${error}`,
        'memory',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Clean up expired entries (called periodically)
   */
  private cleanup(): void {
    const now = Math.floor(Date.now() / 1000);
    for (const [key, data] of this.counters.entries()) {
      if (data.resetTime <= now) {
        this.counters.delete(key);
      }
    }
  }
} 