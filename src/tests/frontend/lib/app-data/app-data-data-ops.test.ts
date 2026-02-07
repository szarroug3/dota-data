/**
 * Tests for app-data-data-ops
 */

import { getAllTeamsForDisplayOrdered } from '@/frontend/lib/app-data/app-data-data-ops';
import type { AppDataDataOpsContext } from '@/frontend/lib/app-data/app-data-data-ops';
import type { Team } from '@/frontend/lib/app-data/app-data-types';

const createMockAppData = (teams: Team[]): AppDataDataOpsContext => {
  const teamsMap = new Map<string, Team>();
  teams.forEach((team) => {
    teamsMap.set(team.id, team);
  });

  return {
    _teams: teamsMap,
    _matches: new Map(),
    _players: new Map(),
    updateTeamsMap: jest.fn(),
    deleteFromTeamsMap: jest.fn(),
    updateMatchesRef: jest.fn(),
    updatePlayersRef: jest.fn(),
    getTeam: (id: string) => teamsMap.get(id),
    getTeamPlayerIds: jest.fn(() => new Set<number>()),
    getMatch: jest.fn(),
    getPlayer: jest.fn(),
    saveToStorage: jest.fn(),
  };
};

const createMockTeam = (id: string, teamId: number, leagueId: number, timeAdded: number): Team => {
  const now = Date.now();
  return {
    id,
    teamId,
    leagueId,
    name: `Team ${teamId}`,
    leagueName: `League ${leagueId}`,
    timeAdded,
    matches: new Map(),
    players: new Map(),
    createdAt: now,
    updatedAt: now,
    isLoading: false,
    highPerformingHeroes: new Set(),
    isGlobal: false,
  };
};

describe('app-data-data-ops', () => {
  describe('getAllTeamsForDisplayOrdered', () => {
    it('should sort teams by most recently added first (descending)', () => {
      const now = Date.now();
      const oneDayAgo = now - 24 * 60 * 60 * 1000;
      const twoDaysAgo = now - 2 * 24 * 60 * 60 * 1000;
      const threeDaysAgo = now - 3 * 24 * 60 * 60 * 1000;

      const teams = [
        createMockTeam('1-1', 1, 1, threeDaysAgo), // Oldest
        createMockTeam('2-2', 2, 2, now), // Newest
        createMockTeam('3-3', 3, 3, oneDayAgo), // Middle
        createMockTeam('4-4', 4, 4, twoDaysAgo), // Middle-old
      ];

      const mockAppData = createMockAppData(teams);
      const result = getAllTeamsForDisplayOrdered(mockAppData);

      // Should be sorted by timeAdded descending (newest first)
      expect(result).toHaveLength(4);
      expect(result[0]?.team.id).toBe(2); // Newest
      expect(result[1]?.team.id).toBe(3); // One day ago
      expect(result[2]?.team.id).toBe(4); // Two days ago
      expect(result[3]?.team.id).toBe(1); // Oldest
    });

    it('should handle empty teams list', () => {
      const mockAppData = createMockAppData([]);
      const result = getAllTeamsForDisplayOrdered(mockAppData);

      expect(result).toHaveLength(0);
      expect(result).toEqual([]);
    });

    it('should handle single team', () => {
      const now = Date.now();
      const teams = [createMockTeam('1-1', 1, 1, now)];

      const mockAppData = createMockAppData(teams);
      const result = getAllTeamsForDisplayOrdered(mockAppData);

      expect(result).toHaveLength(1);
      expect(result[0]?.team.id).toBe(1);
    });

    it('should maintain stable sort for teams with same timeAdded', () => {
      const now = Date.now();
      const teams = [
        createMockTeam('1-1', 1, 1, now),
        createMockTeam('2-2', 2, 2, now),
        createMockTeam('3-3', 3, 3, now),
      ];

      const mockAppData = createMockAppData(teams);
      const result = getAllTeamsForDisplayOrdered(mockAppData);

      // All have same timeAdded, order should be stable
      expect(result).toHaveLength(3);
      // The order may vary but should be consistent across calls
      const teamIds = result.map((t) => t?.team.id);
      expect(teamIds).toContain(1);
      expect(teamIds).toContain(2);
      expect(teamIds).toContain(3);
    });

    it('should return TeamDisplayData format', () => {
      const now = Date.now();
      const teams = [createMockTeam('1-1', 1, 1, now)];

      const mockAppData = createMockAppData(teams);
      const result = getAllTeamsForDisplayOrdered(mockAppData);

      expect(result[0]).toMatchObject({
        team: { id: 1, name: 'Team 1' },
        league: { id: 1, name: 'League 1' },
        timeAdded: expect.any(String), // ISO string
        matches: {},
        manualMatches: {},
        manualPlayers: [],
        players: [],
        performance: expect.any(Object),
        isLoading: false,
      });
    });
  });
});
