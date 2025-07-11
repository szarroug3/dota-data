import { NextRequest } from 'next/server';

import { GET } from '@/app/api/teams/[id]/route';
import { fetchDotabuffTeam } from '@/lib/api/dotabuff/teams';
import { processTeam } from '@/lib/services/team-processor';

// Mock external dependencies
jest.mock('@/lib/api/dotabuff/teams');
jest.mock('@/lib/services/team-processor');

const mockFetchDotabuffTeam = fetchDotabuffTeam as jest.MockedFunction<typeof fetchDotabuffTeam>;
const mockProcessTeam = processTeam as jest.MockedFunction<typeof processTeam>;

// Mock data
const mockRawTeam = {
  teamName: 'Team Spirit',
  matches: {
    '16435': {
      match_id: 8054301932,
      start_time: 1640995200,
      duration: 2400,
      radiant_name: 'Team Spirit',
      dire_name: 'Team Liquid',
      radiant_win: true,
      radiant_score: 25,
      dire_score: 20,
      leagueid: 16435
    }
  }
};

const mockProcessedTeam = {
  teamId: 9517508,
  name: 'Team Spirit',
  tag: 'TS',
  logoUrl: 'https://example.com/logo.png',
  sponsor: 'Sponsor Name',
  countryCode: 'RU',
  websiteUrl: 'https://teamspirit.com',
  profile: {
    establishedDate: '2015',
    region: 'Europe',
    primaryLanguage: 'Russian',
    socialMedia: {
      twitter: 'https://twitter.com/teamspirit',
      facebook: 'https://facebook.com/teamspirit',
      instagram: 'https://instagram.com/teamspirit'
    },
    sponsorships: [
      {
        name: 'Sponsor Name',
        type: 'main' as const,
        logoUrl: 'https://example.com/sponsor-logo.png'
      }
    ],
    description: 'Professional Dota 2 team'
  },
  statistics: {
    totalMatches: 150,
    wins: 95,
    losses: 55,
    winRate: 0.633,
    rating: 1850,
    lastMatchTime: 1640995200,
    averageMatchDuration: 2400,
    totalPrizeMoney: 5000000,
    gamesPlayed: {
      official: 100,
      scrimmage: 30,
      tournament: 20
    },
    streaks: {
      currentWinStreak: 3,
      currentLossStreak: 1,
      longestWinStreak: 8,
      longestLossStreak: 2
    },
    formFactor: {
      last10Games: {
        wins: 7,
        losses: 3,
        winRate: 0.7
      },
      last30Days: {
        wins: 20,
        losses: 10,
        winRate: 0.667
      }
    }
  },
  performance: {
    skillLevel: 'tier1' as const,
    consistency: 85,
    versatility: 70,
    teamwork: 90,
    laning: 80,
    midGame: 85,
    lateGame: 90,
    adaptability: 75,
    clutchFactor: 80,
    improvement: 15,
    strengths: ['teamwork', 'late_game'],
    weaknesses: ['early_game'],
    playStyle: {
      aggressive: 70,
      defensive: 30,
      strategic: 80,
      chaotic: 20
    }
  },
  roster: {
    activeRoster: [
      {
        accountId: 123456,
        name: 'Player1',
        position: 1,
        joinDate: '2023-01-01',
        gamesPlayed: 100,
        wins: 65,
        winRate: 0.65,
        role: 'carry' as const,
        isActive: true,
        isCaptain: false,
        performance: {
          averageKDA: 3.2,
          averageGPM: 650,
          averageXPM: 750,
          impactScore: 85
        }
      }
    ],
    formerPlayers: [
      {
        accountId: 654321,
        name: 'FormerPlayer',
        position: 2,
        joinDate: '2022-01-01',
        leaveDate: '2023-01-01',
        gamesPlayed: 50,
        wins: 30,
        winRate: 0.6,
        role: 'support' as const
      }
    ],
    coaching: [
      {
        name: 'Coach1',
        role: 'head_coach' as const,
        joinDate: '2023-01-01',
        isActive: true
      }
    ],
    rosterStability: 85,
    averagePlayerTenure: 365
  },
  matches: {
    recentMatches: [
      {
        matchId: 8054301932,
        opponent: 'Team Liquid',
        result: 'win' as const,
        duration: 2400,
        startTime: 1640995200,
        leagueId: 16435,
        leagueName: 'Test League',
        isOfficial: true,
        radiantWin: true,
        radiantScore: 25,
        direScore: 20,
        teamSide: 'radiant' as const,
        performance: {
          avgKDA: 3.5,
          avgGPM: 650,
          avgXPM: 750,
          objectives: 8
        }
      }
    ],
    upcomingMatches: [
      {
        opponent: 'Team Secret',
        scheduledTime: 1640995200,
        leagueId: 16435,
        leagueName: 'Test League',
        isOfficial: true,
        importance: 'high' as const
      }
    ],
    headToHead: [
      {
        opponent: 'Team Liquid',
        totalGames: 10,
        wins: 6,
        losses: 4,
        winRate: 0.6,
        lastMatch: 1640995200
      }
    ],
    tournamentPerformance: [
      {
        leagueId: 16435,
        leagueName: 'Test League',
        placement: 1,
        totalTeams: 16,
        gamesPlayed: 15,
        wins: 12,
        losses: 3,
        winRate: 0.8,
        prizeMoney: 1000000,
        isOngoing: false
      }
    ]
  },
  achievements: {
    majorTournaments: [
      {
        name: 'Test Tournament',
        placement: 1,
        totalTeams: 16,
        year: 2023,
        prizeMoney: 1000000,
        isFirstPlace: true
      }
    ],
    minorTournaments: [
      {
        name: 'Minor Tournament',
        placement: 2,
        totalTeams: 8,
        year: 2023,
        prizeMoney: 500000,
        isFirstPlace: false
      }
    ],
    totalTournaments: 20,
    totalWins: 15,
    totalPrizeMoney: 5000000,
    rankings: {
      currentWorldRank: 5,
      currentRegionalRank: 2,
      peakWorldRank: 1,
      peakRegionalRank: 1
    },
    milestones: [
      {
        description: 'First Major Tournament Win',
        date: '2023-12-01',
        type: 'tournament' as const
      }
    ]
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

describe('Teams API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchDotabuffTeam.mockResolvedValue(mockRawTeam);
    mockProcessTeam.mockReturnValue(mockProcessedTeam);
  });

  describe('GET /api/teams/{id}', () => {
    describe('Success Cases', () => {
      it('should return team data with default parameters', async () => {
        const request = new NextRequest('http://localhost:3000/api/teams/9517508');
        const response = await GET(request, { params: { id: '9517508' } });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.data).toEqual(mockProcessedTeam);
        expect(data.timestamp).toBeDefined();
        expect(data.view).toBe('full');
        expect(data.options).toEqual({
          includeMatches: false,
          includeRoster: false
        });

        expect(mockFetchDotabuffTeam).toHaveBeenCalledWith('9517508', false);
        expect(mockProcessTeam).toHaveBeenCalledWith({
          dotabuffTeam: mockRawTeam,
          teamId: 9517508
        });
      });

      it('should handle force refresh parameter', async () => {
        const request = new NextRequest('http://localhost:3000/api/teams/9517508?force=true');
        const response = await GET(request, { params: { id: '9517508' } });

        expect(response.status).toBe(200);
        expect(mockFetchDotabuffTeam).toHaveBeenCalledWith('9517508', true);
      });

      it('should handle summary view parameter', async () => {
        const request = new NextRequest('http://localhost:3000/api/teams/9517508?view=summary');
        const response = await GET(request, { params: { id: '9517508' } });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.view).toBe('summary');
        expect(data.data).toEqual(mockProcessedTeam);
      });

      it('should handle includeMatches parameter', async () => {
        const request = new NextRequest('http://localhost:3000/api/teams/9517508?includeMatches=true');
        const response = await GET(request, { params: { id: '9517508' } });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.options.includeMatches).toBe(true);
      });

      it('should handle includeRoster parameter', async () => {
        const request = new NextRequest('http://localhost:3000/api/teams/9517508?includeRoster=true');
        const response = await GET(request, { params: { id: '9517508' } });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.options.includeRoster).toBe(true);
      });

      it('should handle multiple query parameters', async () => {
        const request = new NextRequest('http://localhost:3000/api/teams/9517508?force=true&view=summary&includeMatches=true&includeRoster=true');
        const response = await GET(request, { params: { id: '9517508' } });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.view).toBe('summary');
        expect(data.options).toEqual({
          includeMatches: true,
          includeRoster: true
        });
        expect(mockFetchDotabuffTeam).toHaveBeenCalledWith('9517508', true);
      });
    });

    describe('Error Cases', () => {
      it('should handle invalid team ID', async () => {
        const request = new NextRequest('http://localhost:3000/api/teams/invalid');
        const response = await GET(request, { params: { id: 'invalid' } });
        const data = await response.json() as ApiErrorResponse;

        expect(response.status).toBe(400);
        expect(data.error).toBe('Invalid team ID');
        expect(data.status).toBe(400);
        expect(data.details).toBe('Team ID must be a valid number');
      });

      it('should handle empty team ID', async () => {
        const request = new NextRequest('http://localhost:3000/api/teams/');
        const response = await GET(request, { params: { id: '' } });
        const data = await response.json() as ApiErrorResponse;

        expect(response.status).toBe(400);
        expect(data.error).toBe('Invalid team ID');
        expect(data.status).toBe(400);
        expect(data.details).toBe('Team ID must be a valid number');
      });

      it('should handle rate limiting errors', async () => {
        mockFetchDotabuffTeam.mockRejectedValue(new Error('Rate limited by Dotabuff API'));
        
        const request = new NextRequest('http://localhost:3000/api/teams/9517508');
        const response = await GET(request, { params: { id: '9517508' } });
        const data = await response.json() as ApiErrorResponse;

        expect(response.status).toBe(429);
        expect(data.error).toBe('Rate limited by Dotabuff API');
        expect(data.status).toBe(429);
        expect(data.details).toBe('Too many requests to Dotabuff API. Please try again later.');
      });

      it('should handle data not found errors', async () => {
        mockFetchDotabuffTeam.mockRejectedValue(new Error('Failed to load Dotabuff team from mock data'));
        
        const request = new NextRequest('http://localhost:3000/api/teams/999999');
        const response = await GET(request, { params: { id: '999999' } });
        const data = await response.json() as ApiErrorResponse;

        expect(response.status).toBe(404);
        expect(data.error).toBe('Data Not Found');
        expect(data.status).toBe(404);
        expect(data.details).toBe('Team with ID 999999 could not be found.');
      });

      it('should handle invalid team data errors', async () => {
        mockProcessTeam.mockImplementation(() => {
          throw new Error('Invalid team data');
        });
        
        const request = new NextRequest('http://localhost:3000/api/teams/9517508');
        const response = await GET(request, { params: { id: '9517508' } });
        const data = await response.json() as ApiErrorResponse;

        expect(response.status).toBe(422);
        expect(data.error).toBe('Invalid team data');
        expect(data.status).toBe(422);
        expect(data.details).toBe('Team data is invalid or corrupted.');
      });

      it('should handle processing errors', async () => {
        mockProcessTeam.mockImplementation(() => {
          throw new Error('Processing failed');
        });
        
        const request = new NextRequest('http://localhost:3000/api/teams/9517508');
        const response = await GET(request, { params: { id: '9517508' } });
        const data = await response.json() as ApiErrorResponse;

        expect(response.status).toBe(500);
        expect(data.error).toBe('Failed to process team');
        expect(data.status).toBe(500);
        expect(data.details).toBe('Processing failed');
      });

      it('should handle unexpected errors', async () => {
        mockFetchDotabuffTeam.mockRejectedValue(new Error('Unexpected error'));
        
        const request = new NextRequest('http://localhost:3000/api/teams/9517508');
        const response = await GET(request, { params: { id: '9517508' } });
        const data = await response.json() as ApiErrorResponse;

        expect(response.status).toBe(500);
        expect(data.error).toBe('Failed to process team');
        expect(data.status).toBe(500);
        expect(data.details).toBe('Unexpected error');
      });

      it('should handle non-Error exceptions', async () => {
        mockFetchDotabuffTeam.mockRejectedValue('String error');
        
        const request = new NextRequest('http://localhost:3000/api/teams/9517508');
        const response = await GET(request, { params: { id: '9517508' } });
        const data = await response.json() as ApiErrorResponse;

        expect(response.status).toBe(500);
        expect(data.error).toBe('Failed to process team');
        expect(data.status).toBe(500);
        expect(data.details).toBe('Unknown error occurred');
      });
    });

    describe('Edge Cases', () => {
      it('should handle numeric team ID as string', async () => {
        const request = new NextRequest('http://localhost:3000/api/teams/9517508');
        const response = await GET(request, { params: { id: '9517508' } });

        expect(response.status).toBe(200);
        expect(mockFetchDotabuffTeam).toHaveBeenCalledWith('9517508', false);
      });

      it('should handle case insensitive view parameter', async () => {
        const request = new NextRequest('http://localhost:3000/api/teams/9517508?view=SUMMARY');
        const response = await GET(request, { params: { id: '9517508' } });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.view).toBe('SUMMARY');
      });

      it('should handle boolean parameters as strings', async () => {
        const request = new NextRequest('http://localhost:3000/api/teams/9517508?force=1&includeMatches=1&includeRoster=1');
        const response = await GET(request, { params: { id: '9517508' } });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.options).toEqual({
          includeMatches: true,
          includeRoster: true
        });
        expect(mockFetchDotabuffTeam).toHaveBeenCalledWith('9517508', true);
      });
    });
  });
}); 