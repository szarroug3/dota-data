/**
 * Rate limiting types and interfaces
 *
 * Defines types for distributed rate limiting with Redis and memory backends.
 * Supports per-service limits, sliding windows, and automatic fallback.
 */

/**
 * Rate limiting backend type
 */
export type RateLimitBackendType = 'redis' | 'memory';

/**
 * Rate limiting configuration
 */
export interface RateLimitConfig {
  window: number;        // Time window in seconds
  max: number;          // Maximum requests per window
  service: string;      // Service name (e.g., 'opendota', 'dotabuff')
  identifier: string;   // Unique identifier (e.g., 'user:123', 'ip:192.168.1.1')
}

/**
 * Rate limiting result
 */
export interface RateLimitResult {
  allowed: boolean;     // Whether the request is allowed
  remaining: number;    // Remaining requests in current window
  resetTime: number;    // Unix timestamp when the window resets
  retryAfter?: number;  // Seconds to wait before retry (if rate limited)
  fallback?: boolean;   // Whether fallback to memory was used
}

/**
 * Rate limiting statistics
 */
export interface RateLimitStats {
  totalRequests: number;
  allowedRequests: number;
  blockedRequests: number;
  fallbackCount: number;
  uptime: number;
  backend: RateLimitBackendType;
}

/**
 * Rate limiting backend interface
 */
export interface RateLimitBackend {
  /**
   * Check if a request is allowed within the rate limit
   */
  checkLimit(key: string, config: RateLimitConfig): Promise<RateLimitResult>;

  /**
   * Set a retry delay for a service
   */
  setRetryDelay(service: string, delay: number): Promise<void>;

  /**
   * Get retry delay for a service
   */
  getRetryDelay(service: string): Promise<number>;

  /**
   * Get rate limiting statistics
   */
  getStats(): Promise<RateLimitStats>;

  /**
   * Check if the backend is healthy
   */
  isHealthy(): Promise<boolean>;

  /**
   * Clear all rate limiting data
   */
  clear(): Promise<void>;
}

/**
 * Rate limiting service configuration
 */
export interface RateLimitServiceConfig {
  useRedis: boolean;
  redisUrl?: string;
  fallbackToMemory: boolean;
  defaultLimits?: Record<string, { window: number; max: number }>;
}

/**
 * Service-specific rate limits
 */
export const SERVICE_LIMITS: Record<string, { window: number; max: number }> = {
  opendota: { window: 60, max: 60 },    // 1 request/second
  dotabuff: { window: 60, max: 60 },    // 1 request/second
  stratz: { window: 60, max: 20 },      // 1 request/3 seconds
  d2pt: { window: 60, max: 30 }         // 1 request/2 seconds
};

/**
 * Rate limiting error types
 */
export class RateLimitError extends Error {
  constructor(
    message: string,
    public readonly retryAfter?: number,
    public readonly service?: string
  ) {
    super(message);
    this.name = 'RateLimitError';
  }
}

export class RateLimitBackendError extends Error {
  constructor(
    message: string,
    public readonly backend: RateLimitBackendType,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = 'RateLimitBackendError';
  }
} 