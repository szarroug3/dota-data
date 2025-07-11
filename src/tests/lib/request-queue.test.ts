/**
 * Tests for the main queue service
 */

import { RequestQueue } from '@/lib/request-queue';
import type { ParseMatchJobPayload, QueueJob, QueueServiceConfig } from '@/types/queue';

// Helper function to create a test job
const createTestJob = (matchId: string = '123'): QueueJob => ({
  endpoint: '/api/process-match',
  payload: {
    matchId,
    force: false
  } as ParseMatchJobPayload,
  priority: 'normal'
});

// Helper function to setup queue
const setupQueue = (config?: Partial<QueueServiceConfig>) => {
  const defaultConfig = {
    useQStash: false,
    fallbackToMemory: true,
    maxRetries: 3,
    baseDelay: 1000,
    defaultTimeout: 30000,
    ...config
  };
  return new RequestQueue(defaultConfig);
};

describe('RequestQueue Constructor', () => {
  it('should initialize with memory backend when QStash is disabled', () => {
    const memoryQueue = setupQueue({ useQStash: false });

    expect(memoryQueue.getBackendType()).toBe('memory');
  });

  it('should initialize with QStash backend when QStash is enabled', () => {
    const qstashQueue = setupQueue({
      useQStash: true,
      qstashToken: 'test-token'
    });

    expect(qstashQueue.getBackendType()).toBe('qstash');
  });
});

describe('RequestQueue Enqueue', () => {
  let queue: RequestQueue;

  beforeEach(() => {
    queue = setupQueue();
  });

  it('should enqueue a job successfully', async () => {
    const job = createTestJob();
    const result = await queue.enqueue('parse:match:123', job);

    expect(result.jobId).toBe('parse:match:123');
    expect(result.status).toBe('queued');
    expect(result.backend).toBe('memory');
    expect(result.estimatedTime).toBeDefined();
  });

  it('should handle job with delay', async () => {
    const job: QueueJob = {
      ...createTestJob(),
      delay: 60 // 60 seconds
    };

    const result = await queue.enqueue('parse:match:123', job);

    expect(result.jobId).toBe('parse:match:123');
    expect(result.status).toBe('queued');
    expect(result.estimatedTime).toBe(30000); // Memory backend always returns 30s
  });

  it('should handle job with timeout', async () => {
    const job: QueueJob = {
      ...createTestJob(),
      timeout: 30000 // 30 seconds
    };

    const result = await queue.enqueue('parse:match:123', job);

    expect(result.jobId).toBe('parse:match:123');
    expect(result.status).toBe('queued');
    expect(result.estimatedTime).toBeLessThanOrEqual(35000);
  });

  it('should throw error for duplicate job ID', async () => {
    const job = createTestJob();

    await queue.enqueue('parse:match:123', job);

    await expect(queue.enqueue('parse:match:123', job))
      .rejects.toThrow('Job parse:match:123 already exists');
  });
});

describe('RequestQueue GetJobStatus', () => {
  let queue: RequestQueue;

  beforeEach(() => {
    queue = setupQueue();
  });

  it('should return job status for existing job', async () => {
    const job = createTestJob();
    await queue.enqueue('parse:match:123', job);

    // Wait a bit for processing to start
    await new Promise(resolve => setTimeout(resolve, 100));

    const status = await queue.getJobStatus('parse:match:123');

    expect(status.jobId).toBe('parse:match:123');
    expect(['queued', 'processing', 'completed']).toContain(status.status);
    expect(status.progress).toBeGreaterThanOrEqual(0);
    expect(status.progress).toBeLessThanOrEqual(100);
    expect(status.createdAt).toBeDefined();
    expect(status.updatedAt).toBeDefined();
    expect(status.retryCount).toBeDefined();
    expect(status.maxRetries).toBeDefined();
  });

  it('should throw error for non-existent job', async () => {
    await expect(queue.getJobStatus('non-existent-job'))
      .rejects.toThrow('Job non-existent-job not found');
  });
});

describe('RequestQueue CancelJob', () => {
  let queue: RequestQueue;

  beforeEach(() => {
    queue = setupQueue();
  });

  it('should cancel an existing job', async () => {
    const job = createTestJob();
    await queue.enqueue('parse:match:123', job);

    const cancelled = await queue.cancelJob('parse:match:123');

    expect(cancelled).toBe(true);

    const status = await queue.getJobStatus('parse:match:123');
    expect(status.status).toBe('cancelled');
  });

  it('should return false for non-existent job', async () => {
    const cancelled = await queue.cancelJob('non-existent-job');

    expect(cancelled).toBe(false);
  });
});

