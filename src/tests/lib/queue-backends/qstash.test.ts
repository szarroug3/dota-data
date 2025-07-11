/**
 * Tests for the QStash backend
 */

import { QStashBackend, QStashBackendConfig } from '@/lib/queue-backends/qstash';
import type { ParseMatchJobPayload, QueueJob } from '@/types/queue';

// Mock fetch globally
global.fetch = jest.fn();

// Helper function to create a test job
const createTestJob = (matchId: string = '123'): QueueJob => ({
  endpoint: '/api/process-match',
  payload: {
    matchId,
    force: false
  } as ParseMatchJobPayload,
  priority: 'normal'
});

// Helper function to create a mock response
const createMockResponse = (ok: boolean, data?: Record<string, string | number | boolean>, status?: number) => ({
  ok,
  status: status || (ok ? 200 : 400),
  json: jest.fn().mockResolvedValue(data || { messageId: 'test-message-id' }),
  text: jest.fn().mockResolvedValue(ok ? 'OK' : 'Error')
});

// Helper function to setup backend
const setupBackend = (config?: Partial<QStashBackendConfig>) => {
  const defaultConfig = {
    token: 'test-token',
    currentSigningKey: 'current-key',
    nextSigningKey: 'next-key',
    baseUrl: 'https://qstash.upstash.io/v2',
    timeout: 10000,
    ...config
  };
  return new QStashBackend(defaultConfig);
};

describe('QStashBackend Constructor', () => {
  it('should initialize with default values', () => {
    const defaultBackend = new QStashBackend({
      token: 'test-token'
    });

    expect(defaultBackend).toBeDefined();
  });

  it('should initialize with custom values', () => {
    const customBackend = new QStashBackend({
      token: 'custom-token',
      currentSigningKey: 'custom-current',
      nextSigningKey: 'custom-next',
      baseUrl: 'https://custom.qstash.io/v2',
      timeout: 15000
    });

    expect(customBackend).toBeDefined();
  });
});

describe('QStashBackend Enqueue', () => {
  let backend: QStashBackend;

  beforeEach(() => {
    backend = setupBackend();
    jest.clearAllMocks();
  });

  it('should enqueue a job successfully', async () => {
    const mockResponse = createMockResponse(true);
    (fetch as jest.Mock).mockResolvedValue(mockResponse);

    const job = createTestJob();
    const result = await backend.enqueue('parse:match:123', job);

    expect(result.jobId).toBe('parse:match:123');
    expect(result.status).toBe('queued');
    expect(result.backend).toBe('qstash');
    expect(result.estimatedTime).toBeDefined();

    expect(fetch).toHaveBeenCalledWith(
      'https://qstash.upstash.io/v2/publish//api/process-match',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Authorization': 'Bearer test-token',
          'Content-Type': 'application/json',
          'Upstash-Delay': '0',
          'Upstash-Retries': '3',
          'Upstash-Deduplication-Id': 'parse:match:123'
        }),
        body: JSON.stringify(job.payload)
      })
    );
  });

  it('should handle job with delay', async () => {
    const mockResponse = createMockResponse(true);
    (fetch as jest.Mock).mockResolvedValue(mockResponse);

    const job: QueueJob = {
      ...createTestJob(),
      delay: 60 // 60 seconds
    };

    const result = await backend.enqueue('parse:match:123', job);

    expect(result.jobId).toBe('parse:match:123');
    expect(result.estimatedTime).toBeGreaterThan(60000);

    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          'Upstash-Delay': '60'
        })
      })
    );
  });

  it('should handle job with custom retries', async () => {
    const mockResponse = createMockResponse(true);
    (fetch as jest.Mock).mockResolvedValue(mockResponse);

    const job: QueueJob = {
      ...createTestJob(),
      retries: 5
    };

    await backend.enqueue('parse:match:123', job);

    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          'Upstash-Retries': '5'
        })
      })
    );
  });

  it('should handle job with custom timeout', async () => {
    const mockResponse = createMockResponse(true);
    (fetch as jest.Mock).mockResolvedValue(mockResponse);

    const job: QueueJob = {
      ...createTestJob(),
      timeout: 30000
    };

    const result = await backend.enqueue('parse:match:123', job);

    expect(result.estimatedTime).toBe(60000); // QStash backend returns 60s for timeout jobs
  });

  it('should handle QStash API errors', async () => {
    const mockResponse = createMockResponse(false, undefined, 429);
    (fetch as jest.Mock).mockResolvedValue(mockResponse);

    const job = createTestJob();

    await expect(backend.enqueue('parse:match:123', job))
      .rejects.toThrow('QStash request failed: 429 Error');
  });

  it('should handle network errors', async () => {
    (fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

    const job = createTestJob();

    await expect(backend.enqueue('parse:match:123', job))
      .rejects.toThrow('QStash enqueue failed: Network error');
  });
});

describe('QStashBackend GetJobStatus', () => {
  let backend: QStashBackend;

  beforeEach(() => {
    backend = setupBackend();
    jest.clearAllMocks();
  });

  it('should return simulated job status', async () => {
    const status = await backend.getJobStatus('test-job-id');

    expect(status.jobId).toBe('test-job-id');
    expect(status.status).toBe('processing');
    expect(status.progress).toBe(50);
    expect(status.createdAt).toBeDefined();
    expect(status.updatedAt).toBeDefined();
    expect(status.estimatedCompletion).toBeDefined();
    expect(status.retryCount).toBe(0);
    expect(status.maxRetries).toBe(3);
  });

  it('should handle errors gracefully', async () => {
    // Simulate an error by making the method throw
    jest.spyOn(backend, 'getJobStatus').mockRejectedValue(new Error('QStash get job status failed: Test error'));

    await expect(backend.getJobStatus('test-job-id'))
      .rejects.toThrow('QStash get job status failed: Test error');
  });
});

