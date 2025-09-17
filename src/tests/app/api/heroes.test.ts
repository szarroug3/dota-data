import { NextRequest } from 'next/server';

import { GET } from '@/app/api/heroes/route';
import { fetchOpenDotaHeroes } from '@/lib/api/opendota/heroes';
import { OpenDotaHero } from '@/types/external-apis';

// Mock external dependencies
jest.mock('@/lib/api/opendota/heroes');

const mockFetchOpenDotaHeroes = fetchOpenDotaHeroes as jest.MockedFunction<typeof fetchOpenDotaHeroes>;

// Mock data
const mockHeroesData: OpenDotaHero[] = [
  {
    id: 1,
    name: 'npc_dota_hero_antimage',
    localized_name: 'Anti-Mage',
    primary_attr: 'agi',
    attack_type: 'Melee',
    roles: ['Carry', 'Escape', 'Nuker'],
    legs: 2,
  },
  {
    id: 2,
    name: 'npc_dota_hero_axe',
    localized_name: 'Axe',
    primary_attr: 'str',
    attack_type: 'Melee',
    roles: ['Initiator', 'Durable', 'Disabler', 'Carry'],
    legs: 2,
  },
];

describe('Heroes API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchOpenDotaHeroes.mockResolvedValue(mockHeroesData);
  });

  describe('GET /api/heroes', () => {
    it('should return heroes data successfully', async () => {
      const request = new NextRequest('http://localhost:3000/api/heroes');

      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data).toEqual([
        {
          id: 1,
          name: 'npc_dota_hero_antimage',
          localized_name: 'Anti-Mage',
          primary_attr: 'agi',
          attack_type: 'Melee',
          roles: ['Carry', 'Escape', 'Nuker'],
          legs: 2,
        },
        {
          id: 2,
          name: 'npc_dota_hero_axe',
          localized_name: 'Axe',
          primary_attr: 'str',
          attack_type: 'Melee',
          roles: ['Initiator', 'Durable', 'Disabler', 'Carry'],
          legs: 2,
        },
      ]);
      expect(mockFetchOpenDotaHeroes).toHaveBeenCalledWith(false);
    });

    it('should handle force parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/heroes?force=true');

      await GET(request);

      expect(mockFetchOpenDotaHeroes).toHaveBeenCalledWith(true);
    });

    it('should handle rate limiting errors', async () => {
      mockFetchOpenDotaHeroes.mockRejectedValue(new Error('Rate limited'));

      const request = new NextRequest('http://localhost:3000/api/heroes');

      const response = await GET(request);

      expect(response.status).toBe(429);
      const data = await response.json();
      expect(data.error).toBe('Rate limited by OpenDota API');
      expect(data.status).toBe(429);
      expect(data.details).toBe('Too many requests to OpenDota API. Please try again later.');
    });

    it('should handle invalid heroes data errors', async () => {
      mockFetchOpenDotaHeroes.mockRejectedValue(new Error('Failed to parse heroes data'));

      const request = new NextRequest('http://localhost:3000/api/heroes');

      const response = await GET(request);

      expect(response.status).toBe(422);
      const data = await response.json();
      expect(data.error).toBe('Invalid heroes data');
      expect(data.status).toBe(422);
      expect(data.details).toBe('Heroes data is invalid or corrupted.');
    });

    it('should handle generic API errors', async () => {
      mockFetchOpenDotaHeroes.mockRejectedValue(new Error('Network error'));

      const request = new NextRequest('http://localhost:3000/api/heroes');

      const response = await GET(request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe('Failed to fetch heroes');
      expect(data.status).toBe(500);
      expect(data.details).toBe('Network error');
    });

    it('should handle non-Error exceptions', async () => {
      mockFetchOpenDotaHeroes.mockRejectedValue('String error');

      const request = new NextRequest('http://localhost:3000/api/heroes');

      const response = await GET(request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe('Failed to fetch heroes');
      expect(data.status).toBe(500);
      expect(data.details).toBe('Unknown error occurred');
    });

    it('should handle empty force parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/heroes?force=');

      await GET(request);

      expect(mockFetchOpenDotaHeroes).toHaveBeenCalledWith(false);
    });

    it('should handle false force parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/heroes?force=false');

      await GET(request);

      expect(mockFetchOpenDotaHeroes).toHaveBeenCalledWith(false);
    });

    it('should handle case-insensitive force parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/heroes?force=TRUE');

      await GET(request);

      expect(mockFetchOpenDotaHeroes).toHaveBeenCalledWith(false);
    });
  });
});
