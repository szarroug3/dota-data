/**
 * API-related type definitions
 *
 * Contains interfaces for API requests, responses, and shared types
 * used by backend services and API routes.
 */

// ============================================================================
// GENERIC API TYPES
// ============================================================================

/**
 * Base API request interface with optional force refresh flag
 */
export interface ApiRequest {
  force?: boolean;
}

/**
 * Standard API error response structure
 */
export interface ApiErrorResponse {
  error: string;
  status?: number;
  details?: string;
}

/**
 * API status response for health checks and status endpoints
 */
export interface ApiStatusResponse {
  status: string;
  signature: string;
  timestamp: string;
}

/**
 * Generic API response type that can be data, error, or status
 */
export type ApiResponse<T> = T | ApiErrorResponse | ApiStatusResponse;

/**
 * Standard API success response wrapper
 */
export interface ApiSuccessResponse<T> {
  data: T;
  timestamp: string;
  cached?: boolean;
}

// ============================================================================
// SHARED PAYLOAD TYPES
// ============================================================================

// ============================================================================
// CACHE API TYPES
// ============================================================================

/**
 * Cache invalidation request
 */
export interface CacheInvalidateRequest extends ApiRequest {
  pattern?: string;
  key?: string;
}

/**
 * Cache invalidation response
 */
export interface CacheInvalidateResponse {
  invalidated: number;
  pattern?: string;
}

/**
 * Cache status response
 */
export interface CacheStatusResponse {
  backend: 'redis' | 'memory';
  keys: number;
  memoryUsage?: number;
  uptime: number;
}

// ============================================================================
// RATE LIMIT API TYPES
// ============================================================================

/**
 * Rate limit check request
 */
export interface RateLimitCheckRequest extends ApiRequest {
  service: string;
  identifier: string;
  window?: number;
  max?: number;
}

/**
 * Rate limit check response
 */
export interface RateLimitCheckResponse {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
  service: string;
}

/**
 * Rate limit status response
 */
export interface RateLimitStatusResponse {
  service: string;
  currentUsage: number;
  limit: number;
  window: number;
  resetTime: number;
}

// ============================================================================
// QUEUE API TYPES
// ============================================================================

/**
 * Job enqueue request
 */
export interface JobEnqueueRequest extends ApiRequest {
  jobType: string;
  payload: Record<string, string | number | boolean | null>;
  priority?: 'low' | 'normal' | 'high';
  delay?: number;
}

/**
 * Job enqueue response
 */
export interface JobEnqueueResponse {
  jobId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  estimatedTime?: number;
}

/**
 * Job status request
 */
export interface JobStatusRequest extends ApiRequest {
  jobId: string;
}

/**
 * Job status response
 */
export interface JobStatusResponse {
  jobId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress?: number;
  result?: Record<string, string | number | boolean | null>;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// EXTERNAL API TYPES
// ============================================================================

/**
 * External API configuration
 */
export interface ExternalApiConfig {
  baseUrl: string;
  timeout: number;
  rateLimit: {
    window: number;
    max: number;
  };
  headers?: Record<string, string>;
}

/**
 * External API response wrapper
 */
export interface ExternalApiResponse<T> {
  data: T;
  status: number;
  headers: Record<string, string>;
  cached: boolean;
  timestamp: string;
}

/**
 * External API error response
 */
export interface ExternalApiError {
  status: number;
  message: string;
  retryAfter?: number;
  service: string;
}

// ============================================================================
// LOGGING API TYPES
// ============================================================================

/**
 * Log level enumeration
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Log entry structure
 */
export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  service?: string;
  context?: Record<string, string | number | boolean | null>;
  error?: Error;
}

/**
 * Logging configuration
 */
export interface LoggingConfig {
  level: LogLevel;
  enableDebug: boolean;
  logFilePath: string;
  maxFileSize?: number;
  maxFiles?: number;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

/**
 * Pagination response wrapper
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * Sorting parameters
 */
export interface SortParams {
  field: string;
  direction: 'asc' | 'desc';
}

/**
 * Filter parameters
 */
export interface FilterParams {
  [key: string]: string | number | boolean | Array<string | number>;
}

/**
 * Search parameters
 */
export interface SearchParams {
  query: string;
  fields?: string[];
  fuzzy?: boolean;
}

// ============================================================================
// HEALTH CHECK TYPES
// ============================================================================

/**
 * Health check status
 */
export interface HealthCheckStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  services: {
    [service: string]: {
      status: 'healthy' | 'degraded' | 'unhealthy';
      responseTime?: number;
      error?: string;
    };
  };
  version: string;
  environment: string;
}
