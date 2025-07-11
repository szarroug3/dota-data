/**
 * Queue-related type definitions
 *
 * Contains interfaces and types for background job queueing and QStash integration.
 */

// ============================================================================
// QUEUE BACKEND TYPES
// ============================================================================

/**
 * Queue backend type enumeration
 */
export type QueueBackendType = 'qstash' | 'memory';

/**
 * Queue backend interface that all implementations must implement
 */
export interface QueueBackend {
  /**
   * Enqueue a job for processing
   */
  enqueue(
    jobId: string,
    job: QueueJob
  ): Promise<QueueEnqueueResult>;

  /**
   * Get job status
   */
  getJobStatus(jobId: string): Promise<QueueJobStatus>;

  /**
   * Cancel a job
   */
  cancelJob(jobId?: string): Promise<boolean>;

  /**
   * Get queue statistics
   */
  getStats(): Promise<QueueStats>;

  /**
   * Check if the backend is healthy
   */
  isHealthy(): Promise<boolean>;

  /**
   * Clear all jobs (memory backend only)
   */
  clear(): Promise<void>;
}

/**
 * Queue job interface
 */
export interface QueueJob {
  endpoint: string;
  payload: JobPayload;
  priority?: QueueJobPriority;
  delay?: number;
  retries?: number;
  timeout?: number;
  headers?: Record<string, string>;
}

/**
 * Queue job priority
 */
export type QueueJobPriority = 'low' | 'normal' | 'high';

/**
 * Queue enqueue result
 */
export interface QueueEnqueueResult {
  jobId: string;
  status: QueueJobStatus['status'];
  estimatedTime?: number;
  backend: QueueBackendType;
}

/**
 * Queue job status
 */
export interface QueueJobStatus {
  jobId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress?: number;
  result?: Record<string, string | number | boolean | null>;
  error?: string;
  createdAt: string;
  updatedAt: string;
  estimatedCompletion?: string;
  retryCount?: number;
  maxRetries?: number;
}

/**
 * Queue statistics
 */
export interface QueueStats {
  totalJobs: number;
  queued: number;
  processing: number;
  completed: number;
  failed: number;
  cancelled: number;
  averageProcessingTime: number;
  backend: QueueBackendType;
  uptime: number;
}

// ============================================================================
// QUEUE SERVICE TYPES
// ============================================================================

/**
 * Queue service configuration
 */
export interface QueueServiceConfig {
  useQStash: boolean;
  qstashToken?: string;
  qstashCurrentSigningKey?: string;
  qstashNextSigningKey?: string;
  fallbackToMemory: boolean;
  defaultTimeout: number;
  maxRetries: number;
  baseDelay: number;
}

/**
 * Queue service interface
 */
export interface QueueService {
  /**
   * Enqueue a job for processing
   */
  enqueue(
    jobId: string,
    job: QueueJob
  ): Promise<QueueEnqueueResult>;

  /**
   * Get job status
   */
  getJobStatus(jobId: string): Promise<QueueJobStatus>;

  /**
   * Cancel a job
   */
  cancelJob(jobId?: string): Promise<boolean>;

  /**
   * Get queue statistics
   */
  getStats(): Promise<QueueStats>;

  /**
   * Check if the service is healthy
   */
  isHealthy(): Promise<boolean>;

  /**
   * Get the current backend type
   */
  getBackendType(): QueueBackendType;

  /**
   * Clear all jobs (memory backend only)
   */
  clear(): Promise<void>;
}

// ============================================================================
// QSTASH-SPECIFIC TYPES
// ============================================================================

/**
 * QStash job configuration
 */
export interface QStashJobConfig {
  endpoint: string;
  payload: JobPayload;
  headers?: Record<string, string>;
  delay?: number;
  retries?: number;
  timeout?: number;
  deduplicationId?: string;
}

/**
 * QStash response structure
 */
export interface QStashResponse {
  messageId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
}

