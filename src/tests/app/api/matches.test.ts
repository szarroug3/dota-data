import * as fs from 'fs/promises';

import { NextRequest } from 'next/server';


import { GET } from '@/app/api/matches/[id]/route';
import { CacheService } from '@/lib/cache-service';
import { processMatch } from '@/lib/services/match-processor';
import { RateLimitResult } from '@/types/rate-limit';

import { RateLimiter } from '@/lib/rate-limiter';

function createMockCacheService(): jest.Mocked<CacheService> {
  const cache = Object.create(CacheService.prototype) as jest.Mocked<CacheService>;
  cache.get = jest.fn();
  cache.set = jest.fn();
  cache.delete = jest.fn();
  cache.clear = jest.fn();
  cache.getStats = jest.fn();
  cache.isHealthy = jest.fn();
  cache.getBackendType = jest.fn();
  cache.disconnect = jest.fn();
  cache.mget = jest.fn();
  cache.mset = jest.fn();
  cache.mdelete = jest.fn();
  cache.invalidatePattern = jest.fn();
  return cache;
}

function createMockRateLimiter(): jest.Mocked<RateLimiter> {
  const limiter = Object.create(RateLimiter.prototype) as jest.Mocked<RateLimiter>;
  limiter.checkLimit = jest.fn();
  limiter.checkServiceLimit = jest.fn();
  limiter.setRetryDelay = jest.fn();
  limiter.getRetryDelay = jest.fn();
  limiter.getStats = jest.fn();
  limiter.isHealthy = jest.fn();
  limiter.getBackendType = jest.fn();
  limiter.getConfig = jest.fn();
  limiter.clear = jest.fn();
  return limiter;
}

const mockCacheService = CacheService as jest.MockedClass<typeof CacheService>;
const mockRateLimiter = RateLimiter as jest.MockedClass<typeof RateLimiter>;
const mockProcessMatch = processMatch as jest.MockedFunction<typeof processMatch>;

// Mock external dependencies
jest.mock('@/lib/cache-service');
jest.mock('@/lib/rate-limiter');
jest.mock('@/lib/services/match-processor');
jest.mock('fs/promises');
jest.mock('path');

// Mock data
const mockRawMatch = {
  match_id: 8054301932,
  radiant_win: true,
  duration: 2400,
  start_time: 1640995200,
  game_mode: 1,
  lobby_type: 7,
  human_players: 10,
  leagueid: 16435,
  radiant_team_id: 9517508,
  dire_team_id: 9517509,
  radiant_score: 25,
  dire_score: 20,
  radiant_team: {
    team_id: 9517508,
    name: 'Team Spirit',
    tag: 'TS'
  },
  dire_team: {
    team_id: 9517509,
    name: 'Team Liquid',
    tag: 'TL'
  },
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
      kills: 8,
      deaths: 3,
      assists: 12,
      leaver_status: 0,
      last_hits: 200,
      denies: 15,
      gold_per_min: 650,
      xp_per_min: 750,
      level: 25,
      hero_damage: 25000,
      tower_damage: 5000,
      hero_healing: 0
    }
  ]
};

const mockProcessedMatch = {
  matchId: 8054301932,
  startTime: 1640995200,
  duration: 2400,
  radiantWin: true,
  gameMode: 'All Pick',
  lobbyType: 'Ranked',
  averageRank: 80,
  statistics: {
    totalKills: 45,
    killsPerMinute: 1.125,
    averageMatchRank: 80,
    gameDurationCategory: 'medium' as const,
    dominanceScore: 0.6,
    teamFightIntensity: 0.7,
    farmingEfficiency: {
      radiant: 0.65,
      dire: 0.55
    },
    heroComplexity: 0.5
  },
  teams: {
    radiant: {
      name: 'Team Spirit',
      teamId: 9517508,
      score: 25,
      players: [
        {
          accountId: 40927904,
          heroId: 1,
          playerSlot: 0,
          kills: 8,
          deaths: 3,
          assists: 12,
          kda: 6.67,
          netWorth: 25000,
          level: 25,
          lastHits: 200,
          denies: 15,
          gpm: 650,
          xpm: 750,
          heroDamage: 25000,
          towerDamage: 5000,
          heroHealing: 0,
          items: [29, 42, 44, 50, 52, 53],
          backpack: [],
          neutralItem: 0,
          performance: {
            laning: 0.8,
            teamfight: 0.7,
            farming: 0.9,
            support: 0.3
          }
        }
      ],
      totalKills: 25,
      totalDeaths: 15,
      totalAssists: 35,
      totalNetWorth: 125000,
      avgLevel: 25,
      avgGPM: 625,
      avgXPM: 750,
      teamFightPerformance: 0.7,
      objectives: {
        towers: 3,
        barracks: 1,
        roshan: 2
      }
    },
    dire: {
      name: 'Team Liquid',
      teamId: 9517509,
      score: 20,
      players: [
        {
          accountId: 40927905,
          heroId: 2,
          playerSlot: 128,
          kills: 5,
          deaths: 4,
          assists: 8,
          kda: 3.25,
          netWorth: 20000,
          level: 22,
          lastHits: 150,
          denies: 10,
          gpm: 550,
          xpm: 650,
          heroDamage: 18000,
          towerDamage: 3000,
          heroHealing: 0,
          items: [1, 2, 3, 4, 5, 6],
          backpack: [],
          neutralItem: 0,
          performance: {
            laning: 0.6,
            teamfight: 0.5,
            farming: 0.7,
            support: 0.4
          }
        }
      ],
      totalKills: 20,
      totalDeaths: 25,
      totalAssists: 25,
      totalNetWorth: 100000,
      avgLevel: 22,
      avgGPM: 500,
      avgXPM: 600,
      teamFightPerformance: 0.5,
      objectives: {
        towers: 1,
        barracks: 0,
        roshan: 1
      }
    }
  },
  processed: {
    timestamp: '2024-01-01T00:00:00.000Z',
    version: '1.0.0'
  }
};

