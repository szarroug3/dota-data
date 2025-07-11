import { NextRequest } from 'next/server';

import { GET } from '@/app/api/players/[id]/route';
import { fetchOpenDotaPlayer } from '@/lib/api/opendota/player-profile';
import { processPlayer } from '@/lib/services/player-processor';

// Mock external dependencies
jest.mock('@/lib/api/opendota/player-profile');
jest.mock('@/lib/services/player-processor');

const mockFetchOpenDotaPlayer = fetchOpenDotaPlayer as jest.MockedFunction<typeof fetchOpenDotaPlayer>;
const mockProcessPlayer = processPlayer as jest.MockedFunction<typeof processPlayer>;

// Mock data
const mockRawPlayer = {
  profile: {
    account_id: 40927904,
    personaname: 'TestPlayer',
    name: 'TestPlayer',
    plus: true,
    cheese: 0,
    steamid: '76561198012345678',
    avatar: 'https://example.com/avatar.jpg',
    avatarmedium: 'https://example.com/avatar_medium.jpg',
    avatarfull: 'https://example.com/avatar_full.jpg',
    profileurl: 'https://steamcommunity.com/id/testplayer',
    last_login: '2024-01-01T00:00:00.000Z',
    loccountrycode: 'US',
    status: 'online',
    fh_unavailable: false,
    is_contributor: false,
    is_subscriber: false
  },
  rank_tier: 80,
  leaderboard_rank: 150
};

