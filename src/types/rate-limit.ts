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
   * Check if a request is allowed within the rate limit
   */
  checkLimit(key: string, config: RateLimitConfig): Promise<RateLimitResult>;

  /**
   * Get current usage for a key
   */
  getUsage(key: string): Promise<RateLimitUsage>;

  /**
   * Reset rate limit for a key
   */
  reset(key: string): Promise<boolean>;

  /**
   * Set a custom retry delay for a service
   */
  setRetryDelay(service: string, delay: number): Promise<void>;

  /**
   * Get retry delay for a service
   */
  getRetryDelay(service: string): Promise<number>;

  /**
   * Get rate limit statistics
   */
  getStats(): Promise<RateLimitStats>;

  /**
   * Check if the backend is healthy
   */
  isHealthy(): Promise<boolean>;
}

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  window: number; // Window size in seconds
  max: number; // Maximum requests per window
  service: string; // Service identifier
  identifier?: string; // Optional identifier for the key
}

/**
 * Rate limit result
 */
export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
  service: string;
  key: string;
}

/**
 * Rate limit usage information
 */
export interface RateLimitUsage {
  current: number;
  limit: number;
  window: number;
  resetTime: number;
  remaining: number;
}

/**
 * Rate limit statistics
 */
export interface RateLimitStats {
  totalChecks: number;
  allowed: number;
  blocked: number;
  services: Record<
    string,
    {
      checks: number;
      allowed: number;
      blocked: number;
      averageResponseTime: number;
    }
  >;
  backend: RateLimitBackendType;
  uptime: number;
}

// ============================================================================
// RATE LIMIT SERVICE TYPES
// ============================================================================

/**
 * Rate limit service configuration
 */
export interface RateLimitServiceConfig {
  useRedis: boolean;
  redisUrl?: string;
  fallbackToMemory: boolean;
  defaultWindow: number;
  defaultMax: number;
  retryDelayMultiplier: number;
  maxRetryDelay: number;
}

/**
 * Rate limit service interface
 */
export interface RateLimitService {
  /**
   * Check if a request is allowed within the rate limit
   */
  checkLimit(key: string, config: RateLimitConfig): Promise<RateLimitResult>;

  /**
   * Get current usage for a key
   */
  getUsage(key: string): Promise<RateLimitUsage>;

  /**
   * Reset rate limit for a key
   */
  reset(key: string): Promise<boolean>;

  /**
   * Set a custom retry delay for a service
   */
  setRetryDelay(service: string, delay: number): Promise<void>;

  /**
   * Get retry delay for a service
   */
  getRetryDelay(service: string): Promise<number>;

  /**
   * Get rate limit statistics
   */
  getStats(): Promise<RateLimitStats>;

  /**
   * Check if the service is healthy
   */
  isHealthy(): Promise<boolean>;

  /**
   * Get the current backend type
   */
  getBackendType(): RateLimitBackendType;
}

// ============================================================================
// SERVICE-SPECIFIC RATE LIMIT TYPES
// ============================================================================

/**
 * External service enumeration
 */
export type ExternalService = 'opendota' | 'dotabuff' | 'stratz' | 'd2pt';

/**
 * Service-specific rate limit configuration
 */
export interface ServiceRateLimitConfig {
  opendota: RateLimitConfig;
  dotabuff: RateLimitConfig;
  stratz: RateLimitConfig;
  d2pt: RateLimitConfig;
}

/**
 * Default rate limit configurations for each service
 */
export const DEFAULT_SERVICE_LIMITS: ServiceRateLimitConfig = {
  opendota: { window: 60, max: 60, service: 'opendota' },
  dotabuff: { window: 60, max: 60, service: 'dotabuff' },
  stratz: { window: 60, max: 20, service: 'stratz' },
  d2pt: { window: 60, max: 30, service: 'd2pt' },
};

// ============================================================================
// RATE LIMIT ERROR TYPES
// ============================================================================

/**
 * Rate limit error types
 */
export type RateLimitErrorType =
  | 'connection_failed'
  | 'timeout'
  | 'invalid_config'
  | 'service_unavailable'
  | 'network_error';

/**
 * Rate limit error interface
 */
export interface RateLimitError extends Error {
  type: RateLimitErrorType;
  service: string;
  key?: string;
  retryable: boolean;
  retryAfter?: number;
}

// ============================================================================
// RATE LIMIT UTILITY TYPES
// ============================================================================

/**
 * Rate limit key builder interface
 */
export interface RateLimitKeyBuilder {
  /**
   * Build a rate limit key for a service and identifier
   */
  build(service: ExternalService, identifier: string): string;

  /**
   * Build a pattern for rate limit operations
   */
  buildPattern(service: ExternalService, pattern: string): string;

  /**
   * Parse a rate limit key to extract components
   */
  parse(key: string): {
    service: ExternalService;
    identifier: string;
  } | null;
}

/**
 * Rate limit window types
 */
export type RateLimitWindow = 'sliding' | 'fixed';

/**
 * Rate limit algorithm configuration
 */
export interface RateLimitAlgorithm {
  type: RateLimitWindow;
  precision: number; // Precision in seconds for sliding window
}

/**
 * Rate limit retry configuration
 */
export interface RateLimitRetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

/**
 * Rate limit monitoring event
 */
export interface RateLimitEvent {
  timestamp: string;
  service: ExternalService;
  key: string;
  allowed: boolean;
  remaining: number;
  responseTime: number;
  error?: string;
}
