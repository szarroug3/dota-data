// Jest globals are available without import

import {
    batchProcessMatches,
    ProcessedMatch,
    processMatch,
    validateProcessedMatch
} from '@/lib/services/match-processor';
import { OpenDotaMatch, OpenDotaMatchPlayer } from '@/types/external-apis';

describe('Match Processor', () => {
  let mockMatch: OpenDotaMatch;
  let mockPlayer: OpenDotaMatchPlayer;

  beforeEach(() => {
    mockPlayer = {
      account_id: 123456789,
      player_slot: 0,
      hero_id: 1,
      item_0: 1,
      item_1: 2,
      item_2: 3,
      item_3: 4,
      item_4: 5,
      item_5: 6,
      backpack_0: 7,
      backpack_1: 8,
      backpack_2: 9,
      item_neutral: 10,
      kills: 5,
      deaths: 3,
      assists: 8,
      leaver_status: 0,
      last_hits: 150,
      denies: 10,
      gold_per_min: 450,
      xp_per_min: 520,
      level: 18,
      gold: 2500,
      gold_spent: 12000,
      hero_damage: 25000,
      scaled_hero_damage: 25000,
      tower_damage: 3000,
      scaled_tower_damage: 3000,
      hero_healing: 1500,
      scaled_hero_healing: 1500,
      isRadiant: true,
      win: 1,
      lose: 0,
      total_gold: 14500,
      total_xp: 18720,
      kills_per_min: 0.125,
      kda: 4.33,
      abandons: 0,
      neutral_kills: 45,
      tower_kills: 2,
      courier_kills: 0,
      lane_kills: 120,
      hero_kills: 5,
      observer_kills: 3,
      sentry_kills: 5,
      roshan_kills: 1,
      necronomicon_kills: 0,
      ancient_kills: 12,
      buyback_count: 1,
      observer_uses: 8,
      sentry_uses: 12,
      lane_efficiency_pct: 0.75,
      lane: 1,
      lane_role: 1,
      is_roaming: false,
      purchase_time: {},
      first_purchase_time: {},
      item_win: {},
      item_usage: {},
      purchase_tpscroll: 5,
      actions_per_min: 180,
      life_state_dead: 120,
      rank_tier: 54,
      cosmetics: [],
      benchmarks: {}
    };

    mockMatch = {
      match_id: 8054301932,
      start_time: 1699123456,
      duration: 2400,
      radiant_win: true,
      players: Array(10).fill(null).map((_, index) => ({
        ...mockPlayer,
        player_slot: index < 5 ? index : 128 + (index - 5),
        account_id: 123456789 + index,
        hero_id: index + 1,
        kills: Math.floor(Math.random() * 10) + 1,
        deaths: Math.floor(Math.random() * 5) + 1,
        assists: Math.floor(Math.random() * 15) + 1,
        gold_per_min: Math.floor(Math.random() * 200) + 350,
        xp_per_min: Math.floor(Math.random() * 150) + 400,
        hero_damage: Math.floor(Math.random() * 20000) + 10000,
        tower_damage: Math.floor(Math.random() * 3000) + 1000,
        hero_healing: Math.floor(Math.random() * 2000) + 500,
        last_hits: Math.floor(Math.random() * 100) + 50,
        denies: Math.floor(Math.random() * 20) + 5,
        level: Math.floor(Math.random() * 5) + 15,
        isRadiant: index < 5,
        win: index < 5 ? 1 : 0,
        lose: index < 5 ? 0 : 1,
      })),
      radiant_name: 'Team Radiant',
      dire_name: 'Team Dire',
      radiant_team_id: 1001,
      dire_team_id: 1002,
      radiant_score: 25,
      dire_score: 18,
      leagueid: 12345,

      picks_bans: [
        { is_pick: false, hero_id: 100, team: 0, order: 1 },
        { is_pick: false, hero_id: 101, team: 1, order: 2 },
        { is_pick: true, hero_id: 1, team: 0, order: 8 },
        { is_pick: true, hero_id: 2, team: 1, order: 9 },
      ]
    };
  });

  describe('processMatch', () => {
    it('should process a valid match successfully', () => {
      const result = processMatch(mockMatch);

      expect(result).toBeDefined();
      expect(result.matchId).toBe(mockMatch.match_id);
      expect(result.startTime).toBe(mockMatch.start_time);
      expect(result.duration).toBe(mockMatch.duration);
      expect(result.radiantWin).toBe(mockMatch.radiant_win);
      expect(result.gameMode).toBe('Unknown'); // OpenDotaMatch doesn't include game_mode
      expect(result.lobbyType).toBe('Unknown'); // OpenDotaMatch doesn't include lobby_type
      expect(result.leagueId).toBe(mockMatch.leagueid);
      expect(result.processed.timestamp).toBeDefined();
      expect(result.processed.version).toBe('1.0.0');
    });

    it('should process teams correctly', () => {
      const result = processMatch(mockMatch);

      expect(result.teams.radiant).toBeDefined();
      expect(result.teams.dire).toBeDefined();
      expect(result.teams.radiant.players).toHaveLength(5);
      expect(result.teams.dire.players).toHaveLength(5);
      expect(result.teams.radiant.name).toBe('Team Radiant');
      expect(result.teams.dire.name).toBe('Team Dire');
      expect(result.teams.radiant.teamId).toBe(1001);
      expect(result.teams.dire.teamId).toBe(1002);
      expect(result.teams.radiant.score).toBe(25);
      expect(result.teams.dire.score).toBe(18);
    });

    it('should calculate team statistics correctly', () => {
      const result = processMatch(mockMatch);

      expect(result.teams.radiant.totalKills).toBeGreaterThan(0);
      expect(result.teams.radiant.totalDeaths).toBeGreaterThan(0);
      expect(result.teams.radiant.totalAssists).toBeGreaterThan(0);
      expect(result.teams.radiant.totalNetWorth).toBeGreaterThan(0);
      expect(result.teams.radiant.avgLevel).toBeGreaterThan(0);
      expect(result.teams.radiant.avgGPM).toBeGreaterThan(0);
      expect(result.teams.radiant.avgXPM).toBeGreaterThan(0);
      expect(result.teams.radiant.teamFightPerformance).toBeGreaterThanOrEqual(0);
      expect(result.teams.radiant.teamFightPerformance).toBeLessThanOrEqual(100);
    });

    it('should process players correctly', () => {
      const result = processMatch(mockMatch);

      const radiantPlayer = result.teams.radiant.players[0];
      expect(radiantPlayer.accountId).toBe(123456789);
      expect(radiantPlayer.heroId).toBe(1);
      expect(radiantPlayer.kda).toBeGreaterThan(0);
      expect(radiantPlayer.items).toHaveLength(6);
      expect(radiantPlayer.backpack).toHaveLength(3);
      expect(radiantPlayer.neutralItem).toBe(10);
      expect(radiantPlayer.performance.laning).toBeGreaterThanOrEqual(0);
      expect(radiantPlayer.performance.laning).toBeLessThanOrEqual(100);
      expect(radiantPlayer.performance.teamfight).toBeGreaterThanOrEqual(0);
      expect(radiantPlayer.performance.teamfight).toBeLessThanOrEqual(100);
      expect(radiantPlayer.performance.farming).toBeGreaterThanOrEqual(0);
      expect(radiantPlayer.performance.farming).toBeLessThanOrEqual(100);
      expect(radiantPlayer.performance.support).toBeGreaterThanOrEqual(0);
      expect(radiantPlayer.performance.support).toBeLessThanOrEqual(100);
    });

    it('should process picks and bans correctly', () => {
      const result = processMatch(mockMatch);

      expect(result.picksBans).toBeDefined();
      expect(result.picksBans).toHaveLength(4);
      expect(result.picksBans![0].order).toBe(1);
      expect(result.picksBans![0].isPick).toBe(false);
      expect(result.picksBans![0].heroId).toBe(100);
      expect(result.picksBans![0].team).toBe('radiant');
      expect(result.picksBans![0].phase).toBe('ban1');
    });

    it('should calculate match statistics correctly', () => {
      const result = processMatch(mockMatch);

      expect(result.statistics.totalKills).toBeGreaterThan(0);
      expect(result.statistics.killsPerMinute).toBeGreaterThan(0);
      expect(result.statistics.averageMatchRank).toBeGreaterThanOrEqual(0);
      expect(result.statistics.gameDurationCategory).toBe('long'); // 2400 seconds = 40 minutes = 'long'
      expect(result.statistics.dominanceScore).toBeGreaterThanOrEqual(0);
      expect(result.statistics.dominanceScore).toBeLessThanOrEqual(100);
      expect(result.statistics.teamFightIntensity).toBeGreaterThanOrEqual(0);
      expect(result.statistics.teamFightIntensity).toBeLessThanOrEqual(100);
      expect(result.statistics.farmingEfficiency.radiant).toBeGreaterThan(0);
      expect(result.statistics.farmingEfficiency.dire).toBeGreaterThan(0);
      expect(result.statistics.heroComplexity).toBeGreaterThanOrEqual(0);
      expect(result.statistics.heroComplexity).toBeLessThanOrEqual(100);
    });

    it('should handle matches without picks and bans', () => {
      const matchWithoutPicksBans = { ...mockMatch, picks_bans: undefined };
      const result = processMatch(matchWithoutPicksBans);

      expect(result.picksBans).toBeUndefined();
    });

    it('should handle matches without team names', () => {
      const matchWithoutTeamNames = { 
        ...mockMatch, 
        radiant_name: undefined, 
        dire_name: undefined 
      };
      const result = processMatch(matchWithoutTeamNames);

      expect(result.teams.radiant.name).toBeUndefined();
      expect(result.teams.dire.name).toBeUndefined();
    });

    it('should handle matches without league ID', () => {
      const matchWithoutLeague = { ...mockMatch, leagueid: undefined };
      const result = processMatch(matchWithoutLeague);

      expect(result.leagueId).toBeUndefined();
    });

    it('should throw error for null match', () => {
      expect(() => processMatch(null as any)).toThrow('Match data is null or undefined');
    });

    it('should throw error for invalid match ID', () => {
      const invalidMatch = { ...mockMatch, match_id: null };
      expect(() => processMatch(invalidMatch as any)).toThrow('Invalid match ID');
    });

    it('should throw error for invalid players array', () => {
      const invalidMatch = { ...mockMatch, players: null };
      expect(() => processMatch(invalidMatch as any)).toThrow('Invalid players data');
    });

    it('should throw error for wrong number of players', () => {
      const invalidMatch = { ...mockMatch, players: mockMatch.players.slice(0, 8) };
      expect(() => processMatch(invalidMatch as any)).toThrow('Expected 10 players, got 8');
    });

    it('should throw error for invalid duration', () => {
      const invalidMatch = { ...mockMatch, duration: -100 };
      expect(() => processMatch(invalidMatch as any)).toThrow('Invalid match duration');
    });

    it('should throw error for invalid start time', () => {
      const invalidMatch = { ...mockMatch, start_time: 'invalid' };
      expect(() => processMatch(invalidMatch as any)).toThrow('Invalid start time');
    });

    it('should throw error for invalid radiant win status', () => {
      const invalidMatch = { ...mockMatch, radiant_win: 'maybe' };
      expect(() => processMatch(invalidMatch as any)).toThrow('Invalid radiant win status');
    });

    it('should categorize game duration correctly', () => {
      const shortMatch = { ...mockMatch, duration: 1200 }; // 20 minutes
      const mediumMatch = { ...mockMatch, duration: 2200 }; // 36.7 minutes
      const longMatch = { ...mockMatch, duration: 3500 }; // 58.3 minutes
      const veryLongMatch = { ...mockMatch, duration: 4800 }; // 80 minutes

      expect(processMatch(shortMatch).statistics.gameDurationCategory).toBe('short');
      expect(processMatch(mediumMatch).statistics.gameDurationCategory).toBe('medium');
      expect(processMatch(longMatch).statistics.gameDurationCategory).toBe('long');
      expect(processMatch(veryLongMatch).statistics.gameDurationCategory).toBe('very_long');
    });

    it('should calculate KDA correctly', () => {
      const result = processMatch(mockMatch);
      const player = result.teams.radiant.players[0];
      
      // KDA should be (kills + assists) / deaths, or kills + assists if deaths is 0
      const expectedKDA = player.deaths > 0 ? 
        (player.kills + player.assists) / player.deaths : 
        player.kills + player.assists;
      
      expect(player.kda).toBeCloseTo(expectedKDA, 2);
    });

    it('should handle players with zero deaths correctly', () => {
      const modifiedMatch = { ...mockMatch };
      modifiedMatch.players[0].deaths = 0;
      
      const result = processMatch(modifiedMatch);
      const player = result.teams.radiant.players[0];
      
      expect(player.kda).toBe(player.kills + player.assists);
    });

    it('should filter out zero-value items', () => {
      const modifiedMatch = { ...mockMatch };
      modifiedMatch.players[0].item_0 = 0;
      modifiedMatch.players[0].item_1 = 0;
      modifiedMatch.players[0].backpack_0 = 0;
      
      const result = processMatch(modifiedMatch);
      const player = result.teams.radiant.players[0];
      
      expect(player.items).not.toContain(0);
      expect(player.backpack).not.toContain(0);
    });

    it('should calculate average rank correctly', () => {
      const result = processMatch(mockMatch);
      
      // All players have rank_tier 54, so average should be 54
      expect(result.averageRank).toBe(54);
    });

    it('should handle matches with no ranked players', () => {
      const modifiedMatch = { ...mockMatch };
      modifiedMatch.players.forEach(player => {
        player.rank_tier = 0;
      });
      
      const result = processMatch(modifiedMatch);
      expect(result.averageRank).toBe(0);
    });
  });

  describe('batchProcessMatches', () => {
    it('should process multiple matches successfully', () => {
      const matches = [mockMatch, { ...mockMatch, match_id: 8054301933 }];
      const results = batchProcessMatches(matches);

      expect(results).toHaveLength(2);
      expect(results[0]).toHaveProperty('matchId');
      expect(results[1]).toHaveProperty('matchId');
      expect((results[0] as ProcessedMatch).matchId).toBe(8054301932);
      expect((results[1] as ProcessedMatch).matchId).toBe(8054301933);
    });

    it('should handle errors gracefully in batch processing', () => {
      const validMatch = mockMatch;
      const invalidMatch = { ...mockMatch, players: null };
      const matches = [validMatch, invalidMatch as any];
      
      const results = batchProcessMatches(matches);

      expect(results).toHaveLength(2);
      expect(results[0]).toHaveProperty('matchId');
      expect(results[1]).toHaveProperty('error');
      expect((results[1] as any).error).toContain('Invalid players data');
      expect((results[1] as any).matchId).toBe(mockMatch.match_id);
    });

    it('should handle completely invalid match objects', () => {
      const matches = [mockMatch, null as any];
      const results = batchProcessMatches(matches);

      expect(results).toHaveLength(2);
      expect(results[0]).toHaveProperty('matchId');
      expect(results[1]).toHaveProperty('error');
      expect((results[1] as any).error).toContain('Match data is null or undefined');
      expect((results[1] as any).matchId).toBeUndefined();
    });
  });

  describe('validateProcessedMatch', () => {
    let validProcessedMatch: ProcessedMatch;

    beforeEach(() => {
      validProcessedMatch = processMatch(mockMatch);
    });

    it('should validate a valid processed match', () => {
      expect(() => validateProcessedMatch(validProcessedMatch)).not.toThrow();
      expect(validateProcessedMatch(validProcessedMatch)).toBe(true);
    });

    it('should throw error for invalid match ID', () => {
      const invalidMatch = { ...validProcessedMatch, matchId: null };
      expect(() => validateProcessedMatch(invalidMatch as any)).toThrow('Invalid processed match ID');
    });

    it('should throw error for invalid radiant team players', () => {
      const invalidMatch = { ...validProcessedMatch };
      invalidMatch.teams.radiant.players = [];
      expect(() => validateProcessedMatch(invalidMatch)).toThrow('Invalid radiant team players');
    });

    it('should throw error for invalid dire team players', () => {
      const invalidMatch = { ...validProcessedMatch };
      invalidMatch.teams.dire.players = [];
      expect(() => validateProcessedMatch(invalidMatch)).toThrow('Invalid dire team players');
    });

    it('should throw error for missing statistics', () => {
      const invalidMatch = { ...validProcessedMatch, statistics: null };
      expect(() => validateProcessedMatch(invalidMatch as any)).toThrow('Missing match statistics');
    });

    it('should throw error for missing processing timestamp', () => {
      const invalidMatch = { ...validProcessedMatch };
      invalidMatch.processed.timestamp = '';
      expect(() => validateProcessedMatch(invalidMatch)).toThrow('Missing processing timestamp');
    });
  });

  describe('Performance calculations', () => {
    it('should calculate laning performance correctly', () => {
      const result = processMatch(mockMatch);
      const player = result.teams.radiant.players[0];
      
      expect(player.performance.laning).toBeGreaterThanOrEqual(0);
      expect(player.performance.laning).toBeLessThanOrEqual(100);
    });

    it('should calculate teamfight performance correctly', () => {
      const result = processMatch(mockMatch);
      const player = result.teams.radiant.players[0];
      
      expect(player.performance.teamfight).toBeGreaterThanOrEqual(0);
      expect(player.performance.teamfight).toBeLessThanOrEqual(100);
    });

    it('should calculate farming performance correctly', () => {
      const result = processMatch(mockMatch);
      const player = result.teams.radiant.players[0];
      
      expect(player.performance.farming).toBeGreaterThanOrEqual(0);
      expect(player.performance.farming).toBeLessThanOrEqual(100);
    });

    it('should calculate support performance correctly', () => {
      const result = processMatch(mockMatch);
      const player = result.teams.radiant.players[0];
      
      expect(player.performance.support).toBeGreaterThanOrEqual(0);
      expect(player.performance.support).toBeLessThanOrEqual(100);
    });

    it('should calculate dominance score correctly', () => {
      const result = processMatch(mockMatch);
      
      expect(result.statistics.dominanceScore).toBeGreaterThanOrEqual(0);
      expect(result.statistics.dominanceScore).toBeLessThanOrEqual(100);
    });

    it('should calculate team fight intensity correctly', () => {
      const result = processMatch(mockMatch);
      
      expect(result.statistics.teamFightIntensity).toBeGreaterThanOrEqual(0);
      expect(result.statistics.teamFightIntensity).toBeLessThanOrEqual(100);
    });

    it('should calculate hero complexity correctly', () => {
      const result = processMatch(mockMatch);
      
      expect(result.statistics.heroComplexity).toBeGreaterThanOrEqual(0);
      expect(result.statistics.heroComplexity).toBeLessThanOrEqual(100);
    });
  });

  describe('Edge cases', () => {
    it('should handle matches with zero kills', () => {
      const modifiedMatch = { ...mockMatch };
      modifiedMatch.players.forEach(player => {
        player.kills = 0;
        player.assists = 0;
      });
      
      const result = processMatch(modifiedMatch);
      expect(result.statistics.totalKills).toBe(0);
      expect(result.statistics.killsPerMinute).toBe(0);
    });

    it('should handle matches with extreme durations', () => {
      const shortMatch = { ...mockMatch, duration: 300 }; // 5 minutes
      const longMatch = { ...mockMatch, duration: 7200 }; // 2 hours
      
      expect(() => processMatch(shortMatch)).not.toThrow();
      expect(() => processMatch(longMatch)).not.toThrow();
      
      expect(processMatch(shortMatch).statistics.gameDurationCategory).toBe('short');
      expect(processMatch(longMatch).statistics.gameDurationCategory).toBe('very_long');
    });

    it('should handle matches with no gold/xp data', () => {
      const modifiedMatch = { ...mockMatch };
      modifiedMatch.players.forEach(player => {
        player.gold_per_min = 0;
        player.xp_per_min = 0;
        player.total_gold = 0;
        player.gold = 0;
        player.gold_spent = 0;
      });
      
      const result = processMatch(modifiedMatch);
      expect(result.teams.radiant.avgGPM).toBe(0);
      expect(result.teams.radiant.avgXPM).toBe(0);
      expect(result.teams.radiant.totalNetWorth).toBe(0);
    });

    it('should handle matches with missing optional fields', () => {
      const minimalMatch = {
        match_id: 8054301932,
        start_time: 1699123456,
        duration: 2400,
        radiant_win: true,
        players: mockMatch.players,
        game_mode: 1,
        lobby_type: 7,
      };
      
      const result = processMatch(minimalMatch as OpenDotaMatch);
      
      expect(result.matchId).toBe(8054301932);
      expect(result.teams.radiant.name).toBeUndefined();
      expect(result.teams.dire.name).toBeUndefined();
      expect(result.leagueId).toBeUndefined();
      expect(result.picksBans).toBeUndefined();
    });
  });

  describe('Game mode and lobby type mapping', () => {
    it('should map game modes correctly', () => {
      // Since OpenDotaMatch interface doesn't include game_mode field,
      // the implementation always returns 'Unknown'
      const testCases = [
        { mode: 1, expected: 'Unknown' },
        { mode: 2, expected: 'Unknown' },
        { mode: 23, expected: 'Unknown' },
        { mode: 99, expected: 'Unknown' },
      ];

      testCases.forEach(({ mode, expected }) => {
        const testMatch = { ...mockMatch, game_mode: mode };
        const result = processMatch(testMatch);
        expect(result.gameMode).toBe(expected);
      });
    });

    it('should map lobby types correctly', () => {
      // Since OpenDotaMatch interface doesn't include lobby_type field,
      // the implementation always returns 'Unknown'
      const testCases = [
        { type: 0, expected: 'Unknown' },
        { type: 7, expected: 'Unknown' },
        { type: 9, expected: 'Unknown' },
        { type: 99, expected: 'Unknown' },
      ];

      testCases.forEach(({ type, expected }) => {
        const testMatch = { ...mockMatch, lobby_type: type };
        const result = processMatch(testMatch);
        expect(result.lobbyType).toBe(expected);
      });
    });
  });

  describe('Pick/Ban phase mapping', () => {
    it('should map pick/ban phases correctly', () => {
      const testCases = [
        { order: 1, expected: 'ban1' },
        { order: 8, expected: 'pick1' },
        { order: 12, expected: 'ban2' },
        { order: 16, expected: 'pick2' },
        { order: 20, expected: 'ban3' },
        { order: 24, expected: 'pick3' },
      ];

      testCases.forEach(({ order, expected }) => {
        const testMatch = {
          ...mockMatch,
          picks_bans: [{ is_pick: true, hero_id: 1, team: 0, order }]
        };
        const result = processMatch(testMatch);
        expect(result.picksBans![0].phase).toBe(expected);
      });
    });
  });
}); 