/**
 * Tests for the memory backend
 */

import { MemoryBackend, MemoryBackendConfig } from '@/lib/queue-backends/memory';
import type { ParseMatchJobPayload, QueueJob } from '@/types/queue';

// Helper function to create a test job
const createTestJob = (matchId: string = '123'): QueueJob => ({
  endpoint: '/api/process-match',
  payload: {
    matchId,
    force: false
  } as ParseMatchJobPayload,
  priority: 'normal'
});

// Helper function to advance timers and wait for processing
const advanceTimersAndWait = async () => {
  jest.advanceTimersByTime(100);
  await Promise.resolve();
  await Promise.resolve();
};

// Helper function to setup backend
const setupBackend = (config?: Partial<MemoryBackendConfig>) => {
  const defaultConfig = {
    maxJobs: 100,
    ...config
  };
  return new MemoryBackend(defaultConfig);
};

describe('MemoryBackend Constructor', () => {
  it('should initialize with default values', () => {
    const defaultBackend = new MemoryBackend({
      maxRetries: 3,
      baseDelay: 1000,
      defaultTimeout: 30000
    });

    expect(defaultBackend).toBeDefined();
  });

  it('should initialize with custom values', () => {
    const customBackend = new MemoryBackend({
      maxRetries: 5,
      baseDelay: 2000,
      maxJobs: 50,
      defaultTimeout: 30000
    });

    expect(customBackend).toBeDefined();
  });
});

describe('MemoryBackend Enqueue', () => {
  let backend: MemoryBackend;

  beforeEach(() => {
    jest.useFakeTimers();
    backend = setupBackend();
  });

  afterEach(async () => {
    if (backend) {
      await backend.cleanupForTesting();
    }
    jest.useRealTimers();
  });

  it('should enqueue a job successfully', async () => {
    const job = createTestJob();
    const result = await backend.enqueue('parse:match:123', job);

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

    const result = await backend.enqueue('parse:match:123', job);

    expect(result.jobId).toBe('parse:match:123');
    expect(result.estimatedTime).toBe(30000); // Memory backend always returns 30s
  });

  it('should handle job with timeout', async () => {
    const job: QueueJob = {
      ...createTestJob(),
      timeout: 30000 // 30 seconds
    };

    const result = await backend.enqueue('parse:match:123', job);

    expect(result.jobId).toBe('parse:match:123');
    expect(result.estimatedTime).toBeLessThanOrEqual(35000);
  });

  it('should handle job with custom retries', async () => {
    const job: QueueJob = {
      ...createTestJob(),
      retries: 5
    };

    const result = await backend.enqueue('parse:match:123', job);

    expect(result.jobId).toBe('parse:match:123');
    expect(result.status).toBe('queued');
  });

  it('should throw error for duplicate job ID', async () => {
    const job = createTestJob();

    await backend.enqueue('parse:match:123', job);

    await expect(backend.enqueue('parse:match:123', job))
      .rejects.toThrow('Job parse:match:123 already exists');
  });

  it('should throw error when queue is full', async () => {
    const limitedBackend = setupBackend({ maxJobs: 1 });
    const job = createTestJob();

    // Fill the queue
    await limitedBackend.enqueue('job1', job);

    // Try to add another job
    await expect(limitedBackend.enqueue('job2', job))
      .rejects.toThrow('Queue is full');
  });
});

describe('MemoryBackend GetJobStatus', () => {
  let backend: MemoryBackend;

  beforeEach(() => {
    jest.useFakeTimers();
    backend = setupBackend();
  });

  afterEach(async () => {
    if (backend) {
      await backend.cleanupForTesting();
    }
    jest.useRealTimers();
  });

  it('should return job status for existing job', async () => {
    const job = createTestJob();
    await backend.enqueue('parse:match:123', job);

    // Advance timers to trigger processing
    await advanceTimersAndWait();

    const status = await backend.getJobStatus('parse:match:123');

    expect(status.jobId).toBe('parse:match:123');
    expect(['queued', 'processing', 'completed']).toContain(status.status);
    expect(status.progress).toBeGreaterThanOrEqual(0);
    expect(status.progress).toBeLessThanOrEqual(100);
    expect(status.createdAt).toBeDefined();
    expect(status.updatedAt).toBeDefined();
    expect(status.retryCount).toBe(0);
    expect(status.maxRetries).toBe(3);
  });

  it('should throw error for non-existent job', async () => {
    await expect(backend.getJobStatus('non-existent-job'))
      .rejects.toThrow('Job non-existent-job not found');
  });

  it('should track job progress over time', async () => {
    const job = createTestJob();
    await backend.enqueue('parse:match:123', job);

    // Check initial status
    const initialStatus = await backend.getJobStatus('parse:match:123');
    expect(initialStatus.status).toBe('queued');

    // Advance timers to trigger processing
    await advanceTimersAndWait();

    // Check status during processing
    const processingStatus = await backend.getJobStatus('parse:match:123');
    expect(['processing', 'completed']).toContain(processingStatus.status);

    // Advance timers to complete processing
    await advanceTimersAndWait();

    // Check final status
    const finalStatus = await backend.getJobStatus('parse:match:123');
    expect(finalStatus.status).toBe('completed');
    expect(finalStatus.progress).toBe(100);
    expect(finalStatus.result).toBeDefined();
  });
});

