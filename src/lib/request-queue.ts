/**
 * Main queueing service for background job processing
 *
 * Provides QStash-based queueing with memory fallback for background jobs.
 * Handles job enqueueing, status tracking, and automatic retries.
 */

import { QStashBackend } from '@/lib/queue-backends/qstash';
import type {
  QueueBackendType,
  QueueEnqueueResult,
  QueueError,
  QueueErrorType,
  QueueJob,
  QueueJobStatus,
  QueueService,
  QueueServiceConfig,
  QueueStats
} from '@/types/queue';

import { MemoryBackend } from './queue-backends/memory';

/**
 * Main queueing service implementation
 */
export class RequestQueue implements QueueService {
  private qstashBackend?: QStashBackend;
  private memoryBackend: MemoryBackend;
  private config: QueueServiceConfig;
  private currentBackend: QueueBackendType = 'memory';

  constructor(config: QueueServiceConfig) {
    this.config = config;
    
    // Initialize QStash backend if enabled
    if (config.useQStash && config.qstashToken) {
      this.qstashBackend = new QStashBackend({
        token: config.qstashToken,
        currentSigningKey: config.qstashCurrentSigningKey,
        nextSigningKey: config.qstashNextSigningKey
      });
      this.currentBackend = 'qstash';
    }

    // Always initialize memory backend for fallback
    this.memoryBackend = new MemoryBackend({
      defaultTimeout: config.defaultTimeout,
      maxRetries: config.maxRetries,
      baseDelay: config.baseDelay
    });
  }

  /**
   * Enqueue a job for processing
   */
  async enqueue(jobId: string, job: QueueJob): Promise<QueueEnqueueResult> {
    try {
      // Try QStash first if available
      if (this.currentBackend === 'qstash' && this.qstashBackend) {
        try {
          return await this.qstashBackend.enqueue(jobId, job);
        } catch (error) {
          // If QStash fails and fallback is enabled, try memory
          if (
            this.config.fallbackToMemory &&
            error instanceof Error && this.isQStashError(error)
          ) {
            console.warn(`QStash queueing failed, falling back to memory: ${error instanceof Error ? error.message : 'Unknown error'}`);
            const result = await this.memoryBackend.enqueue(jobId, job);
            return { ...result, backend: 'memory' as QueueBackendType };
          }
          throw error;
        }
      }

      // Use memory backend
      return await this.memoryBackend.enqueue(jobId, job);
    } catch (error) {
      throw this.createQueueError(error instanceof Error ? error : new Error('Unknown error'), jobId);
    }
  }

  /**
   * Get job status
   */
  async getJobStatus(jobId: string): Promise<QueueJobStatus> {
    try {
      return await this.executeWithFallback(
        () => this.qstashBackend?.getJobStatus(jobId),
        () => this.memoryBackend.getJobStatus(jobId)
      );
    } catch (error) {
      throw this.createQueueError(error instanceof Error ? error : new Error('Unknown error'), jobId);
    }
  }

  /**
   * Cancel a job
   */
  async cancelJob(jobId?: string): Promise<boolean> {
    try {
      return await this.executeWithFallback(
        () => this.qstashBackend?.cancelJob(),
        () => this.memoryBackend.cancelJob(jobId)
      );
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        return false;
      }
      throw (error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  /**
   * Execute operation with QStash fallback to memory
   */
  private async executeWithFallback<T>(
    qstashOperation: () => Promise<T> | undefined,
    memoryOperation: () => Promise<T>
  ): Promise<T> {
    // Try QStash first if available
    if (this.currentBackend === 'qstash' && this.qstashBackend) {
      try {
        const result = await qstashOperation();
        if (result !== undefined) {
          return result;
        }
      } catch (error) {
        // If QStash fails and fallback is enabled, try memory
        if (this.config.fallbackToMemory && error instanceof Error && this.isQStashError(error)) {
          return await memoryOperation();
        }
        throw error;
      }
    }

    // Use memory backend
    return await memoryOperation();
  }

  /**
   * Get queue statistics
   */
  async getStats(): Promise<QueueStats> {
    try {
      return await this.executeWithFallback(
        () => this.qstashBackend?.getStats(),
        () => this.memoryBackend.getStats()
      );
    } catch (error) {
      throw this.createQueueError(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  /**
   * Check if the service is healthy
   */
  async isHealthy(): Promise<boolean> {
    try {
      return await this.executeWithFallback(
        () => this.qstashBackend?.isHealthy(),
        () => this.memoryBackend.isHealthy()
      );
    } catch {
      return false;
    }
  }

  /**
   * Get the current backend type
   */
  getBackendType(): QueueBackendType {
    return this.currentBackend;
  }

  /**
   * Clear all jobs (memory backend only)
   */
  async clear(): Promise<void> {
    try {
      await this.memoryBackend.clear();
    } catch (error) {
      throw this.createQueueError(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  /**
   * Check if error is a QStash-specific error
   */
  private isQStashError(error: Error): boolean {
    const errorMessage = error.message.toLowerCase();
    return (
      errorMessage.includes('qstash') ||
      errorMessage.includes('quota') ||
      errorMessage.includes('rate limit') ||
      errorMessage.includes('connection failed')
    );
  }

  /**
   * Create a standardized queue error
   */
  private createQueueError(error: Error, jobId?: string): QueueError {
    const errorMessage = error.message;
    
    let type: QueueErrorType = 'service_unavailable';
    let retryable = false;
    let retryAfter: number | undefined;

    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      
      if (message.includes('timeout')) {
        type = 'timeout';
        retryable = true;
      } else if (message.includes('connection')) {
        type = 'connection_failed';
        retryable = true;
      } else if (message.includes('quota') || message.includes('rate limit')) {
        type = 'quota_exceeded';
        retryable = true;
        retryAfter = 60; // 1 minute
      } else if (message.includes('not found')) {
        type = 'job_not_found';
        retryable = false;
      } else if (message.includes('already exists')) {
        type = 'job_already_exists';
        retryable = false;
      } else if (message.includes('invalid')) {
        type = 'invalid_payload';
        retryable = false;
      } else if (message.includes('unavailable')) {
        type = 'service_unavailable';
        retryable = true;
      }
    }

    const queueError = new Error(errorMessage) as QueueError;
    queueError.type = type;
    queueError.jobId = jobId;
    queueError.backend = this.currentBackend;
    queueError.retryable = retryable;
    queueError.retryAfter = retryAfter;

    return queueError;
  }

  /**
   * Disconnect from queue backends
   */
  async disconnect(): Promise<void> {
    try {
      // QStash backend doesn't need explicit disconnection
      if (this.qstashBackend) {
        console.log('[RequestQueue] QStash backend disconnected');
      }
      
      // Memory backend cleanup
      await this.memoryBackend.clear();
      console.log('[RequestQueue] Request queue disconnected');
    } catch (error) {
      console.error('[RequestQueue] Error during disconnect:', error);
    }
  }
} 