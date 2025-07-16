
import { NextRequest } from 'next/server';

import { GET } from '@/app/api/matches/[id]/route';
import { fetchOpenDotaMatch } from '@/lib/api/opendota/matches';
import { OpenDotaMatch } from '@/types/external-apis';

// Mock external dependencies
jest.mock('@/lib/api/opendota/matches');
jest.mock('fs/promises');

const mockFetchOpenDotaMatch = fetchOpenDotaMatch as jest.MockedFunction<typeof fetchOpenDotaMatch>;

// Mock data
const mockRawMatch: OpenDotaMatch = {
  match_id: 8054301932,
  radiant_win: true,
  duration: 2400,
  start_time: 1640995200,
  game_mode: 1,
  lobby_type: 7,
  leagueid: 16435,
  radiant_team_id: 9517508,
  dire_team_id: 9517509,
  radiant_score: 25,
  dire_score: 20,
  players: [
    {
      account_id: 40927904,
      player_slot: 0,
      hero_id: 1,
      item_0: 29,
      item_1: 42,
      item_2: 44,
      item_3: 50,
      item_4: 52,
      item_5: 53,
      backpack_0: 0,
      backpack_1: 0,
      backpack_2: 0,
      item_neutral: 0,
      kills: 8,
      deaths: 3,
      assists: 12,
      leaver_status: 0,
      last_hits: 200,
      denies: 15,
      gold_per_min: 650,
      xp_per_min: 750,
      level: 25,
      gold: 25000,
      gold_spent: 20000,
      hero_damage: 25000,
      tower_damage: 5000,
      hero_healing: 0,
      isRadiant: true,
      win: 1,
      lose: 0,
      total_gold: 25000,
      total_xp: 18000,
      kills_per_min: 0.2,
      kda: 6.67,
      abandons: 0
    }
  ]
};

interface ApiErrorResponse {
  error: string;
  status: number;
  details: string;
}

describe('Matches API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchOpenDotaMatch.mockResolvedValue(mockRawMatch);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('GET /api/matches/{id}', () => {
    describe('Success Cases', () => {
      it('should return match data with default parameters', async () => {
        const request = new NextRequest('http://localhost:3000/api/matches/8054301932');
        const response = await GET(request, { params: Promise.resolve({ id: '8054301932' }) });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toEqual(mockRawMatch);
        expect(mockFetchOpenDotaMatch).toHaveBeenCalledWith('8054301932', false);
      });

      it('should handle force refresh parameter', async () => {
        const request = new NextRequest('http://localhost:3000/api/matches/8054301932?force=true');
        const response = await GET(request, { params: Promise.resolve({ id: '8054301932' }) });

        expect(response.status).toBe(200);
        expect(mockFetchOpenDotaMatch).toHaveBeenCalledWith('8054301932', true);
      });

      it('should handle multiple query parameters', async () => {
        const request = new NextRequest('http://localhost:3000/api/matches/8054301932?force=true&other=param');
        const response = await GET(request, { params: Promise.resolve({ id: '8054301932' }) });

        expect(response.status).toBe(200);
        expect(mockFetchOpenDotaMatch).toHaveBeenCalledWith('8054301932', true);
      });
    });

    describe('Error Cases', () => {
      it('should handle rate limiting errors', async () => {
        mockFetchOpenDotaMatch.mockRejectedValueOnce(new Error('Rate limited by OpenDota API'));
        
        const request = new NextRequest('http://localhost:3000/api/matches/8054301932');
        const response = await GET(request, { params: Promise.resolve({ id: '8054301932' }) });
        const data = await response.json() as ApiErrorResponse;

        expect(response.status).toBe(429);
        expect(data.error).toBe('Rate limited by OpenDota API');
        expect(data.status).toBe(429);
        expect(data.details).toBe('Too many requests to OpenDota API. Please try again later.');
      });

      it('should handle match not found errors', async () => {
        mockFetchOpenDotaMatch.mockRejectedValueOnce(new Error('Match not found'));
        
        const request = new NextRequest('http://localhost:3000/api/matches/999999');
        const response = await GET(request, { params: Promise.resolve({ id: '999999' }) });
        const data = await response.json() as ApiErrorResponse;

        expect(response.status).toBe(404);
        expect(data.error).toBe('Match not found');
        expect(data.status).toBe(404);
        expect(data.details).toBe('Match with ID 999999 could not be found.');
      });

      it('should handle invalid match data errors', async () => {
        mockFetchOpenDotaMatch.mockRejectedValueOnce(new Error('Failed to parse match data'));
        
        const request = new NextRequest('http://localhost:3000/api/matches/8054301932');
        const response = await GET(request, { params: Promise.resolve({ id: '8054301932' }) });
        const data = await response.json() as ApiErrorResponse;

        expect(response.status).toBe(422);
        expect(data.error).toBe('Invalid match data');
        expect(data.status).toBe(422);
        expect(data.details).toBe('Match data is invalid or corrupted.');
      });

      it('should handle unknown errors', async () => {
        mockFetchOpenDotaMatch.mockRejectedValueOnce(new Error('Some unknown error'));
        
        const request = new NextRequest('http://localhost:3000/api/matches/8054301932');
        const response = await GET(request, { params: Promise.resolve({ id: '8054301932' }) });
        const data = await response.json() as ApiErrorResponse;

        expect(response.status).toBe(500);
        expect(data.error).toBe('Failed to fetch match');
        expect(data.status).toBe(500);
        expect(data.details).toBe('Some unknown error');
      });

      it('should handle non-Error exceptions', async () => {
        mockFetchOpenDotaMatch.mockRejectedValueOnce('String error');
        
        const request = new NextRequest('http://localhost:3000/api/matches/8054301932');
        const response = await GET(request, { params: Promise.resolve({ id: '8054301932' }) });
        const data = await response.json() as ApiErrorResponse;

        expect(response.status).toBe(500);
        expect(data.error).toBe('Failed to fetch match');
        expect(data.status).toBe(500);
        expect(data.details).toBe('Unknown error occurred');
      });
    });
  });
}); 