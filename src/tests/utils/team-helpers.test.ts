/**
 * Team Helpers Tests
 * 
 * Tests for the team helper utility functions including team key generation,
 * side determination, player extraction, and data creation.
 */

import type { Match } from '@/types/contexts/match-context-value';
import type { TeamData, TeamMatchParticipation } from '@/types/contexts/team-context-value';
import {
  determineTeamSideFromMatch,
  extractPlayersFromMatchSide,
  generateTeamKey,
  updateTeamPerformance,
  validateActiveTeam
} from '@/utils/team-helpers';

// ============================================================================
// MOCK DATA
// ============================================================================

type MatchWithTeamIds = Match & { radiantTeamId?: number; direTeamId?: number };
const mockMatch: MatchWithTeamIds = {
  id: 123,
  date: '2024-01-01T00:00:00.000Z',
  duration: 1800,
  radiantTeamId: 12345,
  direTeamId: 67890,
  radiant: {
    id: 12345,
    name: 'Radiant Team'
  },
  dire: {
    id: 67890,
    name: 'Dire Team'
  },
  draft: {
    radiantPicks: [],
    direPicks: [],
    radiantBans: [],
    direBans: []
  },
  players: {
    radiant: [
      {
        accountId: 111111111,
        playerName: 'Player 1',
        hero: { id: '1', name: 'Anti-Mage', localizedName: 'Anti-Mage', primaryAttribute: 'agility', attackType: 'melee', roles: ['carry', 'escape'], imageUrl: '/heroes/anti-mage.png' },
        role: 'Carry',
        stats: {
          kills: 10,
          deaths: 2,
          assists: 8,
          lastHits: 200,
          denies: 20,
          gpm: 600,
          xpm: 500,
          netWorth: 25000,
          level: 25
        },
        items: [],
        heroStats: {
          damageDealt: 15000,
          healingDone: 0,
          towerDamage: 2000
        }
      },
      {
        accountId: 222222222,
        playerName: 'Player 2',
        hero: { id: '2', name: 'Axe', localizedName: 'Axe', primaryAttribute: 'strength', attackType: 'melee', roles: ['initiator', 'durable'], imageUrl: '/heroes/axe.png' },
        role: 'Support',
        stats: {
          kills: 2,
          deaths: 8,
          assists: 15,
          lastHits: 50,
          denies: 5,
          gpm: 300,
          xpm: 400,
          netWorth: 12000,
          level: 20
        },
        items: [],
        heroStats: {
          damageDealt: 8000,
          healingDone: 5000,
          towerDamage: 500
        }
      },
      {
        accountId: 333333333,
        playerName: 'Player 3',
        hero: { id: '3', name: 'Crystal Maiden', localizedName: 'Crystal Maiden', primaryAttribute: 'intelligence', attackType: 'ranged', roles: ['support', 'disabler'], imageUrl: '/heroes/crystal-maiden.png' },
        role: 'Mid',
        stats: {
          kills: 15,
          deaths: 5,
          assists: 10,
          lastHits: 150,
          denies: 15,
          gpm: 500,
          xpm: 600,
          netWorth: 20000,
          level: 24
        },
        items: [],
        heroStats: {
          damageDealt: 20000,
          healingDone: 0,
          towerDamage: 1000
        }
      },
      {
        accountId: 444444444,
        playerName: 'Player 4',
        hero: { id: '4', name: 'Lina', localizedName: 'Lina', primaryAttribute: 'intelligence', attackType: 'ranged', roles: ['carry', 'support'], imageUrl: '/heroes/lina.png' },
        role: 'Offlane',
        stats: {
          kills: 8,
          deaths: 6,
          assists: 12,
          lastHits: 120,
          denies: 10,
          gpm: 450,
          xpm: 480,
          netWorth: 18000,
          level: 22
        },
        items: [],
        heroStats: {
          damageDealt: 12000,
          healingDone: 0,
          towerDamage: 800
        }
      },
      {
        accountId: 555555555,
        playerName: 'Player 5',
        hero: { id: '5', name: 'Lion', localizedName: 'Lion', primaryAttribute: 'intelligence', attackType: 'ranged', roles: ['support', 'disabler'], imageUrl: '/heroes/lion.png' },
        role: 'Support',
        stats: {
          kills: 1,
          deaths: 10,
          assists: 18,
          lastHits: 30,
          denies: 3,
          gpm: 250,
          xpm: 350,
          netWorth: 8000,
          level: 18
        },
        items: [],
        heroStats: {
          damageDealt: 6000,
          healingDone: 8000,
          towerDamage: 300
        }
      }
    ],
    dire: [
      {
        accountId: 666666666,
        playerName: 'Player 6',
        hero: { id: '6', name: 'Phantom Assassin', localizedName: 'Phantom Assassin', primaryAttribute: 'agility', attackType: 'melee', roles: ['carry', 'escape'], imageUrl: '/heroes/phantom-assassin.png' },
        role: 'Carry',
        stats: {
          kills: 12,
          deaths: 4,
          assists: 6,
          lastHits: 180,
          denies: 18,
          gpm: 550,
          xpm: 480,
          netWorth: 22000,
          level: 23
        },
        items: [],
        heroStats: {
          damageDealt: 16000,
          healingDone: 0,
          towerDamage: 1500
        }
      },
      {
        accountId: 777777777,
        playerName: 'Player 7',
        hero: { id: '7', name: 'Witch Doctor', localizedName: 'Witch Doctor', primaryAttribute: 'intelligence', attackType: 'ranged', roles: ['support', 'disabler'], imageUrl: '/heroes/witch-doctor.png' },
        role: 'Support',
        stats: {
          kills: 3,
          deaths: 9,
          assists: 14,
          lastHits: 40,
          denies: 4,
          gpm: 280,
          xpm: 380,
          netWorth: 10000,
          level: 19
        },
        items: [],
        heroStats: {
          damageDealt: 7000,
          healingDone: 6000,
          towerDamage: 400
        }
      },
      {
        accountId: 888888888,
        playerName: 'Player 8',
        hero: { id: '8', name: 'Storm Spirit', localizedName: 'Storm Spirit', primaryAttribute: 'intelligence', attackType: 'ranged', roles: ['carry', 'escape'], imageUrl: '/heroes/storm-spirit.png' },
        role: 'Mid',
        stats: {
          kills: 18,
          deaths: 7,
          assists: 8,
          lastHits: 160,
          denies: 12,
          gpm: 520,
          xpm: 580,
          netWorth: 21000,
          level: 25
        },
        items: [],
        heroStats: {
          damageDealt: 22000,
          healingDone: 0,
          towerDamage: 1200
        }
      },
      {
        accountId: 999999999,
        playerName: 'Player 9',
        hero: { id: '9', name: 'Tidehunter', localizedName: 'Tidehunter', primaryAttribute: 'strength', attackType: 'melee', roles: ['initiator', 'durable'], imageUrl: '/heroes/tidehunter.png' },
        role: 'Offlane',
        stats: {
          kills: 6,
          deaths: 8,
          assists: 11,
          lastHits: 100,
          denies: 8,
          gpm: 420,
          xpm: 450,
          netWorth: 16000,
          level: 21
        },
        items: [],
        heroStats: {
          damageDealt: 11000,
          healingDone: 0,
          towerDamage: 600
        }
      },
      {
        accountId: 101010101,
        playerName: 'Player 10',
        hero: { id: '10', name: 'Shadow Shaman', localizedName: 'Shadow Shaman', primaryAttribute: 'intelligence', attackType: 'ranged', roles: ['support', 'disabler'], imageUrl: '/heroes/shadow-shaman.png' },
        role: 'Support',
        stats: {
          kills: 2,
          deaths: 12,
          assists: 16,
          lastHits: 25,
          denies: 2,
          gpm: 240,
          xpm: 320,
          netWorth: 7000,
          level: 17
        },
        items: [],
        heroStats: {
          damageDealt: 5000,
          healingDone: 7000,
          towerDamage: 200
        }
      }
    ]
  },
  statistics: {
    radiantScore: 30,
    direScore: 25,
    goldAdvantage: {
      times: [0, 300, 600, 900, 1200, 1500, 1800],
      radiantGold: [0, 5000, 12000, 18000, 25000, 32000, 40000],
      direGold: [0, 4800, 11500, 17000, 23000, 29000, 35000]
    },
    experienceAdvantage: {
      times: [0, 300, 600, 900, 1200, 1500, 1800],
      radiantExperience: [0, 2000, 5000, 8000, 12000, 16000, 20000],
      direExperience: [0, 1900, 4800, 7500, 11000, 14500, 18000]
    }
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
      const result = generateTeamKey(12345, 67890);
      expect(result).toBe('12345-67890');
    });

    it('should handle different team and league IDs', () => {
      const result = generateTeamKey(123, 456);
      expect(result).toBe('123-456');
    });

    it('should handle zero values', () => {
      const result = generateTeamKey(0, 0);
      expect(result).toBe('0-0');
    });
  });

  describe('determineTeamSideFromMatch', () => {
    it('should determine radiant side correctly', () => {
      const result = determineTeamSideFromMatch(mockMatch, 12345);
      expect(result).toBe('radiant');
    });

    it('should determine dire side correctly', () => {
      const result = determineTeamSideFromMatch(mockMatch, 67890);
      expect(result).toBe('dire');
    });

    it('should throw error for unknown team ID', () => {
      expect(() => {
        determineTeamSideFromMatch(mockMatch, 99999);
      }).toThrow('Could not determine team side for team 99999 in match 123');
    });

    it('should throw error for team not in match', () => {
      expect(() => {
        determineTeamSideFromMatch(mockMatch, 99999);
      }).toThrow('Could not determine team side for team 99999 in match 123');
    });
  });

  describe('extractPlayersFromMatchSide', () => {
    it('should extract radiant players correctly', () => {
      const result = extractPlayersFromMatchSide(mockMatch, 'radiant');
      expect(result).toEqual([111111111, 222222222, 333333333, 444444444, 555555555]);
    });

    it('should extract dire players correctly', () => {
      const result = extractPlayersFromMatchSide(mockMatch, 'dire');
      expect(result).toEqual([666666666, 777777777, 888888888, 999999999, 101010101]);
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

  describe('updateTeamPerformance', () => {
    it('should update team performance with matches', () => {
      const baseTeam: TeamData = {
        team: { id: 12345, name: 'Test Team' },
        league: { id: 67890, name: 'Test League' },
        timeAdded: new Date().toISOString(),
        matches: {},
        manualMatches: {},
        manualPlayers: [],
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

      const matchesWithCorrectSides: Record<number, TeamMatchParticipation> = {
        1: { matchId: 1, side: 'radiant', pickOrder: 'first', result: 'won', duration: 0, opponentName: '', leagueId: '0', startTime: 0 },
        2: { matchId: 2, side: 'dire', pickOrder: 'second', result: 'lost', duration: 0, opponentName: '', leagueId: '0', startTime: 0 },
        3: { matchId: 3, side: 'radiant', pickOrder: 'first', result: 'won', duration: 0, opponentName: '', leagueId: '0', startTime: 0 }
      };

      const originalTeamData = {
        matches: [
          { matchId: 1, result: 'won' },
          { matchId: 2, result: 'lost' },
          { matchId: 3, result: 'won' }
        ]
      };


      const result = updateTeamPerformance(baseTeam, matchesWithCorrectSides, originalTeamData);

      expect(result.matches).toEqual(matchesWithCorrectSides);
      expect(result.performance.totalMatches).toBe(3);
      expect(result.performance.totalWins).toBe(2);
      expect(result.performance.totalLosses).toBe(1);
    });

    it('should handle empty matches array', () => {
      const baseTeam: TeamData = {
        team: { id: 12345, name: 'Test Team' },
        league: { id: 67890, name: 'Test League' },
        timeAdded: new Date().toISOString(),
        matches: {},
        manualMatches: {},
        manualPlayers: [],
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
      const activeTeam = { teamId: 12345, leagueId: 67890 };
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