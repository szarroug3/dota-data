/**
 * @jest-environment node
 */

import { fetchOpenDotaHeroes } from '@/lib/api/opendota/heroes';
import { request, requestWithRetry } from '@/lib/utils/request';
import { OpenDotaHero } from '@/types/external-apis';

// Mock the request utilities
jest.mock('@/lib/utils/request');

const mockRequest = request as jest.MockedFunction<typeof request>;
const mockRequestWithRetry = requestWithRetry as jest.MockedFunction<typeof requestWithRetry>;

describe('fetchOpenDotaHeroes', () => {
  const mockHeroes: OpenDotaHero[] = [
    {
      id: 1,
      name: 'npc_dota_hero_antimage',
      localized_name: 'Anti-Mage',
      primary_attr: 'agi',
      attack_type: 'Melee',
      roles: ['Carry', 'Escape', 'Nuker'],
      img: '/apps/dota2/images/heroes/antimage_full.png?',
      icon: '/apps/dota2/images/heroes/antimage_icon.png',
      base_health: 200,
      base_mana: 75,
      base_armor: 0,
      base_attack_min: 29,
      base_attack_max: 33,
      move_speed: 310,
      base_attack_time: 1.4,
      attack_point: 0.3,
      attack_range: 150,
      projectile_speed: 0,
      turn_rate: 0.6,
      cm_enabled: true,
      legs: 2,
      day_vision: 1800,
      night_vision: 800,
      hero_id: 1,
      turbo_picks: 0,
      turbo_wins: 0,
      pro_ban: 0,
      pro_win: 0,
      pro_pick: 0,
      "1_pick": 0,
      "1_win": 0,
      "2_pick": 0,
      "2_win": 0,
      "3_pick": 0,
      "3_win": 0,
      "4_pick": 0,
      "4_win": 0,
      "5_pick": 0,
      "5_win": 0,
      "6_pick": 0,
      "6_win": 0,
      "7_pick": 0,
      "7_win": 0,
      "8_pick": 0,
      "8_win": 0,
      null_pick: 0,
      null_win: 0,
    },
    {
      id: 2,
      name: 'npc_dota_hero_axe',
      localized_name: 'Axe',
      primary_attr: 'str',
      attack_type: 'Melee',
      roles: ['Initiator', 'Durable', 'Disabler', 'Jungler'],
      img: '/apps/dota2/images/heroes/axe_full.png?',
      icon: '/apps/dota2/images/heroes/axe_icon.png',
      base_health: 200,
      base_mana: 75,
      base_armor: 0,
      base_attack_min: 25,
      base_attack_max: 27,
      move_speed: 290,
      base_attack_time: 1.7,
      attack_point: 0.5,
      attack_range: 150,
      projectile_speed: 0,
      turn_rate: 0.6,
      cm_enabled: true,
      legs: 2,
      day_vision: 1800,
      night_vision: 800,
      hero_id: 2,
      turbo_picks: 0,
      turbo_wins: 0,
      pro_ban: 0,
      pro_win: 0,
      pro_pick: 0,
      "1_pick": 0,
      "1_win": 0,
      "2_pick": 0,
      "2_win": 0,
      "3_pick": 0,
      "3_win": 0,
      "4_pick": 0,
      "4_win": 0,
      "5_pick": 0,
      "5_win": 0,
      "6_pick": 0,
      "6_win": 0,
      "7_pick": 0,
      "7_win": 0,
      "8_pick": 0,
      "8_win": 0,
      null_pick: 0,
      null_win: 0,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchOpenDotaHeroes', () => {
    it('should fetch and parse heroes data successfully', async () => {
      mockRequest.mockResolvedValue(mockHeroes);

      const result = await fetchOpenDotaHeroes();

      expect(result).toEqual(mockHeroes);
      expect(mockRequest).toHaveBeenCalledWith(
        'opendota',
        expect.any(Function),
        expect.any(Function),
        expect.stringContaining('mock-data/heroes.json'),
        false,
        60 * 60 * 24 * 7, // 7 days
        'opendota:heroes'
      );
    });

    it('should throw error when request fails', async () => {
      mockRequest.mockResolvedValue(null);

      await expect(fetchOpenDotaHeroes()).rejects.toThrow(
        'Failed to fetch heroes data'
      );
    });

    it('should use force parameter when provided', async () => {
      mockRequest.mockResolvedValue(mockHeroes);

      await fetchOpenDotaHeroes(true);

      expect(mockRequest).toHaveBeenCalledWith(
        'opendota',
        expect.any(Function),
        expect.any(Function),
        expect.stringContaining('mock-data/heroes.json'),
        true, // force parameter
        60 * 60 * 24 * 7,
        'opendota:heroes'
      );
    });

    it('should handle empty heroes array', async () => {
      mockRequest.mockResolvedValue([]);

      const result = await fetchOpenDotaHeroes();

      expect(result).toEqual([]);
    });
  });

  describe('fetchHeroesFromOpenDota', () => {
    it('should fetch JSON from OpenDota API', async () => {
      const mockResponse = {
        ok: true,
        text: jest.fn().mockResolvedValue(JSON.stringify(mockHeroes))
      };

      mockRequestWithRetry.mockResolvedValue(mockResponse);

      mockRequest.mockImplementation(async (service, fetcher, parser) => {
        const data = await fetcher();
        return parser(data);
      });

      await fetchOpenDotaHeroes();

      expect(mockRequestWithRetry).toHaveBeenCalledWith(
        'GET',
        'https://api.opendota.com/api/heroes'
      );
    });

    it('should throw error when API response is not ok', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      };

      mockRequestWithRetry.mockResolvedValue(mockResponse);

      mockRequest.mockImplementation(async (service, fetcher, parser) => {
        await fetcher();
        return null;
      });

      await expect(fetchOpenDotaHeroes()).rejects.toThrow(
        'OpenDota API error: 500 Internal Server Error'
      );
    });

    it('should throw error when fetch fails', async () => {
      mockRequestWithRetry.mockRejectedValue(new Error('Network error'));

      mockRequest.mockImplementation(async (service, fetcher, parser) => {
        await fetcher();
        return null;
      });

      await expect(fetchOpenDotaHeroes()).rejects.toThrow(
        'Failed to fetch heroes from OpenDota: Error: Network error'
      );
    });

    it('should handle API timeout', async () => {
      mockRequestWithRetry.mockRejectedValue(new Error('Request timeout'));

      mockRequest.mockImplementation(async (service, fetcher, parser) => {
        await fetcher();
        return null;
      });

      await expect(fetchOpenDotaHeroes()).rejects.toThrow(
        'Failed to fetch heroes from OpenDota: Error: Request timeout'
      );
    });
  });

  describe('parseOpenDotaHeroes', () => {
    it('should parse valid JSON heroes data', async () => {
      const jsonData = JSON.stringify(mockHeroes);

      mockRequest.mockImplementation(async (service, fetcher, parser) => {
        return parser(jsonData);
      });

      const result = await fetchOpenDotaHeroes();

      expect(result).toEqual(mockHeroes);
    });

    it('should throw error when JSON is invalid', async () => {
      const invalidJson = '{ invalid json }';

      mockRequest.mockImplementation(async (service, fetcher, parser) => {
        return parser(invalidJson);
      });

      await expect(fetchOpenDotaHeroes()).rejects.toThrow(
        'Failed to parse OpenDota heroes data'
      );
    });

    it('should handle JSON that is not an array', async () => {
      const nonArrayJson = JSON.stringify({ heroes: mockHeroes });

      mockRequest.mockImplementation(async (service, fetcher, parser) => {
        return parser(nonArrayJson);
      });

      const result = await fetchOpenDotaHeroes();

      expect(result).toEqual({ heroes: mockHeroes });
    });

    it('should handle malformed hero data', async () => {
      const malformedHeroes = [
        { id: 1, name: 'hero1' }, // Missing required fields
        { id: 2, name: 'hero2', localized_name: 'Hero 2' } // Partial data
      ];

      mockRequest.mockImplementation(async (service, fetcher, parser) => {
        return parser(JSON.stringify(malformedHeroes));
      });

      const result = await fetchOpenDotaHeroes();

      expect(result).toEqual(malformedHeroes);
    });

    it('should handle empty JSON array', async () => {
      mockRequest.mockImplementation(async (service, fetcher, parser) => {
        return parser('[]');
      });

      const result = await fetchOpenDotaHeroes();

      expect(result).toEqual([]);
    });

    it('should handle null JSON response', async () => {
      mockRequest.mockImplementation(async (service, fetcher, parser) => {
        return parser('null');
      });

      await expect(fetchOpenDotaHeroes()).rejects.toThrow(
        'Failed to fetch heroes data'
      );
    });

    it('should handle undefined JSON response', async () => {
      mockRequest.mockImplementation(async (service, fetcher, parser) => {
        return parser('undefined');
      });

      await expect(fetchOpenDotaHeroes()).rejects.toThrow(
        'Failed to fetch heroes data'
      );
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete flow with real API response', async () => {
      const apiResponse = {
        ok: true,
        text: jest.fn().mockResolvedValue(JSON.stringify(mockHeroes))
      };

      mockRequestWithRetry.mockResolvedValue(apiResponse);
      mockRequest.mockImplementation(async (service, fetcher, parser) => {
        const data = await fetcher();
        return parser(data);
      });

      const result = await fetchOpenDotaHeroes();

      expect(result).toEqual(mockHeroes);
      expect(mockRequestWithRetry).toHaveBeenCalledWith(
        'GET',
        'https://api.opendota.com/api/heroes'
      );
    });

    it('should handle force refresh scenario', async () => {
      const apiResponse = {
        ok: true,
        text: jest.fn().mockResolvedValue(JSON.stringify(mockHeroes))
      };

      mockRequestWithRetry.mockResolvedValue(apiResponse);
      mockRequest.mockImplementation(async (service, fetcher, parser) => {
        const data = await fetcher();
        return parser(data);
      });

      const result = await fetchOpenDotaHeroes(true);

      expect(result).toEqual(mockHeroes);
      expect(mockRequest).toHaveBeenCalledWith(
        'opendota',
        expect.any(Function),
        expect.any(Function),
        expect.stringContaining('mock-data/heroes.json'),
        true,
        60 * 60 * 24 * 7,
        'opendota:heroes'
      );
    });

    it('should handle API rate limiting', async () => {
      const rateLimitResponse = {
        ok: false,
        status: 429,
        statusText: 'Too Many Requests'
      };

      mockRequestWithRetry.mockResolvedValue(rateLimitResponse);

      mockRequest.mockImplementation(async (service, fetcher, parser) => {
        await fetcher();
        return null;
      });

      await expect(fetchOpenDotaHeroes()).rejects.toThrow(
        'OpenDota API error: 429 Too Many Requests'
      );
    });

    it('should handle API authentication error', async () => {
      const authErrorResponse = {
        ok: false,
        status: 401,
        statusText: 'Unauthorized'
      };

      mockRequestWithRetry.mockResolvedValue(authErrorResponse);

      mockRequest.mockImplementation(async (service, fetcher, parser) => {
        await fetcher();
        return null;
      });

      await expect(fetchOpenDotaHeroes()).rejects.toThrow(
        'OpenDota API error: 401 Unauthorized'
      );
    });
  });
}); 