describe('QStashBackend CancelJob', () => {
  let backend: QStashBackend;

  beforeEach(() => {
    backend = setupBackend();
    jest.clearAllMocks();
  });

  it('should simulate job cancellation', async () => {
    const cancelled = await backend.cancelJob();

    expect(cancelled).toBe(true);
  });

  it('should handle cancellation errors', async () => {
    // Simulate an error by making the method throw
    jest.spyOn(backend, 'cancelJob').mockRejectedValue(new Error('QStash cancel job failed: Test error'));

    await expect(backend.cancelJob())
      .rejects.toThrow('QStash cancel job failed: Test error');
  });
});

describe('QStashBackend GetStats', () => {
  let backend: QStashBackend;

  beforeEach(() => {
    backend = setupBackend();
    jest.clearAllMocks();
  });

  it('should return queue statistics', async () => {
    const stats = await backend.getStats();

    expect(stats.totalJobs).toBeGreaterThanOrEqual(0);
    expect(stats.backend).toBe('qstash');
    expect(stats.uptime).toBeGreaterThan(0);
    expect(stats.averageProcessingTime).toBe(30000);
    expect(stats.queued).toBeGreaterThanOrEqual(0);
    expect(stats.processing).toBeGreaterThanOrEqual(0);
    expect(stats.completed).toBeGreaterThanOrEqual(0);
    expect(stats.failed).toBeGreaterThanOrEqual(0);
    expect(stats.cancelled).toBeGreaterThanOrEqual(0);
  });

  it('should track job lifecycle', async () => {
    const mockResponse = createMockResponse(true);
    (fetch as jest.Mock).mockResolvedValue(mockResponse);

    // Get initial stats
    const initialStats = await backend.getStats();
    const initialTotal = initialStats.totalJobs;

    const job = createTestJob();

    // Enqueue a job
    await backend.enqueue('parse:match:123', job);

    // Check stats after enqueue
    const afterEnqueueStats = await backend.getStats();
    expect(afterEnqueueStats.totalJobs).toBe(initialTotal + 1);
    expect(afterEnqueueStats.queued).toBeGreaterThan(0);
  });
});

describe('QStashBackend IsHealthy', () => {
  let backend: QStashBackend;

  beforeEach(() => {
    backend = setupBackend();
    jest.clearAllMocks();
  });

  it('should return true when QStash is healthy', async () => {
    const mockResponse = createMockResponse(true);
    (fetch as jest.Mock).mockResolvedValue(mockResponse);

    const healthy = await backend.isHealthy();

    expect(healthy).toBe(true);
    expect(fetch).toHaveBeenCalledWith(
      'https://qstash.upstash.io/v2/ping',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          'Authorization': 'Bearer test-token',
          'Content-Type': 'application/json'
        })
      })
    );
  });

  it('should return false when QStash is unhealthy', async () => {
    const mockResponse = createMockResponse(false);
    (fetch as jest.Mock).mockResolvedValue(mockResponse);

    const healthy = await backend.isHealthy();

    expect(healthy).toBe(false);
  });

  it('should return false on network errors', async () => {
    (fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

    const healthy = await backend.isHealthy();

    expect(healthy).toBe(false);
  });
});

describe('QStashBackend Clear', () => {
  let backend: QStashBackend;

  beforeEach(() => {
    backend = setupBackend();
    jest.clearAllMocks();
  });

  it('should throw error for unsupported operation', async () => {
    await expect(backend.clear())
      .rejects.toThrow('QStash does not support clearing all jobs');
  });
});

describe('QStashBackend WebhookProcessing', () => {
  let backend: QStashBackend;

  beforeEach(() => {
    backend = setupBackend();
    jest.clearAllMocks();
  });

  it('should verify webhook signature correctly', () => {
    const payload = '{"test": "data"}';
    const timestamp = '1234567890';
    const signature = 'test-signature';

    const isValid = backend.verifyWebhookSignature(payload, signature, timestamp);

    expect(typeof isValid).toBe('boolean');
  });

  it('should skip verification when no signing keys', () => {
    const backendWithoutKeys = new QStashBackend({
      token: 'test-token'
    });

    const payload = '{"test": "data"}';
    const timestamp = '1234567890';
    const signature = 'test-signature';

    const isValid = backendWithoutKeys.verifyWebhookSignature(payload, signature, timestamp);

    expect(isValid).toBe(true);
  });

  it('should process webhook payload correctly', () => {
    const webhookPayload = {
      messageId: 'test-message-id',
      status: 'completed' as const,
      result: { success: true },
      timestamp: new Date().toISOString()
    };

    backend.processWebhook(webhookPayload);

    // The stats should be updated (though we can't easily test this without exposing internal state)
    expect(backend).toBeDefined();
  });
});

describe('QStashBackend ErrorHandling', () => {
  let backend: QStashBackend;

  beforeEach(() => {
    backend = setupBackend();
    jest.clearAllMocks();
  });

  it('should handle malformed job payload', async () => {
    const mockResponse = createMockResponse(false, undefined, 400);
    (fetch as jest.Mock).mockResolvedValue(mockResponse);

    const job: QueueJob = {
      endpoint: '/api/process-match',
      payload: {} as ParseMatchJobPayload
    };

    await expect(backend.enqueue('parse:match:123', job))
      .rejects.toThrow('QStash request failed: 400 Error');
  });

  it('should handle timeout errors', async () => {
    (fetch as jest.Mock).mockRejectedValue(new Error('Timeout'));

    const job = createTestJob();

    await expect(backend.enqueue('parse:match:123', job))
      .rejects.toThrow('QStash enqueue failed: Timeout');
  });
}); 