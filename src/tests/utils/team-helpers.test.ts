/**
 * Team Helpers Tests
 * 
 * Tests for the team helper utility functions including team key generation,
 * side determination, player extraction, and data creation.
 */

import type { Match } from '@/types/contexts/match-context-value';
import type { TeamData } from '@/types/contexts/team-context-value';
import type { DotabuffLeague, DotabuffTeam } from '@/types/external-apis';
import {
  createBasicTeamData,
  determineTeamSideFromMatch,
  extractPlayersFromMatchSide,
  generateTeamKey,
  updateTeamPerformance,
  validateActiveTeam
} from '@/utils/team-helpers';

// ============================================================================
// MOCK DATA
// ============================================================================

const mockTeam: DotabuffTeam = {
  id: '12345',
  name: 'Test Team',
  matches: []
};

const mockLeague: DotabuffLeague = {
  id: '67890',
  name: 'Test League'
};

const mockMatch: Match = {
  id: 'match123',
  date: '2022-01-01',
  duration: 1800,
  radiantTeamId: '12345',
  direTeamId: '67890',
  draft: {
    radiantPicks: [],
    direPicks: [],
    radiantBans: [],
    direBans: []
  },
  players: {
    radiant: [
      {
        playerId: 'player1',
        playerName: 'Player 1',
        hero: { id: '1', name: 'Anti-Mage', localizedName: 'Anti-Mage', primaryAttribute: 'agility', attackType: 'melee', roles: ['carry', 'escape'], imageUrl: '/heroes/anti-mage.png' },
        role: 'carry',
        stats: { kills: 5, deaths: 2, assists: 3, lastHits: 100, denies: 5, gpm: 500, xpm: 600, netWorth: 15000, level: 18 },
        items: [],
        heroStats: { damageDealt: 15000, healingDone: 0, towerDamage: 2000 }
      },
      {
        playerId: 'player2',
        playerName: 'Player 2',
        hero: { id: '2', name: 'Axe', localizedName: 'Axe', primaryAttribute: 'strength', attackType: 'melee', roles: ['initiator', 'durable'], imageUrl: '/heroes/axe.png' },
        role: 'offlane',
        stats: { kills: 8, deaths: 4, assists: 12, lastHits: 80, denies: 3, gpm: 450, xpm: 550, netWorth: 12000, level: 16 },
        items: [],
        heroStats: { damageDealt: 18000, healingDone: 0, towerDamage: 1500 }
      }
    ],
    dire: [
      {
        playerId: 'player3',
        playerName: 'Player 3',
        hero: { id: '3', name: 'Crystal Maiden', localizedName: 'Crystal Maiden', primaryAttribute: 'intelligence', attackType: 'ranged', roles: ['support', 'disabler'], imageUrl: '/heroes/crystal-maiden.png' },
        role: 'support',
        stats: { kills: 2, deaths: 6, assists: 15, lastHits: 30, denies: 1, gpm: 300, xpm: 400, netWorth: 8000, level: 14 },
        items: [],
        heroStats: { damageDealt: 8000, healingDone: 5000, towerDamage: 500 }
      },
      {
        playerId: 'player4',
        playerName: 'Player 4',
        hero: { id: '4', name: 'Lina', localizedName: 'Lina', primaryAttribute: 'intelligence', attackType: 'ranged', roles: ['carry', 'support'], imageUrl: '/heroes/lina.png' },
        role: 'mid',
        stats: { kills: 12, deaths: 3, assists: 8, lastHits: 120, denies: 8, gpm: 600, xpm: 700, netWorth: 18000, level: 19 },
        items: [],
        heroStats: { damageDealt: 25000, healingDone: 0, towerDamage: 3000 }
      }
    ]
  },
  statistics: {
    radiantScore: 30,
    direScore: 20,
    goldAdvantage: { times: [], radiantGold: [], direGold: [] },
    experienceAdvantage: { times: [], radiantExperience: [], direExperience: [] }
  },
  events: [],
  result: 'radiant'
};

// ============================================================================
// TESTS
// ============================================================================

