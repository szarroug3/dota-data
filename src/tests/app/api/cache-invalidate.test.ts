import { NextRequest } from 'next/server';

import { POST } from '@/app/api/cache/invalidate/route';

jest.mock('@/lib/cache-service', () => ({
  CacheService: jest.fn().mockImplementation(() => mockCacheService),
}));

const mockCacheService = {
  invalidatePattern: jest.fn(),
  exists: jest.fn(),
  delete: jest.fn(),
  getBackendType: jest.fn().mockReturnValue('memory'),
};

describe('/api/cache/invalidate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCacheService.getBackendType.mockReturnValue('memory');
  });

  it('should return 400 for missing invalidation criteria', async () => {
    const request = new NextRequest('http://localhost:3000/api/cache/invalidate', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    request.json = async () => ({});
    const response = await POST(request);
    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data).toEqual({
      error: 'Missing invalidation criteria',
      status: 400,
      details: 'Either pattern or key must be provided',
    });
  });

  it('should return 400 for both pattern and key provided', async () => {
    const request = new NextRequest('http://localhost:3000/api/cache/invalidate', {
      method: 'POST',
      body: JSON.stringify({ pattern: 'foo', key: 'bar' }),
    });
    request.json = async () => ({ pattern: 'foo', key: 'bar' });
    const response = await POST(request);
    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data).toEqual({
      error: 'Invalid invalidation criteria',
      status: 400,
      details: 'Cannot specify both pattern and key, choose one',
    });
  });

  it('should return 400 for invalid JSON body', async () => {
    const request = new NextRequest('http://localhost:3000/api/cache/invalidate', { method: 'POST' });
    request.json = async () => {
      throw new Error('Invalid JSON');
    };
    const response = await POST(request);
    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data).toEqual({
      error: 'Invalid request body',
      status: 400,
      details: 'Request body must be valid JSON',
    });
  });

  it('should invalidate by pattern (success)', async () => {
    mockCacheService.invalidatePattern.mockResolvedValueOnce(5);
    const request = new NextRequest('http://localhost:3000/api/cache/invalidate', {
      method: 'POST',
      body: JSON.stringify({ pattern: 'foo*' }),
    });
    request.json = async () => ({ pattern: 'foo*' });
    const response = await POST(request);
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.data).toEqual({ invalidated: 5, pattern: 'foo*' });
    expect(data.backend).toBe('memory');
    expect(data.details.operation).toBe('pattern-invalidation');
  });

  it('should handle pattern invalidation error', async () => {
    mockCacheService.invalidatePattern.mockRejectedValueOnce(new Error('Invalid pattern'));
    const request = new NextRequest('http://localhost:3000/api/cache/invalidate', {
      method: 'POST',
      body: JSON.stringify({ pattern: 'bad*' }),
    });
    request.json = async () => ({ pattern: 'bad*' });
    const response = await POST(request);
    const data = await response.json();
    expect(response.status).toBe(500);
    expect(data).toEqual({
      error: 'Pattern invalidation failed',
      status: 500,
      details: 'Invalid pattern',
    });
  });

  it('should invalidate by key (success, key exists)', async () => {
    mockCacheService.exists.mockResolvedValueOnce(true);
    mockCacheService.delete.mockResolvedValueOnce(true);
    const request = new NextRequest('http://localhost:3000/api/cache/invalidate', {
      method: 'POST',
      body: JSON.stringify({ key: 'bar' }),
    });
    request.json = async () => ({ key: 'bar' });
    const response = await POST(request);
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.data).toEqual({ invalidated: 1 });
    expect(data.backend).toBe('memory');
    expect(data.details.operation).toBe('key-invalidation');
    expect(data.details.invalidated).toBe(true);
  });

  it('should invalidate by key (success, key does not exist)', async () => {
    mockCacheService.exists.mockResolvedValueOnce(false);
    const request = new NextRequest('http://localhost:3000/api/cache/invalidate', {
      method: 'POST',
      body: JSON.stringify({ key: 'bar' }),
    });
    request.json = async () => ({ key: 'bar' });
    const response = await POST(request);
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.data).toEqual({ invalidated: 0 });
    expect(data.backend).toBe('memory');
    expect(data.details.operation).toBe('key-invalidation');
    expect(data.details.invalidated).toBe(false);
  });

  it('should handle key invalidation error', async () => {
    mockCacheService.exists.mockResolvedValueOnce(true);
    mockCacheService.delete.mockRejectedValueOnce(new Error('Permission denied'));
    const request = new NextRequest('http://localhost:3000/api/cache/invalidate', {
      method: 'POST',
      body: JSON.stringify({ key: 'bar' }),
    });
    request.json = async () => ({ key: 'bar' });
    const response = await POST(request);
    const data = await response.json();
    expect(response.status).toBe(500);
    expect(data).toEqual({
      error: 'Key invalidation failed',
      status: 500,
      details: 'Permission denied',
    });
  });

  it('should handle cache backend unavailable error', async () => {
    mockCacheService.invalidatePattern.mockRejectedValueOnce(new Error('Cache backend unavailable'));
    const request = new NextRequest('http://localhost:3000/api/cache/invalidate', {
      method: 'POST',
      body: JSON.stringify({ pattern: 'foo*' }),
    });
    request.json = async () => ({ pattern: 'foo*' });
    const response = await POST(request);
    const data = await response.json();
    expect(response.status).toBe(500);
    expect(data).toEqual({
      error: 'Pattern invalidation failed',
      status: 500,
      details: 'Cache backend unavailable',
    });
  });

  it('should handle unknown error', async () => {
    mockCacheService.invalidatePattern.mockRejectedValueOnce(new Error('Some unknown error'));
    const request = new NextRequest('http://localhost:3000/api/cache/invalidate', {
      method: 'POST',
      body: JSON.stringify({ pattern: 'foo*' }),
    });
    request.json = async () => ({ pattern: 'foo*' });
    const response = await POST(request);
    const data = await response.json();
    expect(response.status).toBe(500);
    expect(data).toEqual({
      error: 'Pattern invalidation failed',
      status: 500,
      details: 'Some unknown error',
    });
  });
});