const mockProcessedPlayer = {
  profile: {
    accountId: 40927904,
    personaName: 'TestPlayer',
    steamId: '76561198012345678',
    avatar: 'https://example.com/avatar.jpg',
    avatarMedium: 'https://example.com/avatar_medium.jpg',
    avatarFull: 'https://example.com/avatar_full.jpg',
    profileUrl: 'https://steamcommunity.com/id/testplayer',
    rankTier: 80,
    leaderboardRank: 150,
    mmrEstimate: 8500,
    isPlusSubscriber: true,
    isContributor: false,
    isSubscriber: false,
    cheese: 0,
    skillBracket: 'very_high' as const
  },
  statistics: {
    totalMatches: 1000,
    winRate: 0.65,
    wins: 650,
    losses: 350,
    averageKDA: 3.2,
    averageGPM: 650,
    averageXPM: 750,
    averageDuration: 2400,
    favoriteHeroes: [
      {
        heroId: 1,
        games: 50,
        winRate: 0.7,
        avgKDA: 3.5,
        lastPlayed: 1640995200
      }
    ],
    gameModes: [
      {
        mode: 'All Pick',
        games: 800,
        winRate: 0.65
      }
    ],
    positions: [
      {
        position: 'carry',
        games: 400,
        winRate: 0.7
      }
    ]
  },
  performance: {
    skillLevel: 'expert' as const,
    consistency: 80,
    versatility: 60,
    teamwork: 80,
    laning: 80,
    farming: 70,
    fighting: 90,
    supporting: 60,
    leadership: 70,
    improvement: 10,
    strengths: ['laning', 'fighting'],
    weaknesses: ['supporting']
  },
  recentActivity: {
    recentMatches: [
      {
        matchId: 8054301932,
        heroId: 1,
        result: 'win' as const,
        duration: 2400,
        startTime: 1640995200,
        kda: 3.5,
        gpm: 650,
        xpm: 750,
        gameMode: 'All Pick',
        lobbyType: 'Ranked'
      }
    ],
    activityLevel: 'high' as const,
    streaks: {
      currentWinStreak: 3,
      currentLossStreak: 0,
      longestWinStreak: 8,
      longestLossStreak: 2
    },
    playTime: {
      hoursLast7Days: 20,
      hoursLast30Days: 80,
      avgSessionLength: 2.5
    }
  },
  heroes: {
    totalHeroesPlayed: 50,
    mostPlayedHeroes: [
      {
        heroId: 1,
        games: 50,
        winRate: 0.7,
        avgKDA: 3.5,
        avgGPM: 650,
        avgXPM: 750,
        lastPlayed: 1640995200,
        performance: 85
      }
    ],
    bestPerformingHeroes: [
      {
        heroId: 1,
        games: 50,
        winRate: 0.7,
        avgKDA: 3.5,
        performance: 85
      }
    ],
    recentlyPlayedHeroes: [
      {
        heroId: 1,
        games: 50,
        winRate: 0.7,
        lastPlayed: 1640995200
      }
    ],
    heroRoles: {
      carry: { games: 400, winRate: 0.7 },
      support: { games: 200, winRate: 0.6 },
      initiator: { games: 100, winRate: 0.65 },
      nuker: { games: 150, winRate: 0.68 },
      disabler: { games: 80, winRate: 0.62 },
      jungler: { games: 20, winRate: 0.5 },
      durable: { games: 30, winRate: 0.55 },
      escape: { games: 10, winRate: 0.4 },
      pusher: { games: 10, winRate: 0.45 }
    }
  },
  trends: {
    mmrTrend: 'improving' as const,
    winRateTrend: 'improving' as const,
    performanceTrend: 'improving' as const,
    activityTrend: 'increasing' as const,
    predictions: {
      nextRankPrediction: 'Divine',
      improvementAreas: ['supporting', 'teamwork'],
      recommendedHeroes: [1, 2, 3]
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

describe('Players API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchOpenDotaPlayer.mockResolvedValue(mockRawPlayer);
    mockProcessPlayer.mockReturnValue(mockProcessedPlayer);
  });

  describe('GET /api/players/{id}', () => {
    describe('Success Cases', () => {
      it('should return player data with default parameters', async () => {
        const request = new NextRequest('http://localhost:3000/api/players/40927904');
        const response = await GET(request, { params: { id: '40927904' } });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.data).toEqual(mockProcessedPlayer);
        expect(data.timestamp).toBeDefined();
        expect(data.view).toBe('full');
        expect(data.options).toEqual({
          includeMatches: false,
          includeHeroes: false,
          includeRecent: false
        });

        expect(mockFetchOpenDotaPlayer).toHaveBeenCalledWith('40927904', false);
        expect(mockProcessPlayer).toHaveBeenCalledWith({
          profile: mockRawPlayer,
          matches: [],
          heroes: [],
          counts: {},
          totals: {} as any,
          winLoss: { win: 0, lose: 0 },
          recentMatches: []
        });
      });

      it('should handle force refresh parameter', async () => {
        const request = new NextRequest('http://localhost:3000/api/players/40927904?force=true');
        const response = await GET(request, { params: { id: '40927904' } });

        expect(response.status).toBe(200);
        expect(mockFetchOpenDotaPlayer).toHaveBeenCalledWith('40927904', true);
      });

      it('should handle profile view parameter', async () => {
        const request = new NextRequest('http://localhost:3000/api/players/40927904?view=profile');
        const response = await GET(request, { params: { id: '40927904' } });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.view).toBe('profile');
        expect(data.data).toEqual(mockProcessedPlayer);
      });

      it('should handle stats view parameter', async () => {
        const request = new NextRequest('http://localhost:3000/api/players/40927904?view=stats');
        const response = await GET(request, { params: { id: '40927904' } });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.view).toBe('stats');
        expect(data.data).toEqual(mockProcessedPlayer);
      });

      it('should handle recent view parameter', async () => {
        const request = new NextRequest('http://localhost:3000/api/players/40927904?view=recent');
        const response = await GET(request, { params: { id: '40927904' } });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.view).toBe('recent');
        expect(data.data).toEqual(mockProcessedPlayer);
      });

      it('should handle includeMatches parameter', async () => {
        const request = new NextRequest('http://localhost:3000/api/players/40927904?includeMatches=true');
        const response = await GET(request, { params: { id: '40927904' } });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.options.includeMatches).toBe(true);
      });

      it('should handle includeHeroes parameter', async () => {
        const request = new NextRequest('http://localhost:3000/api/players/40927904?includeHeroes=true');
        const response = await GET(request, { params: { id: '40927904' } });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.options.includeHeroes).toBe(true);
      });

      it('should handle includeRecent parameter', async () => {
        const request = new NextRequest('http://localhost:3000/api/players/40927904?includeRecent=true');
        const response = await GET(request, { params: { id: '40927904' } });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.options.includeRecent).toBe(true);
      });

      it('should handle multiple query parameters', async () => {
        const request = new NextRequest('http://localhost:3000/api/players/40927904?force=true&view=profile&includeMatches=true&includeHeroes=true&includeRecent=true');
        const response = await GET(request, { params: { id: '40927904' } });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.view).toBe('profile');
        expect(data.options).toEqual({
          includeMatches: true,
          includeHeroes: true,
          includeRecent: true
        });
        expect(mockFetchOpenDotaPlayer).toHaveBeenCalledWith('40927904', true);
      });
    });

    describe('Error Cases', () => {
      it('should handle invalid player ID', async () => {
        const request = new NextRequest('http://localhost:3000/api/players/invalid');
        const response = await GET(request, { params: { id: 'invalid' } });
        const data = await response.json() as ApiErrorResponse;

        expect(response.status).toBe(400);
        expect(data.error).toBe('Invalid player ID');
        expect(data.status).toBe(400);
        expect(data.details).toBe('Player ID must be a valid number');
      });

      it('should handle empty player ID', async () => {
        const request = new NextRequest('http://localhost:3000/api/players/');
        const response = await GET(request, { params: { id: '' } });
        const data = await response.json() as ApiErrorResponse;

        expect(response.status).toBe(400);
        expect(data.error).toBe('Invalid player ID');
        expect(data.status).toBe(400);
        expect(data.details).toBe('Player ID must be a valid number');
      });

      it('should handle rate limiting errors', async () => {
        mockFetchOpenDotaPlayer.mockRejectedValue(new Error('Rate limited by OpenDota API'));
        
        const request = new NextRequest('http://localhost:3000/api/players/40927904');
        const response = await GET(request, { params: { id: '40927904' } });
        const data = await response.json() as ApiErrorResponse;

        expect(response.status).toBe(429);
        expect(data.error).toBe('Rate limited by OpenDota API');
        expect(data.status).toBe(429);
        expect(data.details).toBe('Too many requests to OpenDota API. Please try again later.');
      });

      it('should handle data not found errors', async () => {
        mockFetchOpenDotaPlayer.mockRejectedValue(new Error('Failed to load OpenDota player from mock data'));
        
        const request = new NextRequest('http://localhost:3000/api/players/999999');
        const response = await GET(request, { params: { id: '999999' } });
        const data = await response.json() as ApiErrorResponse;

        expect(response.status).toBe(404);
        expect(data.error).toBe('Data Not Found');
        expect(data.status).toBe(404);
        expect(data.details).toBe('Player with ID 999999 could not be found.');
      });

      it('should handle private profile errors', async () => {
        mockFetchOpenDotaPlayer.mockRejectedValue(new Error('Private profile'));
        
        const request = new NextRequest('http://localhost:3000/api/players/40927904');
        const response = await GET(request, { params: { id: '40927904' } });
        const data = await response.json() as ApiErrorResponse;

        expect(response.status).toBe(403);
        expect(data.error).toBe('Private profile');
        expect(data.status).toBe(403);
        expect(data.details).toBe('Player profile is private and cannot be accessed.');
      });

      it('should handle invalid player data errors', async () => {
        mockProcessPlayer.mockImplementation(() => {
          throw new Error('Invalid player data');
        });
        
        const request = new NextRequest('http://localhost:3000/api/players/40927904');
        const response = await GET(request, { params: { id: '40927904' } });
        const data = await response.json() as ApiErrorResponse;

        expect(response.status).toBe(422);
        expect(data.error).toBe('Invalid player data');
        expect(data.status).toBe(422);
        expect(data.details).toBe('Player data is invalid or corrupted.');
      });

      it('should handle processing errors', async () => {
        mockProcessPlayer.mockImplementation(() => {
          throw new Error('Processing failed');
        });
        
        const request = new NextRequest('http://localhost:3000/api/players/40927904');
        const response = await GET(request, { params: { id: '40927904' } });
        const data = await response.json() as ApiErrorResponse;

        expect(response.status).toBe(500);
        expect(data.error).toBe('Failed to process player');
        expect(data.status).toBe(500);
        expect(data.details).toBe('Processing failed');
      });

      it('should handle unknown errors', async () => {
        mockFetchOpenDotaPlayer.mockRejectedValue(new Error('Unexpected error'));
        
        const request = new NextRequest('http://localhost:3000/api/players/40927904');
        const response = await GET(request, { params: { id: '40927904' } });
        const data = await response.json() as ApiErrorResponse;

        expect(response.status).toBe(500);
        expect(data.error).toBe('Failed to process player');
        expect(data.status).toBe(500);
        expect(data.details).toBe('Unexpected error');
      });

      it('should handle non-Error exceptions', async () => {
        mockFetchOpenDotaPlayer.mockRejectedValue('String error');
        
        const request = new NextRequest('http://localhost:3000/api/players/40927904');
        const response = await GET(request, { params: { id: '40927904' } });
        const data = await response.json() as ApiErrorResponse;

        expect(response.status).toBe(500);
        expect(data.error).toBe('Failed to process player');
        expect(data.status).toBe(500);
        expect(data.details).toBe('Unknown error occurred');
      });
    });

    describe('Edge Cases', () => {
      it('should handle numeric player ID as string', async () => {
        const request = new NextRequest('http://localhost:3000/api/players/40927904');
        const response = await GET(request, { params: { id: '40927904' } });

        expect(response.status).toBe(200);
      });

      it('should handle case insensitive view parameter', async () => {
        const request = new NextRequest('http://localhost:3000/api/players/40927904?view=PROFILE');
        const response = await GET(request, { params: { id: '40927904' } });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.view).toBe('PROFILE');
      });

      it('should handle boolean parameters as strings', async () => {
        const request = new NextRequest('http://localhost:3000/api/players/40927904?force=1&includeMatches=1&includeHeroes=1&includeRecent=1');
        const response = await GET(request, { params: { id: '40927904' } });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.options).toEqual({
          includeMatches: true,
          includeHeroes: true,
          includeRecent: true
        });
        expect(mockFetchOpenDotaPlayer).toHaveBeenCalledWith('40927904', true);
      });
    });
  });
}); 