describe('RequestQueue GetStats', () => {
  let queue: RequestQueue;

  beforeEach(() => {
    queue = setupQueue();
  });

  it('should return queue statistics', async () => {
    const job = createTestJob();
    await queue.enqueue('parse:match:123', job);

    const stats = await queue.getStats();

    expect(stats.totalJobs).toBeGreaterThan(0);
    expect(stats.backend).toBe('memory');
    expect(stats.uptime).toBeGreaterThan(0);
    expect(stats.averageProcessingTime).toBeGreaterThan(0);
    expect(stats.queued).toBeGreaterThanOrEqual(0);
    expect(stats.processing).toBeGreaterThanOrEqual(0);
    expect(stats.completed).toBeGreaterThanOrEqual(0);
    expect(stats.failed).toBeGreaterThanOrEqual(0);
    expect(stats.cancelled).toBeGreaterThanOrEqual(0);
  });

  it('should track job lifecycle correctly', async () => {
    const job = createTestJob();

    // Initial stats
    const initialStats = await queue.getStats();
    const initialTotal = initialStats.totalJobs;

    // Enqueue job
    await queue.enqueue('parse:match:123', job);

    // Check stats after enqueue
    const afterEnqueueStats = await queue.getStats();
    expect(afterEnqueueStats.totalJobs).toBe(initialTotal + 1);

    // Memory backend doesn't auto-process jobs, so we just verify the job was enqueued
    const status = await queue.getJobStatus('parse:match:123');
    expect(status.status).toBe('queued');
  });
});

describe('RequestQueue IsHealthy', () => {
  let queue: RequestQueue;

  beforeEach(() => {
    queue = setupQueue();
  });

  it('should return true for healthy queue', async () => {
    const healthy = await queue.isHealthy();

    expect(healthy).toBe(true);
  });
});

describe('RequestQueue Clear', () => {
  let queue: RequestQueue;

  beforeEach(() => {
    queue = setupQueue();
  });

  it('should clear all jobs', async () => {
    const job = createTestJob();
    await queue.enqueue('parse:match:123', job);

    // Verify job exists
    const status = await queue.getJobStatus('parse:match:123');
    expect(status.jobId).toBe('parse:match:123');

    // Clear all jobs
    await queue.clear();

    // Verify job is gone
    await expect(queue.getJobStatus('parse:match:123'))
      .rejects.toThrow('Job parse:match:123 not found');

    // Verify stats are reset
    const stats = await queue.getStats();
    expect(stats.totalJobs).toBe(0);
    expect(stats.queued).toBe(0);
    expect(stats.processing).toBe(0);
    expect(stats.completed).toBe(0);
    expect(stats.failed).toBe(0);
    expect(stats.cancelled).toBe(0);
  });
});

describe('RequestQueue GetBackendType', () => {
  let queue: RequestQueue;

  beforeEach(() => {
    queue = setupQueue();
  });

  it('should return correct backend type', () => {
    expect(queue.getBackendType()).toBe('memory');
  });
});

describe('RequestQueue ErrorHandling', () => {
  let queue: RequestQueue;

  beforeEach(() => {
    queue = setupQueue();
  });

  it('should handle invalid job configuration', async () => {
    const invalidJob = {
      endpoint: '',
      payload: {}
    } as QueueJob;

    await expect(queue.enqueue('invalid-job', invalidJob))
      .rejects.toThrow();
  });

  it('should handle duplicate job ID', async () => {
    const job = createTestJob();

    // Enqueue first job
    await queue.enqueue('job1', job);

    // Try to add another job with same ID
    await expect(queue.enqueue('job1', job))
      .rejects.toThrow('Job job1 already exists');
  });
});

describe('RequestQueue FallbackBehavior', () => {
  it('should fallback to memory when QStash fails', async () => {
    const qstashQueue = setupQueue({
      useQStash: true,
      qstashToken: 'invalid-token',
      fallbackToMemory: true
    });

    const job = createTestJob();

    // This should fallback to memory
    const result = await qstashQueue.enqueue('parse:match:123', job);

    expect(result.jobId).toBe('parse:match:123');
    expect(result.status).toBe('queued');
    expect(result.backend).toBe('memory');
  });

  it('should not fallback when fallbackToMemory is false', async () => {
    const qstashQueue = setupQueue({
      useQStash: true,
      qstashToken: 'invalid-token',
      fallbackToMemory: false
    });

    const job = createTestJob();

    // This should throw an error
    await expect(qstashQueue.enqueue('parse:match:123', job))
      .rejects.toThrow();
  });
}); 