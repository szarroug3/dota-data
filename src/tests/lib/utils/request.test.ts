import { CacheService } from '@/lib/cache-service';
import { request, requestWithRetry } from '@/lib/utils/request';

// Mock dependencies
jest.mock('@/lib/cache-service');
jest.mock('@/lib/config/environment', () => ({
  getEnv: {
    USE_MOCK_API: jest.fn(() => false),
    USE_MOCK_DOTABUFF: jest.fn(() => false),
    USE_MOCK_OPENDOTA: jest.fn(() => false),
    USE_MOCK_D2PT: jest.fn(() => false),
    WRITE_REAL_DATA_TO_MOCK: jest.fn(() => false),
  },
}));

const mockCacheService = CacheService as jest.MockedClass<typeof CacheService>;

describe('request utility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCacheService.prototype.get.mockResolvedValue(null);
    mockCacheService.prototype.set.mockResolvedValue();
  });

  describe('request function', () => {
    it('should return cached data when available', async () => {
      const cachedData = { id: '123', name: 'Test' };
      mockCacheService.prototype.get.mockResolvedValue(cachedData);

      const requestFn = jest.fn();
      const processingFn = jest.fn();
      const result = await request('dotabuff', requestFn, processingFn, '/mock/file.html', false, 3600, 'test-key');

      expect(result).toEqual(cachedData);
      expect(requestFn).not.toHaveBeenCalled();
      expect(processingFn).not.toHaveBeenCalled();
    });

    it('should fetch from API when cache is empty and force is false', async () => {
      const apiData = '<html>test</html>';
      const processedData = { id: '123', name: 'Test' };
      const requestFn = jest.fn().mockResolvedValue(apiData);
      const processingFn = jest.fn().mockReturnValue(processedData);

      const result = await request('dotabuff', requestFn, processingFn, '/mock/file.html', false, 3600, 'test-key');

      expect(result).toEqual(processedData);
      expect(requestFn).toHaveBeenCalled();
      expect(processingFn).toHaveBeenCalledWith(apiData);
      expect(mockCacheService.prototype.set).toHaveBeenCalledWith('test-key', processedData, 3600);
    });

    it('should bypass cache when force is true', async () => {
      const cachedData = { id: '123', name: 'Test' };
      mockCacheService.prototype.get.mockResolvedValue(cachedData);

      const apiData = '<html>test</html>';
      const processedData = { id: '456', name: 'New Test' };
      const requestFn = jest.fn().mockResolvedValue(apiData);
      const processingFn = jest.fn().mockReturnValue(processedData);

      const result = await request('dotabuff', requestFn, processingFn, '/mock/file.html', true, 3600, 'test-key');

      expect(result).toEqual(processedData);
      expect(requestFn).toHaveBeenCalled();
      expect(processingFn).toHaveBeenCalledWith(apiData);
    });

    it('should handle errors from request function', async () => {
      const requestFn = jest.fn().mockRejectedValue(new Error('API Error'));
      const processingFn = jest.fn();

      await expect(
        request('dotabuff', requestFn, processingFn, '/mock/file.html', false, 3600, 'test-key'),
      ).rejects.toThrow('API Error');
    });

    it('should handle errors from processing function', async () => {
      const apiData = '<html>test</html>';
      const requestFn = jest.fn().mockResolvedValue(apiData);
      const processingFn = jest.fn().mockImplementation(() => {
        throw new Error('Processing Error');
      });

      await expect(
        request('dotabuff', requestFn, processingFn, '/mock/file.html', false, 3600, 'test-key'),
      ).rejects.toThrow('Processing Error');
    });
  });

  describe('requestWithRetry function', () => {
    beforeEach(() => {
      global.fetch = jest.fn();
    });

    it('should return response on successful request', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: {
          get: jest.fn().mockReturnValue(null),
        },
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await requestWithRetry('GET', 'https://api.example.com/data');

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith('https://api.example.com/data', {
        method: 'GET',
        body: undefined,
        headers: undefined,
      });
    });

    it('should retry on failed requests', async () => {
      const failedResponse = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        headers: {
          get: jest.fn().mockReturnValue('1'),
        },
      };
      const successResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: {
          get: jest.fn().mockReturnValue(null),
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce(failedResponse).mockResolvedValueOnce(successResponse);

      const result = await requestWithRetry('GET', 'https://api.example.com/data');

      expect(result).toEqual(successResponse);
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should throw error after max retries', async () => {
      const failedResponse = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        headers: {
          get: jest.fn().mockReturnValue(null),
        },
      };

      (global.fetch as jest.Mock).mockResolvedValue(failedResponse);

      await expect(requestWithRetry('GET', 'https://api.example.com/data', undefined, undefined, 2)).rejects.toThrow(
        'Request failed: 500 Internal Server Error',
      );
    });

    it('should handle POST requests with body', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: {
          get: jest.fn().mockReturnValue(null),
        },
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const body = { key: 'value' };
      const headers = { 'Content-Type': 'application/json' };

      await requestWithRetry('POST', 'https://api.example.com/data', body, headers);

      expect(global.fetch).toHaveBeenCalledWith('https://api.example.com/data', {
        method: 'POST',
        body: JSON.stringify(body),
        headers,
      });
    });
  });
});
