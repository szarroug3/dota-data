import { NextRequest } from 'next/server';

import { GET } from '@/app/api/players/[id]/route';
import { fetchOpenDotaPlayer } from '@/lib/api/opendota/players';
import { OpenDotaPlayerComprehensive } from '@/types/external-apis';

// Mock external dependencies
jest.mock('@/lib/api/opendota/players');

const mockFetchOpenDotaPlayer = fetchOpenDotaPlayer as jest.MockedFunction<typeof fetchOpenDotaPlayer>;

// Mock data
const mockComprehensivePlayerData: OpenDotaPlayerComprehensive = {
  profile: {
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
      is_subscriber: false,
    },
    rank_tier: 80,
    leaderboard_rank: 4925,
  },
  counts: {
    leaver_status: { '0': { games: 100, win: 60 } },
    game_mode: { '22': { games: 80, win: 50 } },
    lobby_type: { '7': { games: 70, win: 40 } },
    lane_role: { '1': { games: 60, win: 30 } },
    region: { '2': { games: 50, win: 25 } },
    patch: { '25': { games: 40, win: 20 } },
  },
  heroes: [
    {
      hero_id: 1,
      last_played: 1640995200,
      games: 50,
      win: 30,
      with_games: 60,
      with_win: 35,
      against_games: 70,
      against_win: 40,
    },
  ],
  rankings: [
    {
      hero_id: 1,
      score: 7000.0,
      percent_rank: 0.95,
      card: 1000000,
    },
  ],
  ratings: [
    {
      account_id: 40927904,
      match_id: 123456789,
      solo_competitive_rank: 5000,
      competitive_rank: null,
      time: '2024-01-01T00:00:00.000Z',
    },
  ],
  recentMatches: [
    {
      match_id: 123456789,
      player_slot: 0,
      radiant_win: true,
      hero_id: 1,
      start_time: 1640995200,
      duration: 2400,
      game_mode: 22,
      lobby_type: 7,
      version: 1,
      kills: 10,
      deaths: 5,
      assists: 15,
      average_rank: 80,
      leaver_status: 0,
      party_size: 1,
      hero_variant: null,
    },
  ],
  totals: {
    np: 1000,
    fantasy: 500,
    cosmetic: 200,
    all_time: 2000,
    ranked: 1500,
    turbo: 300,
    matched: 1800,
  },
  wl: {
    win: 60,
    lose: 40,
  },
  wardMap: {
    obs: {
      '80': {
        '152': 10,
        '154': 5,
      },
    },
    sen: {
      '80': {
        '152': 8,
        '154': 3,
      },
    },
  },
};

describe('Players API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchOpenDotaPlayer.mockResolvedValue(mockComprehensivePlayerData);
  });

  describe('GET /api/players/[id]', () => {
    it('should return comprehensive player data successfully', async () => {
      const request = new NextRequest('http://localhost:3000/api/players/40927904');
      const params = Promise.resolve({ id: '40927904' });

      const response = await GET(request, { params });

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data).toEqual(mockComprehensivePlayerData);
      expect(mockFetchOpenDotaPlayer).toHaveBeenCalledWith('40927904', false);
    });

    it('should handle force parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/players/40927904?force=true');
      const params = Promise.resolve({ id: '40927904' });

      await GET(request, { params });

      expect(mockFetchOpenDotaPlayer).toHaveBeenCalledWith('40927904', true);
    });

    it('should handle API errors gracefully', async () => {
      mockFetchOpenDotaPlayer.mockRejectedValue(new Error('Player not found'));

      const request = new NextRequest('http://localhost:3000/api/players/999999');
      const params = Promise.resolve({ id: '999999' });

      const response = await GET(request, { params });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBe('Data Not Found');
    });

    it('should handle rate limiting errors', async () => {
      mockFetchOpenDotaPlayer.mockRejectedValue(new Error('Rate limited'));

      const request = new NextRequest('http://localhost:3000/api/players/40927904');
      const params = Promise.resolve({ id: '40927904' });

      const response = await GET(request, { params });

      expect(response.status).toBe(429);
      const data = await response.json();
      expect(data.error).toBe('Rate limited by OpenDota API');
    });

    it('should handle invalid player ID', async () => {
      // Mock the API to fail for invalid player IDs
      mockFetchOpenDotaPlayer.mockRejectedValue(new Error('Player not found'));

      const request = new NextRequest('http://localhost:3000/api/players/invalid');
      const params = Promise.resolve({ id: 'invalid' });

      const response = await GET(request, { params });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBe('Data Not Found');
    });

    it('should handle network errors', async () => {
      mockFetchOpenDotaPlayer.mockRejectedValue(new Error('Network error'));

      const request = new NextRequest('http://localhost:3000/api/players/40927904');
      const params = Promise.resolve({ id: '40927904' });

      const response = await GET(request, { params });

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe('Failed to fetch player');
    });
  });
});
