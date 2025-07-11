/**
 * Memory-based queue backend for development and testing
 */

import { QueueBackend, QueueEnqueueResult, QueueJob, QueueJobStatus, QueueStats } from '@/types/queue';

export interface MemoryBackendConfig {
  cleanupInterval?: number;
  maxJobs?: number;
  defaultTimeout?: number;
  maxRetries?: number;
  baseDelay?: number;
}

interface MemoryJob extends QueueJob {
  jobId: string;
  status: QueueJobStatus['status'];
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  error?: string;
  result?: Record<string, string>; // Use a specific type for result
}

export class MemoryBackend implements QueueBackend {
  private jobs: Map<string, MemoryJob> = new Map();
  private config: MemoryBackendConfig;
  private cleanupInterval?: NodeJS.Timeout;
  private startTime: number;

  constructor(config: MemoryBackendConfig = {}) {
    this.config = {
      cleanupInterval: 10000, // 10 seconds for testing
      maxJobs: 1000,
      ...config
    };
    this.startTime = Date.now();
    
    // Only start cleanup interval if not in test environment
    if (process.env.NODE_ENV !== 'test') {
      this.startCleanupInterval();
    }
  }

  /**
   * Enqueue a job
   */
  async enqueue(jobId: string, job: QueueJob): Promise<QueueEnqueueResult> {
    // Validate job configuration
    if (!job.endpoint || job.endpoint.trim() === '') {
      throw new Error('Job endpoint is required');
    }

    if (!job.payload || Object.keys(job.payload).length === 0) {
      throw new Error('Job payload is required');
    }

    // Check if job already exists
    if (this.jobs.has(jobId)) {
      throw new Error(`Job ${jobId} already exists`);
    }

    // Check max jobs limit
    if (this.jobs.size >= (this.config.maxJobs || 1000)) {
      throw new Error('Queue is full');
    }

    const memoryJob: MemoryJob = {
      ...job,
      jobId,
      status: 'queued',
      createdAt: Date.now()
    };

    this.jobs.set(jobId, memoryJob);

    // Simulate immediate processing for testing
    setTimeout(() => {
      this.processJob(jobId);
    }, 100); // Very short delay for testing

    return {
      jobId,
      status: 'queued',
      estimatedTime: 30000, // 30 seconds estimated time
      backend: 'memory'
    };
  }

  /**
   * Get job status
   */
  async getJobStatus(jobId: string): Promise<QueueJobStatus> {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }
    
    // Calculate progress based on job state
    let progress: number | undefined;
    if (job.status === 'completed') {
      progress = 100;
    } else if (job.status === 'processing' && job.startedAt) {
      const elapsed = Date.now() - job.startedAt;
      progress = Math.min(Math.floor((elapsed / 1000) * 10), 90); // Rough estimate
    }

    const status: QueueJobStatus = {
      jobId,
      status: job.status,
      progress,
      error: job.error,
      createdAt: new Date(job.createdAt).toISOString(),
      updatedAt: new Date(job.completedAt || job.startedAt || job.createdAt).toISOString(),
      retryCount: 0,
      maxRetries: job.retries || 3
    };
    if (job.result !== undefined) {
      status.result = job.result;
    }
    return status;
  }

  /**
   * Cancel a job
   */
  async cancelJob(jobId?: string): Promise<boolean> {
    if (!jobId) {
      return false; // Cannot cancel without job ID
    }

    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    if (job.status === 'completed' || job.status === 'failed') {
      throw new Error(`Cannot cancel job in ${job.status} state`);
    }

    job.status = 'cancelled';
    this.jobs.set(jobId, job);
    return true;
  }

  /**
   * Get queue statistics
   */
  async getStats(): Promise<QueueStats> {
    const now = Date.now();
    const jobs = Array.from(this.jobs.values());
    
    const stats: QueueStats = {
      totalJobs: jobs.length,
      backend: 'memory',
      uptime: Math.max(1, now - this.startTime), // Ensure uptime is always positive
      averageProcessingTime: 30000,
      queued: jobs.filter(j => j.status === 'queued').length,
      processing: jobs.filter(j => j.status === 'processing').length,
      completed: jobs.filter(j => j.status === 'completed').length,
      failed: jobs.filter(j => j.status === 'failed').length,
      cancelled: jobs.filter(j => j.status === 'cancelled').length
    };

    return stats;
  }

  /**
   * Check if the backend is healthy
   */
  async isHealthy(): Promise<boolean> {
    return true; // Memory backend is always healthy
  }

  /**
   * Clear all jobs
   */
  async clear(): Promise<void> {
    this.jobs.clear();
  }

  /**
   * Cleanup old jobs
   */
  private cleanup(): void {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    for (const [jobId, job] of this.jobs.entries()) {
      if (now - job.createdAt > maxAge) {
        this.jobs.delete(jobId);
      }
    }
  }

  /**
   * Process a job (simulated)
   */
  private async processJob(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job) return;

    try {
      job.status = 'processing';
      job.startedAt = Date.now();
      this.jobs.set(jobId, job);

      // Simulate processing time (shorter for testing)
      await new Promise(resolve => setTimeout(resolve, 100));

      job.status = 'completed';
      job.completedAt = Date.now();
      job.result = { status: 'success' }; // Use string value for result
      this.jobs.set(jobId, job);
    } catch (error) {
      job.status = 'failed';
      job.error = error instanceof Error ? error.message : 'Job processing failed';
      this.jobs.set(jobId, job);
    }
  }

  /**
   * Start cleanup interval
   */
  private startCleanupInterval(): void {
    // Use a shorter interval for testing and faster cleanup
    const interval = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval || 10000); // Clean up every 10 seconds for testing
    
    // Store the interval ID for cleanup
    this.cleanupInterval = interval;
  }

  /**
   * Stop cleanup interval
   */
  private stopCleanupInterval(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = undefined;
    }
  }

  /**
   * Cleanup resources
   */
  async close(): Promise<void> {
    this.stopCleanupInterval();
    this.jobs.clear();
  }

  /**
   * Cleanup for testing - call this in test teardown
   */
  async cleanupForTesting(): Promise<void> {
    this.stopCleanupInterval();
    this.jobs.clear();
  }
} 