describe('Team Helpers', () => {
  describe('generateTeamKey', () => {
    it('should generate a team key from team ID and league ID', () => {
      const result = generateTeamKey('12345', '67890');
      expect(result).toBe('12345-67890');
    });

    it('should handle different team and league IDs', () => {
      const result = generateTeamKey('team123', 'league456');
      expect(result).toBe('team123-league456');
    });

    it('should handle empty strings', () => {
      const result = generateTeamKey('', '');
      expect(result).toBe('-');
    });
  });

  describe('determineTeamSideFromMatch', () => {
    it('should determine radiant side correctly', () => {
      const result = determineTeamSideFromMatch(mockMatch, '12345');
      expect(result).toBe('radiant');
    });

    it('should determine dire side correctly', () => {
      const result = determineTeamSideFromMatch(mockMatch, '67890');
      expect(result).toBe('dire');
    });

    it('should throw error for unknown team ID', () => {
      expect(() => {
        determineTeamSideFromMatch(mockMatch, 'unknown');
      }).toThrow('Could not determine team side for team unknown in match match123');
    });

    it('should throw error for team not in match', () => {
      expect(() => {
        determineTeamSideFromMatch(mockMatch, '99999');
      }).toThrow('Could not determine team side for team 99999 in match match123');
    });
  });

  describe('extractPlayersFromMatchSide', () => {
    it('should extract radiant players correctly', () => {
      const result = extractPlayersFromMatchSide(mockMatch, 'radiant');
      expect(result).toEqual(['player1', 'player2']);
    });

    it('should extract dire players correctly', () => {
      const result = extractPlayersFromMatchSide(mockMatch, 'dire');
      expect(result).toEqual(['player3', 'player4']);
    });

    it('should return empty array for match with no players', () => {
      const emptyMatch: Match = {
        ...mockMatch,
        players: { radiant: [], dire: [] }
      };
      const result = extractPlayersFromMatchSide(emptyMatch, 'radiant');
      expect(result).toEqual([]);
    });
  });

  describe('createBasicTeamData', () => {
    it('should create basic team data structure', () => {
      const processedTeam = { team: mockTeam, league: mockLeague };
      const result = createBasicTeamData(processedTeam);

      expect(result).toEqual({
        team: {
          id: '12345',
          name: 'Test Team',
          isActive: false,
          isLoading: false,
          error: undefined
        },
        league: {
          id: '67890',
          name: 'Test League'
        },
        matches: [],
        players: [],
        performance: {
          totalMatches: 0,
          totalWins: 0,
          totalLosses: 0,
          overallWinRate: 0,
          heroUsage: {
            picks: [],
            bans: [],
            picksAgainst: [],
            bansAgainst: [],
            picksByPlayer: {}
          },
          draftStats: {
            firstPickCount: 0,
            secondPickCount: 0,
            firstPickWinRate: 0,
            secondPickWinRate: 0,
            uniqueHeroesPicked: 0,
            uniqueHeroesBanned: 0,
            mostPickedHero: '',
            mostBannedHero: ''
          },
          currentWinStreak: 0,
          currentLoseStreak: 0,
          averageMatchDuration: 0,
          averageKills: 0,
          averageDeaths: 0,
          averageGold: 0,
          averageExperience: 0
        }
      });
    });

    it('should handle different team and league data', () => {
      const differentTeam: DotabuffTeam = {
        id: '99999',
        name: 'Different Team',
        matches: []
      };
      const differentLeague: DotabuffLeague = {
        id: '11111',
        name: 'Different League'
      };
      const processedTeam = { team: differentTeam, league: differentLeague };
      const result = createBasicTeamData(processedTeam);

      expect(result.team.id).toBe('99999');
      expect(result.team.name).toBe('Different Team');
      expect(result.league.id).toBe('11111');
      expect(result.league.name).toBe('Different League');
    });
  });

  describe('updateTeamPerformance', () => {
    it('should update team performance with matches', () => {
      const baseTeam: TeamData = {
        team: { id: '12345', name: 'Test Team', isActive: false, isLoading: false, error: undefined },
        league: { id: '67890', name: 'Test League' },
        matches: [],
        players: [],
        performance: {
          totalMatches: 0,
          totalWins: 0,
          totalLosses: 0,
          overallWinRate: 0,
          heroUsage: { picks: [], bans: [], picksAgainst: [], bansAgainst: [], picksByPlayer: {} },
          draftStats: { firstPickCount: 0, secondPickCount: 0, firstPickWinRate: 0, secondPickWinRate: 0, uniqueHeroesPicked: 0, uniqueHeroesBanned: 0, mostPickedHero: '', mostBannedHero: '' },
          currentWinStreak: 0,
          currentLoseStreak: 0,
          averageMatchDuration: 0,
          averageKills: 0,
          averageDeaths: 0,
          averageGold: 0,
          averageExperience: 0
        }
      };

      const matchesWithCorrectSides = [
        { matchId: 'match1', side: 'radiant' as const, opponentTeamName: 'Opponent 1' },
        { matchId: 'match2', side: 'dire' as const, opponentTeamName: 'Opponent 2' }
      ];

      const originalTeamData = {
        matches: [
          { matchId: 'match1', result: 'won' },
          { matchId: 'match2', result: 'lost' }
        ]
      };

      const result = updateTeamPerformance(baseTeam, matchesWithCorrectSides, originalTeamData);

      expect(result.matches).toEqual(matchesWithCorrectSides);
      expect(result.performance.totalMatches).toBe(2);
      expect(result.performance.totalWins).toBe(1);
      expect(result.performance.totalLosses).toBe(1);
    });

    it('should handle empty matches array', () => {
      const baseTeam: TeamData = {
        team: { id: '12345', name: 'Test Team', isActive: false, isLoading: false, error: undefined },
        league: { id: '67890', name: 'Test League' },
        matches: [],
        players: [],
        performance: {
          totalMatches: 5,
          totalWins: 3,
          totalLosses: 2,
          overallWinRate: 60,
          heroUsage: { picks: [], bans: [], picksAgainst: [], bansAgainst: [], picksByPlayer: {} },
          draftStats: { firstPickCount: 0, secondPickCount: 0, firstPickWinRate: 0, secondPickWinRate: 0, uniqueHeroesPicked: 0, uniqueHeroesBanned: 0, mostPickedHero: '', mostBannedHero: '' },
          currentWinStreak: 0,
          currentLoseStreak: 0,
          averageMatchDuration: 0,
          averageKills: 0,
          averageDeaths: 0,
          averageGold: 0,
          averageExperience: 0
        }
      };

      const result = updateTeamPerformance(baseTeam, [], { matches: [] });

      expect(result.matches).toEqual([]);
      expect(result.performance.totalMatches).toBe(0);
      expect(result.performance.totalWins).toBe(0);
      expect(result.performance.totalLosses).toBe(0);
    });
  });

  describe('validateActiveTeam', () => {
    it('should return active team when provided', () => {
      const activeTeam = { teamId: '12345', leagueId: '67890' };
      const result = validateActiveTeam(activeTeam);
      expect(result).toEqual(activeTeam);
    });

    it('should throw error when no active team is provided', () => {
      expect(() => {
        validateActiveTeam(null);
      }).toThrow('No active team selected');
    });

    it('should throw error when active team is undefined', () => {
      expect(() => {
        validateActiveTeam(undefined as any);
      }).toThrow('No active team selected');
    });
  });
}); 