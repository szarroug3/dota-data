import { NextRequest } from 'next/server';

import { POST } from '@/app/api/matches/[id]/parse/route';

import { RequestQueue } from '@/lib/request-queue';

// Mock the RequestQueue
jest.mock('@/lib/request-queue', () => ({
  RequestQueue: jest.fn().mockImplementation(() => ({
    enqueue: jest.fn(),
    getJobStatus: jest.fn()
  }))
}));

const mockRequestQueue = RequestQueue as jest.MockedClass<typeof RequestQueue>;

// Mock fetch for internal API calls
global.fetch = jest.fn();

describe('/api/matches/[id]/parse', () => {
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.USE_MOCK_API = 'true';
    process.env.USE_QSTASH = 'false';
    process.env.QSTASH_TOKEN = 'test-token';
    process.env.QSTASH_CURRENT_SIGNING_KEY = 'test-key';
    process.env.QSTASH_NEXT_SIGNING_KEY = 'test-next-key';
  });

  describe('POST /api/matches/[id]/parse', () => {
    it('should return 400 for invalid match ID', async () => {
      const request = new NextRequest('http://localhost:3000/api/matches/invalid/parse');
      const params = { id: 'invalid' };

      const response = await POST(request, { params });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({
        error: 'Invalid match ID',
        status: 400,
        details: 'Match ID must be a valid number'
      });
    });

    it('should return 400 for empty match ID', async () => {
      const request = new NextRequest('http://localhost:3000/api/matches//parse');
      const params = { id: '' };

      const response = await POST(request, { params });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({
        error: 'Invalid match ID',
        status: 400,
        details: 'Match ID must be a valid number'
      });
    });

    it('should successfully parse match in mock mode', async () => {
      const matchId = '8054301932';
      const request = new NextRequest(`http://localhost:3000/api/matches/${matchId}/parse`);
      const params = { id: matchId };

      // Mock successful match data response
      const mockMatchData = {
        data: {
          matchId: '8054301932',
          startTime: '2024-01-01T00:00:00.000Z',
          duration: 2150,
          radiantWin: true,
          gameMode: 'All Pick',
          statistics: {
            totalKills: 45,
            radiantScore: 28,
            direScore: 17
          }
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockMatchData)
      } as any);

      const response = await POST(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toMatchObject({
        jobId: expect.stringMatching(/^match-parse-8054301932-\d+$/),
        status: 'completed',
        matchId: 8054301932,
        parsed: true,
        mockMode: true,
        data: mockMatchData.data,
        timestamp: expect.any(String),
        processingTime: 0
      });
    });

    it('should handle match data fetch failure in mock mode', async () => {
      const matchId = '8054301932';
      const request = new NextRequest(`http://localhost:3000/api/matches/${matchId}/parse`);
      const params = { id: matchId };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404
      } as any);

      const response = await POST(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toMatchObject({
        jobId: expect.stringMatching(/^match-parse-8054301932-\d+$/),
        status: 'failed',
        matchId: 8054301932,
        error: 'Failed to fetch parsed match data',
        mockMode: true,
        timestamp: expect.any(String)
      });
    });

    it('should handle fetch error in mock mode', async () => {
      const matchId = '8054301932';
      const request = new NextRequest(`http://localhost:3000/api/matches/${matchId}/parse`);
      const params = { id: matchId };

      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const response = await POST(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toMatchObject({
        jobId: expect.stringMatching(/^match-parse-8054301932-\d+$/),
        status: 'failed',
        matchId: 8054301932,
        error: 'Network error',
        mockMode: true,
        timestamp: expect.any(String)
      });
    });

    it('should use custom timeout parameter', async () => {
      const matchId = '8054301932';
      const request = new NextRequest(`http://localhost:3000/api/matches/${matchId}/parse?timeout=30000`);
      const params = { id: matchId };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ data: {} })
      } as any);

      const response = await POST(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toMatchObject({
        jobId: expect.stringMatching(/^match-parse-8054301932-\d+$/),
        status: 'completed',
        matchId: 8054301932,
        parsed: true,
        mockMode: true
      });
    });

    it('should use custom priority parameter', async () => {
      const matchId = '8054301932';
      const request = new NextRequest(`http://localhost:3000/api/matches/${matchId}/parse?priority=high`);
      const params = { id: matchId };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ data: {} })
      } as any);

      const response = await POST(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toMatchObject({
        jobId: expect.stringMatching(/^match-parse-8054301932-\d+$/),
        status: 'completed',
        matchId: 8054301932,
        parsed: true,
        mockMode: true
      });
    });

    it('should handle real mode processing with successful completion', async () => {
      process.env.USE_MOCK_API = 'false';
      const matchId = '8054301932';
      const request = new NextRequest(`http://localhost:3000/api/matches/${matchId}/parse`);
      const params = { id: matchId };

      const mockQueue = Object.create(RequestQueue.prototype) as RequestQueue;
      mockQueue.enqueue = jest.fn().mockResolvedValue({ jobId: 'test-job-id', status: 'queued' });
      mockQueue.getJobStatus = jest.fn().mockResolvedValue({ jobId: 'test-job-id', status: 'completed', result: { success: true } });
      mockQueue.cancelJob = jest.fn().mockResolvedValue(true);
      mockQueue.getStats = jest.fn().mockResolvedValue({ totalJobs: 1, queued: 0, processing: 0, completed: 1, failed: 0, cancelled: 0, averageProcessingTime: 1000, backend: 'memory', uptime: 3600 });
      mockQueue.isHealthy = jest.fn().mockResolvedValue(true);
      mockQueue.getBackendType = jest.fn().mockReturnValue('memory');
      mockQueue.clear = jest.fn().mockResolvedValue(undefined);
      (mockRequestQueue as jest.MockedClass<typeof RequestQueue>).mockImplementation(() => mockQueue);

      // Mock global.fetch for the internal match data fetch
      const originalFetch = global.fetch;
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ data: { matchId: matchId } })
      }) as any;

      const response = await POST(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toMatchObject({
        jobId: expect.stringMatching(/^match-parse-8054301932-\d+$/),
        status: 'completed',
        matchId: 8054301932,
        parsed: true
      });

      // Restore original fetch
      global.fetch = originalFetch;
    });

    it('should handle real mode processing with failure', async () => {
      process.env.USE_MOCK_API = 'false';
      const matchId = '8054301932';
      const request = new NextRequest(`http://localhost:3000/api/matches/${matchId}/parse`);
      const params = { id: matchId };

      const mockQueue = Object.create(RequestQueue.prototype) as RequestQueue;
      mockQueue.enqueue = jest.fn().mockResolvedValue({ jobId: 'test-job-id', status: 'queued' });
      mockQueue.getJobStatus = jest.fn().mockResolvedValue({ jobId: 'test-job-id', status: 'failed', error: 'Processing failed' });
      mockQueue.cancelJob = jest.fn().mockResolvedValue(true);
      mockQueue.getStats = jest.fn().mockResolvedValue({ totalJobs: 1, queued: 0, processing: 0, completed: 0, failed: 1, cancelled: 0, averageProcessingTime: 1000, backend: 'memory', uptime: 3600 });
      mockQueue.isHealthy = jest.fn().mockResolvedValue(true);
      mockQueue.getBackendType = jest.fn().mockReturnValue('memory');
      mockQueue.clear = jest.fn().mockResolvedValue(undefined);
      (mockRequestQueue as jest.MockedClass<typeof RequestQueue>).mockImplementation(() => mockQueue);

      const response = await POST(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toMatchObject({
        jobId: expect.stringMatching(/^match-parse-8054301932-\d+$/),
        status: 'failed',
        matchId: 8054301932,
        error: 'Match parsing failed'
      });
    });

    it('should handle queue enqueue failure', async () => {
      process.env.USE_MOCK_API = 'false';
      const matchId = '8054301932';
      const request = new NextRequest(`http://localhost:3000/api/matches/${matchId}/parse`);
      const params = { id: matchId };

      const mockQueue = Object.create(RequestQueue.prototype) as RequestQueue;
      mockQueue.enqueue = jest.fn().mockRejectedValue(new Error('Queue error'));
      mockQueue.getJobStatus = jest.fn();
      mockQueue.cancelJob = jest.fn().mockResolvedValue(true);
      mockQueue.getStats = jest.fn().mockResolvedValue({ totalJobs: 0, queued: 0, processing: 0, completed: 0, failed: 0, cancelled: 0, averageProcessingTime: 0, backend: 'memory', uptime: 3600 });
      mockQueue.isHealthy = jest.fn().mockResolvedValue(true);
      mockQueue.getBackendType = jest.fn().mockReturnValue('memory');
      mockQueue.clear = jest.fn().mockResolvedValue(undefined);
      (mockRequestQueue as jest.MockedClass<typeof RequestQueue>).mockImplementation(() => mockQueue);

      const response = await POST(request, { params });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        error: 'Failed to enqueue match parsing job',
        status: 500,
        details: 'Queue error'
      });
    });

    it('should handle job status check failure', async () => {
      process.env.USE_MOCK_API = 'false';
      const matchId = '8054301932';
      const request = new NextRequest(`http://localhost:3000/api/matches/${matchId}/parse`);
      const params = { id: matchId };

      const mockQueue = Object.create(RequestQueue.prototype) as RequestQueue;
      mockQueue.enqueue = jest.fn().mockResolvedValue({ jobId: 'test-job-id', status: 'queued' });
      mockQueue.getJobStatus = jest.fn().mockRejectedValue(new Error('Status check failed'));
      (mockRequestQueue as jest.MockedClass<typeof RequestQueue>).mockImplementation(() => mockQueue);

      const response = await POST(request, { params });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        error: 'Failed to enqueue match parsing job',
        status: 500,
        details: 'Status check failed'
      });
    });
  });
}); 