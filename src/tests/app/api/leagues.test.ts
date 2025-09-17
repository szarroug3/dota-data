import { NextRequest } from 'next/server';
import type { z } from 'zod';

import { GET } from '@/app/api/leagues/[id]/route';
import { fetchSteamLeague } from '@/lib/api/steam/leagues';
import { schemas } from '@/types/api-zod';

// Mock external dependencies
jest.mock('@/lib/api/steam/leagues');

const mockFetchSteamLeague = fetchSteamLeague as jest.MockedFunction<typeof fetchSteamLeague>;

type SteamLeague = z.infer<typeof schemas.getApiLeaguesId>;

// Mock data (Steam league shape)
const mockLeagueData: SteamLeague = {
  id: '16435',
  name: 'The International 2024',
  steam: {
    result: {
      status: 1,
      num_results: 2,
      total_results: 2,
      results_remaining: 0,
      matches: [
        { match_id: 111, start_time: 0, duration: 0, radiant_team_id: 1, dire_team_id: 2 },
        { match_id: 222, start_time: 0, duration: 0, radiant_team_id: 3, dire_team_id: 4 },
      ],
    },
  },
};

describe('Leagues API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchSteamLeague.mockResolvedValue(mockLeagueData as any);
  });

  describe('GET /api/leagues/[id]', () => {
    it('should return league data successfully', async () => {
      const request = new NextRequest('http://localhost:3000/api/leagues/16435');
      const params = Promise.resolve({ id: '16435' });

      const response = await GET(request, { params });

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data).toMatchObject({
        id: mockLeagueData.id,
        name: mockLeagueData.name,
        steam: mockLeagueData.steam,
      });
      expect(mockFetchSteamLeague).toHaveBeenCalledWith('16435', false);
    });

    it('should handle force parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/leagues/16435?force=true');
      const params = Promise.resolve({ id: '16435' });

      await GET(request, { params });

      expect(mockFetchSteamLeague).toHaveBeenCalledWith('16435', true);
    });

    it('should handle rate limiting errors', async () => {
      mockFetchSteamLeague.mockRejectedValue(new Error('Rate limited'));

      const request = new NextRequest('http://localhost:3000/api/leagues/16435');
      const params = Promise.resolve({ id: '16435' });

      const response = await GET(request, { params });

      expect(response.status).toBe(429);
      const data = await response.json();
      expect(data.error).toBe('Rate limited by Steam API');
      expect(data.status).toBe(429);
      expect(data.details).toBe('Too many requests to Steam API. Please try again later.');
    });

    it('should handle league not found errors', async () => {
      mockFetchSteamLeague.mockRejectedValue(new Error('Data Not Found'));

      const request = new NextRequest('http://localhost:3000/api/leagues/99999');
      const params = Promise.resolve({ id: '99999' });

      const response = await GET(request, { params });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBe('Data Not Found');
      expect(data.status).toBe(404);
      expect(data.details).toBe('League with ID 99999 could not be found.');
    });

    it('should handle failed to load errors', async () => {
      mockFetchSteamLeague.mockRejectedValue(new Error('Failed to load league data'));

      const request = new NextRequest('http://localhost:3000/api/leagues/16435');
      const params = Promise.resolve({ id: '16435' });

      const response = await GET(request, { params });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBe('Data Not Found');
      expect(data.status).toBe(404);
      expect(data.details).toBe('League with ID 16435 could not be found.');
    });

    it('should handle invalid league data errors', async () => {
      mockFetchSteamLeague.mockRejectedValue(new Error('Invalid league data format'));

      const request = new NextRequest('http://localhost:3000/api/leagues/16435');
      const params = Promise.resolve({ id: '16435' });

      const response = await GET(request, { params });

      expect(response.status).toBe(422);
      const data = await response.json();
      expect(data.error).toBe('Invalid league data');
      expect(data.status).toBe(422);
      expect(data.details).toBe('League data is invalid or corrupted.');
    });

    it('should handle tournament not found errors', async () => {
      mockFetchSteamLeague.mockRejectedValue(new Error('Tournament not found'));

      const request = new NextRequest('http://localhost:3000/api/leagues/16435');
      const params = Promise.resolve({ id: '16435' });

      const response = await GET(request, { params });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBe('Tournament not found');
      expect(data.status).toBe(404);
      expect(data.details).toBe('League tournament information could not be found.');
    });

    it('should handle generic API errors', async () => {
      mockFetchSteamLeague.mockRejectedValue(new Error('Network error'));

      const request = new NextRequest('http://localhost:3000/api/leagues/16435');
      const params = Promise.resolve({ id: '16435' });

      const response = await GET(request, { params });

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe('Failed to process league');
      expect(data.status).toBe(500);
      expect(data.details).toBe('Network error');
    });

    it('should handle non-Error exceptions', async () => {
      mockFetchSteamLeague.mockRejectedValue('String error');

      const request = new NextRequest('http://localhost:3000/api/leagues/16435');
      const params = Promise.resolve({ id: '16435' });

      const response = await GET(request, { params });

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe('Failed to process league');
      expect(data.status).toBe(500);
      expect(data.details).toBe('Unknown error occurred');
    });

    it('should handle empty force parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/leagues/16435?force=');
      const params = Promise.resolve({ id: '16435' });

      await GET(request, { params });

      expect(mockFetchSteamLeague).toHaveBeenCalledWith('16435', false);
    });

    it('should handle false force parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/leagues/16435?force=false');
      const params = Promise.resolve({ id: '16435' });

      await GET(request, { params });

      expect(mockFetchSteamLeague).toHaveBeenCalledWith('16435', false);
    });

    it('should handle case-insensitive force parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/leagues/16435?force=TRUE');
      const params = Promise.resolve({ id: '16435' });

      await GET(request, { params });

      expect(mockFetchSteamLeague).toHaveBeenCalledWith('16435', false);
    });

    it('should handle different league IDs', async () => {
      const request = new NextRequest('http://localhost:3000/api/leagues/12345');
      const params = Promise.resolve({ id: '12345' });

      await GET(request, { params });

      expect(mockFetchSteamLeague).toHaveBeenCalledWith('12345', false);
    });
  });
});