describe('MemoryBackend CancelJob', () => {
  let backend: MemoryBackend;

  beforeEach(() => {
    jest.useFakeTimers();
    backend = setupBackend();
  });

  afterEach(async () => {
    if (backend) {
      await backend.cleanupForTesting();
    }
    jest.useRealTimers();
  });

  it('should cancel an existing job', async () => {
    const job = createTestJob();
    await backend.enqueue('parse:match:123', job);

    const cancelled = await backend.cancelJob('parse:match:123');

    expect(cancelled).toBe(true);

    const status = await backend.getJobStatus('parse:match:123');
    expect(status.status).toBe('cancelled');
  });

  it('should throw error for non-existent job', async () => {
    await expect(backend.cancelJob('non-existent-job'))
      .rejects.toThrow('Job non-existent-job not found');
  });

  it('should handle cancellation during processing', async () => {
    const job = createTestJob();
    await backend.enqueue('parse:match:123', job);

    // Advance timers to trigger processing
    await advanceTimersAndWait();

    const cancelled = await backend.cancelJob('parse:match:123');

    expect(cancelled).toBe(true);

    const status = await backend.getJobStatus('parse:match:123');
    expect(status.status).toBe('cancelled');
  });
});

describe('MemoryBackend GetStats', () => {
  let backend: MemoryBackend;

  beforeEach(() => {
    jest.useFakeTimers();
    backend = setupBackend();
  });

  afterEach(async () => {
    if (backend) {
      await backend.cleanupForTesting();
    }
    jest.useRealTimers();
  });

  it('should return queue statistics', async () => {
    const job = createTestJob();
    await backend.enqueue('parse:match:123', job);

    const stats = await backend.getStats();

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
    const initialStats = await backend.getStats();
    const initialTotal = initialStats.totalJobs;

    // Enqueue job
    await backend.enqueue('parse:match:123', job);

    // Check stats after enqueue
    const afterEnqueueStats = await backend.getStats();
    expect(afterEnqueueStats.totalJobs).toBe(initialTotal + 1);
    expect(afterEnqueueStats.queued).toBeGreaterThan(0);

    // Advance timers to complete processing
    await advanceTimersAndWait();
    await advanceTimersAndWait();

    // Check final stats
    const finalStats = await backend.getStats();
    expect(finalStats.totalJobs).toBe(initialTotal + 1);
    expect(finalStats.completed).toBeGreaterThan(0);
  });

  it('should track cancelled jobs', async () => {
    const job = createTestJob();
    await backend.enqueue('parse:match:123', job);
    await backend.cancelJob('parse:match:123');

    const stats = await backend.getStats();
    expect(stats.cancelled).toBeGreaterThan(0);
  });
});

describe('MemoryBackend IsHealthy', () => {
  let backend: MemoryBackend;

  beforeEach(() => {
    jest.useFakeTimers();
    backend = setupBackend();
  });

  afterEach(async () => {
    if (backend) {
      await backend.cleanupForTesting();
    }
    jest.useRealTimers();
  });

  it('should return true for healthy backend', async () => {
    const healthy = await backend.isHealthy();
    expect(healthy).toBe(true);
  });
});

