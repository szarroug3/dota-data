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
    league_id: 16435,
    name: 'The International 2024',
    description: 'The International is the premier Dota 2 tournament',
    tournament_url: 'https://www.dota2.com/esports/ti2024',
    matches: [
      {
        match_id: 8054301932,
        start_time: 1640995200,
        duration: 2150,
        radiant_name: 'Team Spirit',
        dire_name: 'Team Secret',
        radiant_win: true,
        radiant_score: 25,
        dire_score: 18,
        leagueid: 16435
      }
    ]
  };

  it('should return 400 for invalid league ID', async () => {
    const request = new NextRequest('http://localhost:3000/api/leagues/invalid');
    const params = { id: 'invalid' };
    const response = await GET(request, { params });
    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data).toEqual({
      error: 'Invalid league ID',
      status: 400,
      details: 'League ID must be a valid number'
    });
  });

  it('should return 400 for empty league ID', async () => {
    const request = new NextRequest('http://localhost:3000/api/leagues/');
    const params = { id: '' };
    const response = await GET(request, { params });
    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data).toEqual({
      error: 'Invalid league ID',
      status: 400,
      details: 'League ID must be a valid number'
    });
  });

  it('should return league data (default view)', async () => {
    mockFetchDotabuffLeague.mockResolvedValueOnce(baseLeague);
    const request = new NextRequest('http://localhost:3000/api/leagues/16435');
    const params = { id: '16435' };
    const response = await GET(request, { params });
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.data).toMatchObject({
      leagueId: 16435,
      name: 'The International 2024',
      description: 'The International is the premier Dota 2 tournament',
      tournamentUrl: 'https://www.dota2.com/esports/ti2024',
      statistics: expect.any(Object),
      processed: expect.any(Object)
    });
    expect(data.data.matches).toBeUndefined();
    expect(data.view).toBe('full');
    expect(data.options).toEqual({ includeMatches: false });
  });

  it('should return league data with includeMatches=true', async () => {
    mockFetchDotabuffLeague.mockResolvedValueOnce(baseLeague);
    const request = new NextRequest('http://localhost:3000/api/leagues/16435?includeMatches=true');
    const params = { id: '16435' };
    const response = await GET(request, { params });
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.data.matches).toBeDefined();
    expect(data.options).toEqual({ includeMatches: true });
  });

  it('should return league data with view=summary', async () => {
    mockFetchDotabuffLeague.mockResolvedValueOnce(baseLeague);
    const request = new NextRequest('http://localhost:3000/api/leagues/16435?view=summary');
    const params = { id: '16435' };
    const response = await GET(request, { params });
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.data).toMatchObject({
      leagueId: 16435,
      name: 'The International 2024',
      description: 'The International is the premier Dota 2 tournament',
      tournamentUrl: 'https://www.dota2.com/esports/ti2024',
      statistics: expect.any(Object),
      processed: expect.any(Object)
    });
    expect(data.data.matches).toBeUndefined();
    expect(data.view).toBe('summary');
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