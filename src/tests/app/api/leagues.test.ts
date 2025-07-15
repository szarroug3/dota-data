import { NextRequest } from 'next/server';

import { GET } from '@/app/api/leagues/[id]/route';
import { fetchDotabuffLeague } from '@/lib/api/dotabuff/leagues';

// Mock external dependencies
jest.mock('@/lib/api/dotabuff/leagues', () => ({
  fetchDotabuffLeague: jest.fn()
}));

const mockFetchDotabuffLeague = fetchDotabuffLeague as jest.MockedFunction<typeof fetchDotabuffLeague>;

describe('/api/leagues/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const baseLeague = {
    id: '16435',
    name: 'RD2L Season 33'
  };

  it('should return league data successfully', async () => {
    mockFetchDotabuffLeague.mockResolvedValueOnce(baseLeague);
    const request = new NextRequest('http://localhost:3000/api/leagues/16435');
    const params = { id: '16435' };
    const response = await GET(request, { params });
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data).toEqual(baseLeague);
  });

  it('should handle force refresh', async () => {
    mockFetchDotabuffLeague.mockResolvedValueOnce(baseLeague);
    const request = new NextRequest('http://localhost:3000/api/leagues/16435?force=true');
    const params = { id: '16435' };
    const response = await GET(request, { params });
    expect(mockFetchDotabuffLeague).toHaveBeenCalledWith('16435', true);
    expect(response.status).toBe(200);
  });

  it('should handle rate limiting error', async () => {
    mockFetchDotabuffLeague.mockRejectedValueOnce(new Error('Rate limited by Dotabuff API'));
    const request = new NextRequest('http://localhost:3000/api/leagues/16435');
    const params = { id: '16435' };
    const response = await GET(request, { params });
    const data = await response.json();
    expect(response.status).toBe(429);
    expect(data).toEqual({
      error: 'Rate limited by Dotabuff API',
      status: 429,
      details: 'Too many requests to Dotabuff API. Please try again later.'
    });
  });

  it('should handle data not found error', async () => {
    mockFetchDotabuffLeague.mockRejectedValueOnce(new Error('Data Not Found'));
    const request = new NextRequest('http://localhost:3000/api/leagues/16435');
    const params = { id: '16435' };
    const response = await GET(request, { params });
    const data = await response.json();
    expect(response.status).toBe(404);
    expect(data).toEqual({
      error: 'Data Not Found',
      status: 404,
      details: 'League with ID 16435 could not be found.'
    });
  });

  it('should handle invalid league data error', async () => {
    mockFetchDotabuffLeague.mockRejectedValueOnce(new Error('Invalid league data'));
    const request = new NextRequest('http://localhost:3000/api/leagues/16435');
    const params = { id: '16435' };
    const response = await GET(request, { params });
    const data = await response.json();
    expect(response.status).toBe(422);
    expect(data).toEqual({
      error: 'Invalid league data',
      status: 422,
      details: 'League data is invalid or corrupted.'
    });
  });

  it('should handle tournament not found error', async () => {
    mockFetchDotabuffLeague.mockRejectedValueOnce(new Error('Tournament not found'));
    const request = new NextRequest('http://localhost:3000/api/leagues/16435');
    const params = { id: '16435' };
    const response = await GET(request, { params });
    const data = await response.json();
    expect(response.status).toBe(404);
    expect(data).toEqual({
      error: 'Tournament not found',
      status: 404,
      details: 'League tournament information could not be found.'
    });
  });

  it('should handle unknown error', async () => {
    mockFetchDotabuffLeague.mockRejectedValueOnce(new Error('Some unknown error'));
    const request = new NextRequest('http://localhost:3000/api/leagues/16435');
    const params = { id: '16435' };
    const response = await GET(request, { params });
    const data = await response.json();
    expect(response.status).toBe(500);
    expect(data).toEqual({
      error: 'Failed to process league',
      status: 500,
      details: 'Some unknown error'
    });
  });
}); 