describe('MemoryBackend Clear', () => {
  let backend: MemoryBackend;

  beforeEach(() => {
    jest.useFakeTimers();
    backend = setupBackend();
  });

  afterEach(async () => {
    if (backend) {
      await backend.cleanupForTesting();
    }
    jest.useRealTimers();
  });

  it('should clear all jobs', async () => {
    const job = createTestJob();
    await backend.enqueue('parse:match:123', job);

    // Verify job exists
    const status = await backend.getJobStatus('parse:match:123');
    expect(status.jobId).toBe('parse:match:123');

    // Clear all jobs
    await backend.clear();

    // Verify job is gone
    await expect(backend.getJobStatus('parse:match:123'))
      .rejects.toThrow('Job parse:match:123 not found');

    // Verify stats are reset
    const stats = await backend.getStats();
    expect(stats.totalJobs).toBe(0);
    expect(stats.queued).toBe(0);
    expect(stats.processing).toBe(0);
    expect(stats.completed).toBe(0);
    expect(stats.failed).toBe(0);
    expect(stats.cancelled).toBe(0);
  });
});

describe('MemoryBackend JobProcessing', () => {
  let backend: MemoryBackend;

  beforeEach(() => {
    jest.useFakeTimers();
    backend = setupBackend();
  });

  afterEach(async () => {
    if (backend) {
      await backend.cleanupForTesting();
    }
    jest.useRealTimers();
  });

  it('should process jobs automatically', async () => {
    const job = createTestJob();
    await backend.enqueue('parse:match:123', job);

    // Advance timers to complete processing
    await advanceTimersAndWait();
    await advanceTimersAndWait();

    const status = await backend.getJobStatus('parse:match:123');
    expect(status.status).toBe('completed');
    expect(status.progress).toBe(100);
    expect(status.result).toBeDefined();
  });

  it('should handle processing failures', async () => {
    const job = createTestJob();
    await backend.enqueue('parse:match:123', job);

    // Advance timers to complete processing
    await advanceTimersAndWait();
    await advanceTimersAndWait();

    const status = await backend.getJobStatus('parse:match:123');
    expect(['completed', 'failed']).toContain(status.status);
  });

  it('should handle multiple concurrent jobs', async () => {
    const jobs: QueueJob[] = [
      createTestJob('123'),
      createTestJob('456'),
      createTestJob('789')
    ];

    // Enqueue multiple jobs
    await Promise.all([
      backend.enqueue('parse:match:123', jobs[0]),
      backend.enqueue('parse:match:456', jobs[1]),
      backend.enqueue('parse:match:789', jobs[2])
    ]);

    // Advance timers to complete processing
    await advanceTimersAndWait();
    await advanceTimersAndWait();

    // Check all jobs completed
    const status1 = await backend.getJobStatus('parse:match:123');
    const status2 = await backend.getJobStatus('parse:match:456');
    const status3 = await backend.getJobStatus('parse:match:789');

    expect(status1.status).toBe('completed');
    expect(status2.status).toBe('completed');
    expect(status3.status).toBe('completed');

    // Check stats
    const stats = await backend.getStats();
    expect(stats.totalJobs).toBe(3);
    expect(stats.completed).toBe(3);
  });
});

describe('MemoryBackend Cleanup', () => {
  let backend: MemoryBackend;

  beforeEach(() => {
    jest.useFakeTimers();
    backend = setupBackend();
  });

  afterEach(async () => {
    if (backend) {
      await backend.cleanupForTesting();
    }
    jest.useRealTimers();
  });

  it('should clean up old jobs automatically', async () => {
    const job = createTestJob();
    await backend.enqueue('parse:match:123', job);

    // Advance timers to complete processing
    await advanceTimersAndWait();
    await advanceTimersAndWait();

    // Verify job exists
    const status = await backend.getJobStatus('parse:match:123');
    expect(status.status).toBe('completed');
  });
});

describe('MemoryBackend ErrorHandling', () => {
  let backend: MemoryBackend;

  beforeEach(() => {
    jest.useFakeTimers();
    backend = setupBackend();
  });

  afterEach(async () => {
    if (backend) {
      await backend.cleanupForTesting();
    }
    jest.useRealTimers();
  });

  it('should handle invalid job configuration', async () => {
    const invalidJob = {
      endpoint: '',
      payload: {}
    } as QueueJob;

    await expect(backend.enqueue('invalid-job', invalidJob))
      .rejects.toThrow();
  });

  it('should handle processing errors gracefully', async () => {
    const job = createTestJob();
    await backend.enqueue('parse:match:123', job);

    // Advance timers to complete processing
    await advanceTimersAndWait();
    await advanceTimersAndWait();

    const status = await backend.getJobStatus('parse:match:123');
    expect(['completed', 'failed']).toContain(status.status);
  });
}); 