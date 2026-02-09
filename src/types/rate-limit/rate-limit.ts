/**
 * Rate limiting type definitions
 *
 * Contains interfaces and types for distributed rate limiting and backend implementations.
 */

// ============================================================================
// RATE LIMIT BACKEND TYPES
// ============================================================================

/**
 * Rate limit backend type enumeration
 */
export type RateLimitBackendType = 'redis' | 'memory';

/**
 * Rate limit backend interface that all implementations must implement
 */
export interface RateLimitBackend {
  /**
   * Wait for rate limit clearance before making a request
   */
  waitForClearance(service: ExternalService): Promise<void>;

  /**
   * Check if the backend is healthy
   */
  isHealthy(): Promise<boolean>;
}

/**
 * Rate limit configuration for a service
 */
export interface RateLimitConfig {
  service: ExternalService;
  minDelayMs: number; // Minimum delay between requests in milliseconds
  windowMs: number; // Rate limit window in milliseconds
  maxRequests: number; // Maximum requests per window
}

// ============================================================================
// RATE LIMIT SERVICE TYPES
// ============================================================================

/**
 * Rate limit service configuration
 */
export interface RateLimitServiceConfig {
  redisUrl?: string;
  fallbackToMemory: boolean;
  defaultMinDelayMs: number;
  defaultWindowMs: number;
  defaultMaxRequests: number;
}

// ============================================================================
// SERVICE-SPECIFIC RATE LIMIT TYPES
// ============================================================================

/**
 * External service enumeration
 */
export type ExternalService = 'opendota' | 'steam';

/**
 * Default rate limit configurations for each service
 */
export const DEFAULT_SERVICE_LIMITS: Record<ExternalService, RateLimitConfig> = {
  opendota: {
    service: 'opendota',
    minDelayMs: 1200, // 1.2 seconds between requests
    windowMs: 60 * 1000, // 1 minute window
    maxRequests: 50, // Conservative limit for free tier
  },
  steam: {
    service: 'steam',
    minDelayMs: 1000, // 1 second between requests
    windowMs: 60 * 1000, // 1 minute window
    maxRequests: 60,
  },
};

// ============================================================================
// RATE LIMIT ERROR TYPES
// ============================================================================

/**
 * Rate limit error types
 */
export type RateLimitErrorType = 'connection_failed' | 'timeout' | 'service_unavailable' | 'network_error';

/**
 * Rate limit error interface
 */
export interface RateLimitError extends Error {
  type: RateLimitErrorType;
  service: ExternalService;
  retryable: boolean;
  retryAfter?: number;
}
