/**
 * Queue-related type definitions
 * 
 * Contains interfaces and types for job queuing and processing.
 */

export interface QueueJob {
  endpoint: string;
  payload: Record<string, unknown>;
  priority?: 'low' | 'normal' | 'high';
  timeout?: number;
  retries?: number;
}

export interface QueueEnqueueResult {
  jobId: string;
  status: 'enqueued' | 'failed';
  backend: 'qstash' | 'memory';
  timestamp: string;
}

export interface QueueJobStatus {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'timeout';
  result?: unknown;
  error?: string;
  timestamp: string;
}

export interface RequestQueueConfig {
  useQStash?: boolean;
  qstashToken?: string;
  qstashCurrentSigningKey?: string;
  qstashNextSigningKey?: string;
  fallbackToMemory?: boolean;
  defaultTimeout?: number;
  maxRetries?: number;
  baseDelay?: number;
} 