/**
 * QStash webhook payload
 */
export interface QStashWebhookPayload {
  messageId: string;
  status: 'completed' | 'failed';
  result?: Record<string, string | number | boolean | null>;
  error?: string;
  timestamp: string;
}

/**
 * QStash signature verification
 */
export interface QStashSignature {
  signature: string;
  timestamp: string;
  messageId: string;
}

// ============================================================================
// JOB TYPE DEFINITIONS
// ============================================================================

/**
 * Job type enumeration
 */
export type JobType = 
  | 'parse:match'
  | 'fetch:player'
  | 'fetch:team'
  | 'fetch:heroes'
  | 'process:match'
  | 'update:cache'
  | 'invalidate:cache'
  | 'health:check';

/**
 * Job payload types
 */
export interface ParseMatchJobPayload {
  matchId: string;
  force?: boolean;
}

export interface FetchPlayerJobPayload {
  playerId: string;
  force?: boolean;
}

export interface FetchTeamJobPayload {
  teamId: string;
  force?: boolean;
}

export interface FetchHeroesJobPayload {
  force?: boolean;
}

export interface ProcessMatchJobPayload {
  matchId: string;
  data: Record<string, string | number | boolean | null>;
}

export interface UpdateCacheJobPayload {
  key: string;
  value: Record<string, string | number | boolean | null>;
  ttl?: number;
}

export interface InvalidateCacheJobPayload {
  pattern: string;
}

export interface HealthCheckJobPayload {
  services: string[];
}

/**
 * Job payload union type
 */
export type JobPayload = 
  | ParseMatchJobPayload
  | FetchPlayerJobPayload
  | FetchTeamJobPayload
  | FetchHeroesJobPayload
  | ProcessMatchJobPayload
  | UpdateCacheJobPayload
  | InvalidateCacheJobPayload
  | HealthCheckJobPayload;

// ============================================================================
// QUEUE ERROR TYPES
// ============================================================================

/**
 * Queue error types
 */
export type QueueErrorType = 
  | 'connection_failed'
  | 'timeout'
  | 'job_not_found'
  | 'job_already_exists'
  | 'invalid_payload'
  | 'service_unavailable'
  | 'quota_exceeded'
  | 'network_error';

/**
 * Queue error interface
 */
export interface QueueError extends Error {
  type: QueueErrorType;
  jobId?: string;
  backend: QueueBackendType;
  retryable: boolean;
  retryAfter?: number;
}

// ============================================================================
// QUEUE UTILITY TYPES
// ============================================================================

/**
 * Queue job builder interface
 */
export interface QueueJobBuilder {
  /**
   * Build a job ID for a specific job type and identifier
   */
  buildJobId(jobType: JobType, identifier: string): string;

  /**
   * Build a job with proper configuration
   */
  buildJob(
    jobType: JobType,
    payload: JobPayload,
    options?: Partial<QueueJob>
  ): QueueJob;

  /**
   * Parse a job ID to extract components
   */
  parseJobId(jobId: string): {
    jobType: JobType;
    identifier: string;
  } | null;
}

/**
 * Queue monitoring event
 */
export interface QueueEvent {
  timestamp: string;
  jobId: string;
  jobType: JobType;
  status: QueueJobStatus['status'];
  backend: QueueBackendType;
  processingTime?: number;
  error?: string;
}

/**
 * Queue performance metrics
 */
export interface QueueMetrics {
  totalJobs: number;
  successfulJobs: number;
  failedJobs: number;
  averageProcessingTime: number;
  jobsPerMinute: number;
  errorRate: number;
  uptime: number;
} 

export interface MemoryBackendConfig {
  cleanupInterval?: number;
  maxJobs?: number;
  defaultTimeout?: number; // Add this if used in code/tests
}

export interface QStashBackendConfig {
  token: string;
  currentSigningKey?: string;
  nextSigningKey?: string;
  baseUrl?: string;
  timeout?: number;
} 