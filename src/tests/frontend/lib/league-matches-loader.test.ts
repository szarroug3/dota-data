/**
 * Tests for league matches loader
 */

import type { LeagueMatchesCache } from '@/frontend/lib/app-data-types';
import { getOrFetchLeagueMatches, processLeagueMatches } from '@/frontend/lib/league-matches-loader';

describe('processLeagueMatches', () => {
  it('should process raw league matches data correctly', () => {
    const rawData = {
      result: {
        matches: [
          {
            match_id: 12345,
            radiant_team_id: 100,
            dire_team_id: 200,
            players: [
              { account_id: 1001, team_number: 0 },
              { account_id: 1002, team_number: 0 },
              { account_id: 2001, team_number: 1 },
              { account_id: 2002, team_number: 1 },
            ],
          },
          {
            match_id: 12346,
            radiant_team_id: 100,
            dire_team_id: 300,
            players: [
              { account_id: 1003, team_number: 0 },
              { account_id: 3001, team_number: 1 },
            ],
          },
        ],
      },
    };

    const result = processLeagueMatches(rawData);

    // Check matches map
    expect(result.matches.size).toBe(2);
    expect(result.matches.get(12345)).toEqual({
      matchId: 12345,
      radiantTeamId: 100,
      direTeamId: 200,
      radiantPlayerIds: [1001, 1002],
      direPlayerIds: [2001, 2002],
    });

    // Check matchIdsByTeam grouping
    expect(result.matchIdsByTeam.get(100)).toEqual([12345, 12346]);
    expect(result.matchIdsByTeam.get(200)).toEqual([12345]);
    expect(result.matchIdsByTeam.get(300)).toEqual([12346]);

    // Check timestamp
    expect(result.fetchedAt).toBeGreaterThan(0);
  });

  it('should handle empty matches array', () => {
    const rawData = {
      result: {
        matches: [],
      },
    };

    const result = processLeagueMatches(rawData);

    expect(result.matches.size).toBe(0);
    expect(result.matchIdsByTeam.size).toBe(0);
  });

  it('should handle missing result or matches', () => {
    const rawData = {};

    const result = processLeagueMatches(rawData);

    expect(result.matches.size).toBe(0);
    expect(result.matchIdsByTeam.size).toBe(0);
  });

  it('should handle matches without team IDs', () => {
    const rawData = {
      result: {
        matches: [
          {
            match_id: 12345,
            players: [{ account_id: 1001, team_number: 0 }],
          },
        ],
      },
    };

    const result = processLeagueMatches(rawData);

    expect(result.matches.size).toBe(1);
    expect(result.matches.get(12345)).toEqual({
      matchId: 12345,
      radiantTeamId: undefined,
      direTeamId: undefined,
      radiantPlayerIds: [1001],
      direPlayerIds: [],
    });
    expect(result.matchIdsByTeam.size).toBe(0);
  });

  it('should handle matches without players', () => {
    const rawData = {
      result: {
        matches: [
          {
            match_id: 12345,
            radiant_team_id: 100,
            dire_team_id: 200,
          },
        ],
      },
    };

    const result = processLeagueMatches(rawData);

    expect(result.matches.get(12345)).toEqual({
      matchId: 12345,
      radiantTeamId: 100,
      direTeamId: 200,
      radiantPlayerIds: [],
      direPlayerIds: [],
    });
  });
});

describe('getOrFetchLeagueMatches', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return cached data if available', async () => {
    const cache = new Map<number, LeagueMatchesCache>();
    const cachedData: LeagueMatchesCache = {
      matches: new Map([[12345, { matchId: 12345, radiantPlayerIds: [], direPlayerIds: [] }]]),
      matchIdsByTeam: new Map([[100, [12345]]]),
      fetchedAt: Date.now(),
    };
    cache.set(17805, cachedData);

    const result = await getOrFetchLeagueMatches(17805, cache);

    expect(result).toBe(cachedData);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('should fetch and cache data if not cached', async () => {
    const cache = new Map<number, LeagueMatchesCache>();
    const mockResponse = {
      result: {
        matches: [
          {
            match_id: 12345,
            radiant_team_id: 100,
            dire_team_id: 200,
            players: [{ account_id: 1001, team_number: 0 }],
          },
        ],
      },
    };

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await getOrFetchLeagueMatches(17805, cache);

    expect(global.fetch).toHaveBeenCalledWith('/api/leagues/17805');
    expect(result).toBeDefined();
    expect(result?.matches.size).toBe(1);
    expect(cache.get(17805)).toBe(result);
  });

  it('should return undefined if fetch fails', async () => {
    const cache = new Map<number, LeagueMatchesCache>();

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    });

    const result = await getOrFetchLeagueMatches(17805, cache);

    expect(result).toBeUndefined();
    expect(cache.size).toBe(0);
  });
});
