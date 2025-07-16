import { fetchOpenDotaMatch } from '@/lib/api/opendota/matches';
import { OpenDotaMatch } from '@/types/external-apis';

// Mock external dependencies
jest.mock('@/lib/utils/request');

const mockRequest = require('@/lib/utils/request').request as jest.MockedFunction<any>;

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

describe('OpenDota Matches API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequest.mockResolvedValue(mockRawMatch);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('fetchOpenDotaMatch', () => {
    it('should fetch match data successfully', async () => {
      const result = await fetchOpenDotaMatch('8054301932');

      expect(result).toEqual(mockRawMatch);
      expect(mockRequest).toHaveBeenCalledWith(
        'opendota',
        expect.any(Function),
        expect.any(Function),
        expect.stringContaining('mock-data/matches/match-8054301932.json'),
        false,
        60 * 60 * 24 * 14,
        'opendota:match:8054301932'
      );
    });

    it('should handle force refresh parameter', async () => {
      const result = await fetchOpenDotaMatch('8054301932', true);

      expect(result).toEqual(mockRawMatch);
      expect(mockRequest).toHaveBeenCalledWith(
        'opendota',
        expect.any(Function),
        expect.any(Function),
        expect.stringContaining('mock-data/matches/match-8054301932.json'),
        true,
        60 * 60 * 24 * 14,
        'opendota:match:8054301932'
      );
    });

    it('should throw error when request fails', async () => {
      mockRequest.mockRejectedValue(new Error('Failed to fetch match data'));

      await expect(fetchOpenDotaMatch('8054301932')).rejects.toThrow('Failed to fetch match data');
    });

    it('should use correct cache key format', async () => {
      await fetchOpenDotaMatch('123456');

      expect(mockRequest).toHaveBeenCalledWith(
        'opendota',
        expect.any(Function),
        expect.any(Function),
        expect.stringContaining('mock-data/matches/match-123456.json'),
        false,
        60 * 60 * 24 * 14,
        'opendota:match:123456'
      );
    });

    it('should use correct cache TTL', async () => {
      await fetchOpenDotaMatch('8054301932');

      expect(mockRequest).toHaveBeenCalledWith(
        'opendota',
        expect.any(Function),
        expect.any(Function),
        expect.stringContaining('mock-data/matches/match-8054301932.json'),
        false,
        60 * 60 * 24 * 14, // 14 days
        'opendota:match:8054301932'
      );
    });
  });
}); 