interface ApiErrorResponse {
  error: string;
  status: number;
  details: string;
}

describe('Matches API', () => {
  let mockCache: jest.Mocked<CacheService>;
  let mockRateLimiterInstance: jest.Mocked<RateLimiter>;

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock CacheService instance with all required methods
    mockCache = createMockCacheService();
    
    // Mock RateLimiter instance with all required methods
    mockRateLimiterInstance = createMockRateLimiter();
    
    mockCacheService.mockImplementation(() => mockCache);
    mockRateLimiter.mockImplementation(() => mockRateLimiterInstance);
    mockProcessMatch.mockReturnValue(mockProcessedMatch);
    
    // Mock fs.readFile to return mock data
    jest.spyOn(fs, 'readFile').mockResolvedValue(JSON.stringify(mockRawMatch));
    
    // Mock environment variables
    process.env.USE_MOCK_API = 'true';
    process.env.USE_REDIS = 'false';
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('GET /api/matches/{id}', () => {
    describe('Success Cases', () => {
      it('should return match data with default parameters', async () => {
        const request = new NextRequest('http://localhost:3000/api/matches/8054301932');
        const response = await GET(request, { params: { id: '8054301932' } });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.data).toEqual(mockProcessedMatch);
        expect(data.timestamp).toBeDefined();
        expect(data.view).toBe('full');
        expect(data.parsed).toBe(false);
        expect(data.cached).toBe(true);

        expect(mockProcessMatch).toHaveBeenCalledWith(mockRawMatch);
      });

      it('should handle force refresh parameter', async () => {
        const request = new NextRequest('http://localhost:3000/api/matches/8054301932?force=true');
        const response = await GET(request, { params: { id: '8054301932' } });

        expect(response.status).toBe(200);
        expect(mockCache.get).not.toHaveBeenCalled();
      });

      it('should handle parsed parameter', async () => {
        const request = new NextRequest('http://localhost:3000/api/matches/8054301932?parsed=true');
        const response = await GET(request, { params: { id: '8054301932' } });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.parsed).toBe(true);
      });

      it('should handle summary view parameter', async () => {
        const request = new NextRequest('http://localhost:3000/api/matches/8054301932?view=summary');
        const response = await GET(request, { params: { id: '8054301932' } });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.view).toBe('summary');
        expect(data.data).toEqual(mockProcessedMatch);
      });

      it('should handle players view parameter', async () => {
        const request = new NextRequest('http://localhost:3000/api/matches/8054301932?view=players');
        const response = await GET(request, { params: { id: '8054301932' } });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.view).toBe('players');
        // Only expect the fields returned by filterResponseByView for 'players'
        expect(data.data).toEqual({
          matchId: mockProcessedMatch.matchId,
          teams: mockProcessedMatch.teams,
          processed: mockProcessedMatch.processed
        });
      });

      it('should handle teams view parameter', async () => {
        const request = new NextRequest('http://localhost:3000/api/matches/8054301932?view=teams');
        const response = await GET(request, { params: { id: '8054301932' } });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.view).toBe('teams');
        expect(data.data).toEqual({
          matchId: mockProcessedMatch.matchId,
          teams: mockProcessedMatch.teams,
          processed: mockProcessedMatch.processed
        });
      });

      it('should handle includePlayers parameter', async () => {
        const request = new NextRequest('http://localhost:3000/api/matches/8054301932?includePlayers=true');
        const response = await GET(request, { params: { id: '8054301932' } });

        expect(response.status).toBe(200);
        // includePlayers is not part of the response structure
      });

      it('should handle includeTeams parameter', async () => {
        const request = new NextRequest('http://localhost:3000/api/matches/8054301932?includeTeams=true');
        const response = await GET(request, { params: { id: '8054301932' } });

        expect(response.status).toBe(200);
        // includeTeams is not part of the response structure
      });

      it('should handle multiple query parameters', async () => {
        const request = new NextRequest('http://localhost:3000/api/matches/8054301932?force=true&view=summary&parsed=true&includePlayers=true&includeTeams=true');
        const response = await GET(request, { params: { id: '8054301932' } });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.view).toBe('summary');
        expect(data.parsed).toBe(true);
        expect(data.cached).toBe(false);
      });
    });

    describe('Error Cases', () => {
      it('should handle invalid match ID', async () => {
        const request = new NextRequest('http://localhost:3000/api/matches/invalid');
        const response = await GET(request, { params: { id: 'invalid' } });
        const data = await response.json() as ApiErrorResponse;

        expect(response.status).toBe(400);
        expect(data.error).toBe('Invalid match ID');
        expect(data.status).toBe(400);
        expect(data.details).toBe('Match ID must be a valid number');
      });

      it('should handle empty match ID', async () => {
        const request = new NextRequest('http://localhost:3000/api/matches/');
        const response = await GET(request, { params: { id: '' } });
        const data = await response.json() as ApiErrorResponse;

        expect(response.status).toBe(400);
        expect(data.error).toBe('Invalid match ID');
        expect(data.status).toBe(400);
        expect(data.details).toBe('Match ID must be a valid number');
      });

      it('should handle rate limiting errors', async () => {
        mockRateLimiterInstance.checkServiceLimit.mockResolvedValueOnce({ 
          allowed: false, 
          retryAfter: 60,
          remaining: 0,
          resetTime: Date.now() + 60000,
          service: 'opendota',
          key: 'test'
        } as RateLimitResult);
        const prevMock = process.env.USE_MOCK_API;
        process.env.USE_MOCK_API = 'false';
        const request = new NextRequest('http://localhost:3000/api/matches/8054301932');
        const response = await GET(request, { params: { id: '8054301932' } });
        process.env.USE_MOCK_API = prevMock;
        const data = await response.json() as ApiErrorResponse;

        expect(response.status).toBe(429);
        expect(data.error).toBe('Rate limited by OpenDota API');
        expect(data.status).toBe(429);
        expect(data.details).toBe('Too many requests to OpenDota API. Please try again later.');
      });

      it('should handle data not found errors', async () => {
        // Mock fs.readFile to throw error
        jest.spyOn(fs, 'readFile').mockRejectedValue(new Error('Failed to load match data from mock'));
        
        const request = new NextRequest('http://localhost:3000/api/matches/999999');
        const response = await GET(request, { params: { id: '999999' } });
        const data = await response.json() as ApiErrorResponse;

        expect(response.status).toBe(404);
        expect(data.error).toBe('Data Not Found');
        expect(data.status).toBe(404);
        expect(data.details).toBe('Match with ID 999999 could not be found.');
      });

      it('should handle invalid match data errors', async () => {
        mockProcessMatch.mockImplementation(() => {
          throw new Error('Invalid match data');
        });
        
        const request = new NextRequest('http://localhost:3000/api/matches/8054301932');
        const response = await GET(request, { params: { id: '8054301932' } });
        const data = await response.json() as ApiErrorResponse;

        expect(response.status).toBe(422);
        expect(data.error).toBe('Invalid match data');
        expect(data.status).toBe(422);
        expect(data.details).toBe('Match data is invalid or corrupted.');
      });

      it('should handle unknown errors', async () => {
        mockProcessMatch.mockImplementation(() => {
          throw new Error('Some unknown error');
        });
        
        const request = new NextRequest('http://localhost:3000/api/matches/8054301932');
        const response = await GET(request, { params: { id: '8054301932' } });
        const data = await response.json() as ApiErrorResponse;

        expect(response.status).toBe(500);
        expect(data.error).toBe('Failed to process match');
        expect(data.status).toBe(500);
        expect(data.details).toBe('Some unknown error');
      });
    });
  });
}); 