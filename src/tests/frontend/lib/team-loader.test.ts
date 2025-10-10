/**
 * Tests for team loader utilities
 */

import { fetchTeamData, getTeamMatchIdsFromCache } from '@/frontend/lib/team-loader';

describe('team-loader', () => {
  describe('fetchTeamData', () => {
    beforeEach(() => {
      global.fetch = jest.fn();
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should fetch team data successfully', async () => {
      const mockTeamData = { name: 'Test Team' };
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockTeamData,
      });

      const result = await fetchTeamData(12345);

      expect(global.fetch).toHaveBeenCalledWith('/api/teams/12345');
      expect(result).toEqual(mockTeamData);
    });

    it('should throw error on failed fetch', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      await expect(fetchTeamData(12345)).rejects.toThrow('Failed to fetch team: 404 Not Found');
    });
  });

  describe('getTeamMatchIdsFromCache', () => {
    it('should return match IDs for a team', () => {
      const leagueCache = {
        matchIdsByTeam: new Map([
          [100, [1, 2, 3]],
          [200, [4, 5]],
        ]),
      };

      const result = getTeamMatchIdsFromCache(leagueCache, 100);

      expect(result).toEqual([1, 2, 3]);
    });

    it('should return empty array if team not found', () => {
      const leagueCache = {
        matchIdsByTeam: new Map([[100, [1, 2, 3]]]),
      };

      const result = getTeamMatchIdsFromCache(leagueCache, 999);

      expect(result).toEqual([]);
    });

    it('should return empty array if cache is undefined', () => {
      const result = getTeamMatchIdsFromCache(undefined, 100);

      expect(result).toEqual([]);
    });
  });
});
