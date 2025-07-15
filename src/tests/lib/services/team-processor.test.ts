// Jest globals are available without import

import { DotabuffMatchSummary, DotabuffTeam, OpenDotaTeam } from '@/types/external-apis';

import {
    batchProcessTeams,
    ProcessedTeam,
    processTeam,
    RawTeamData,
    validateProcessedTeam
} from '@/lib/services/team-processor';

describe('Team Processor', () => {
  let mockRawTeamData: RawTeamData;
  let mockOpenDotaTeam: OpenDotaTeam;
  let mockDotabuffTeam: DotabuffTeam;

  beforeEach(() => {
    mockOpenDotaTeam = {
      team_id: 1001,
      rating: 1650,
      wins: 120,
      losses: 80,
      last_match_time: 1699123456,
      name: 'Team Spirit',
      tag: 'TS',
      logo_url: 'https://example.com/team_spirit_logo.png',
      sponsor: 'HyperX',
      country_code: 'RU',
      url: 'https://teamspirit.gg',
      players: [
        {
          account_id: 123456789,
          name: 'yatoro',
          games_played: 85,
          wins: 60
        },
        {
          account_id: 234567890,
          name: 'TORONTOTOKYO',
          games_played: 82,
          wins: 58
        },
        {
          account_id: 345678901,
          name: 'Collapse',
          games_played: 80,
          wins: 56
        },
        {
          account_id: 456789012,
          name: 'Mira',
          games_played: 78,
          wins: 54
        },
        {
          account_id: 567890123,
          name: 'Miposhka',
          games_played: 75,
          wins: 52
        }
      ]
    };

    mockDotabuffTeam = {
      teamName: 'Team Spirit',
      matches: {
        '8054301932': {
          match_id: 8054301932,
          start_time: 1699123456,
          duration: 2400,
          radiant_win: true,
          radiant_name: 'Team Spirit',
          dire_name: 'OG',
          radiant_score: 25,
          dire_score: 18,
          leagueid: 12345
        },
        '8054301933': {
          match_id: 8054301933,
          start_time: 1699037056,
          duration: 3200,
          radiant_win: false,
          radiant_name: 'Liquid',
          dire_name: 'Team Spirit',
          radiant_score: 30,
          dire_score: 22,
          leagueid: 12345
        },
        '8054301934': {
          match_id: 8054301934,
          start_time: 1698950656,
          duration: 2800,
          radiant_win: true,
          radiant_name: 'Team Spirit',
          dire_name: 'Secret',
          radiant_score: 28,
          dire_score: 15,
          leagueid: 12346
        }
      }
    };

    const mockAdditionalMatches: DotabuffMatchSummary[] = [
      {
        match_id: 8054301935,
        start_time: 1698864256,
        duration: 2600,
        radiant_win: false,
        radiant_name: 'Fnatic',
        dire_name: 'Team Spirit',
        radiant_score: 20,
        dire_score: 35,
        leagueid: 12347
      },
      {
        match_id: 8054301936,
        start_time: 1698777856,
        duration: 3000,
        radiant_win: true,
        radiant_name: 'Team Spirit',
        dire_name: 'EG',
        radiant_score: 32,
        dire_score: 19,
        leagueid: 12347
      }
    ];

    mockRawTeamData = {
      teamId: 1001,
      openDotaTeam: mockOpenDotaTeam,
      dotabuffTeam: mockDotabuffTeam,
      additionalMatches: mockAdditionalMatches
    };
  });

  describe('processTeam', () => {
    it('should process a valid team successfully', () => {
      const result = processTeam(mockRawTeamData);

      expect(result).toBeDefined();
      expect(result.teamId).toBe(1001);
      expect(result.name).toBe('Team Spirit');
      expect(result.tag).toBe('TS');
      expect(result.logoUrl).toBe('https://example.com/team_spirit_logo.png');
      expect(result.sponsor).toBe('HyperX');
      expect(result.countryCode).toBe('RU');
      expect(result.websiteUrl).toBe('https://teamspirit.gg');
      expect(result.processed.timestamp).toBeDefined();
      expect(result.processed.version).toBe('1.0.0');
    });

    it('should process team profile correctly', () => {
      const result = processTeam(mockRawTeamData);

      expect(result.profile.region).toBe('Europe');
      expect(result.profile.sponsorships).toHaveLength(1);
      expect(result.profile.sponsorships![0].name).toBe('HyperX');
      expect(result.profile.sponsorships![0].type).toBe('main');
    });

    it('should calculate statistics correctly', () => {
      const result = processTeam(mockRawTeamData);

      expect(result.statistics.totalMatches).toBe(200);
      expect(result.statistics.wins).toBe(120);
      expect(result.statistics.losses).toBe(80);
      expect(result.statistics.winRate).toBe(60);
      expect(result.statistics.rating).toBe(1650);
      expect(result.statistics.lastMatchTime).toBe(1699123456);
      expect(result.statistics.averageMatchDuration).toBeGreaterThan(0);
    });

    it('should calculate performance metrics correctly', () => {
      const result = processTeam(mockRawTeamData);

      expect(result.performance.skillLevel).toBe('tier3'); // Rating 1650 falls in tier3 range (1601-1800)
      expect(result.performance.consistency).toBeGreaterThanOrEqual(0);
      expect(result.performance.consistency).toBeLessThanOrEqual(100);
      expect(result.performance.versatility).toBeGreaterThanOrEqual(0);
      expect(result.performance.versatility).toBeLessThanOrEqual(100);
      expect(result.performance.teamwork).toBeGreaterThanOrEqual(0);
      expect(result.performance.teamwork).toBeLessThanOrEqual(100);
      expect(result.performance.laning).toBeGreaterThanOrEqual(0);
      expect(result.performance.laning).toBeLessThanOrEqual(100);
      expect(result.performance.midGame).toBeGreaterThanOrEqual(0);
      expect(result.performance.midGame).toBeLessThanOrEqual(100);
      expect(result.performance.lateGame).toBeGreaterThanOrEqual(0);
      expect(result.performance.lateGame).toBeLessThanOrEqual(100);
    });

    it('should process roster correctly', () => {
      const result = processTeam(mockRawTeamData);

      expect(result.roster.activeRoster).toHaveLength(5);
      expect(result.roster.activeRoster[0].accountId).toBe(123456789);
      expect(result.roster.activeRoster[0].name).toBe('yatoro');
      expect(result.roster.activeRoster[0].role).toBe('substitute'); // Position data not available, defaults to substitute
      expect(result.roster.activeRoster[0].isActive).toBe(true);
      expect(result.roster.activeRoster[0].isCaptain).toBe(false); // Captain data not available in current APIs
      expect(result.roster.activeRoster[0].gamesPlayed).toBe(85);
      expect(result.roster.activeRoster[0].wins).toBe(60);
      expect(result.roster.activeRoster[0].winRate).toBeCloseTo(70.59, 1);
    });

    it('should assign player roles correctly', () => {
      const result = processTeam(mockRawTeamData);

      const roles = result.roster.activeRoster.map(player => player.role);
      expect(roles).toEqual(['substitute', 'substitute', 'substitute', 'substitute', 'substitute']); // Position data not available
    });

    it('should process matches correctly', () => {
      const result = processTeam(mockRawTeamData);

      expect(result.matches.recentMatches).toHaveLength(3); // Only processes dotabuffTeam.matches, not additionalMatches
      expect(result.matches.recentMatches[0].matchId).toBe(8054301932);
      expect(result.matches.recentMatches[0].result).toBe('win');
      expect(result.matches.recentMatches[0].opponent).toBe('OG');
      expect(result.matches.recentMatches[0].duration).toBe(2400);
      expect(result.matches.recentMatches[0].isOfficial).toBe(true);
    });

    it('should calculate head-to-head statistics', () => {
      const result = processTeam(mockRawTeamData);

      expect(result.matches.headToHead).toBeDefined();
      expect(result.matches.headToHead.length).toBeGreaterThan(0);
      
      const ogMatchup = result.matches.headToHead.find(h2h => h2h.opponent === 'OG');
      expect(ogMatchup).toBeDefined();
      expect(ogMatchup!.totalGames).toBe(1);
      expect(ogMatchup!.wins).toBe(1);
      expect(ogMatchup!.losses).toBe(0);
      expect(ogMatchup!.winRate).toBe(100);
    });

    it('should calculate team streaks correctly', () => {
      const result = processTeam(mockRawTeamData);

      expect(result.statistics.streaks.currentWinStreak).toBeGreaterThanOrEqual(0);
      expect(result.statistics.streaks.currentLossStreak).toBeGreaterThanOrEqual(0);
      expect(result.statistics.streaks.longestWinStreak).toBeGreaterThanOrEqual(0);
      expect(result.statistics.streaks.longestLossStreak).toBeGreaterThanOrEqual(0);
    });

    it('should calculate form factor correctly', () => {
      const result = processTeam(mockRawTeamData);

      expect(result.statistics.formFactor.last10Games.wins).toBeGreaterThanOrEqual(0);
      expect(result.statistics.formFactor.last10Games.losses).toBeGreaterThanOrEqual(0);
      expect(result.statistics.formFactor.last10Games.winRate).toBeGreaterThanOrEqual(0);
      expect(result.statistics.formFactor.last10Games.winRate).toBeLessThanOrEqual(100);
      expect(result.statistics.formFactor.last30Days.wins).toBeGreaterThanOrEqual(0);
      expect(result.statistics.formFactor.last30Days.losses).toBeGreaterThanOrEqual(0);
      expect(result.statistics.formFactor.last30Days.winRate).toBeGreaterThanOrEqual(0);
      expect(result.statistics.formFactor.last30Days.winRate).toBeLessThanOrEqual(100);
    });

    it('should process tournament performance', () => {
      const result = processTeam(mockRawTeamData);

      expect(result.matches.tournamentPerformance).toBeDefined();
      expect(result.matches.tournamentPerformance.length).toBeGreaterThan(0);
      
      const firstTournament = result.matches.tournamentPerformance[0];
      expect(firstTournament.leagueId).toBeGreaterThan(0);
      expect(firstTournament.gamesPlayed).toBeGreaterThan(0);
      expect(firstTournament.winRate).toBeGreaterThanOrEqual(0);
      expect(firstTournament.winRate).toBeLessThanOrEqual(100);
    });

    it('should handle team with only OpenDota data', () => {
      const openDotaOnlyData = {
        teamId: 1001,
        openDotaTeam: mockOpenDotaTeam
      };

      const result = processTeam(openDotaOnlyData);
      
      expect(result.teamId).toBe(1001);
      expect(result.name).toBe('Team Spirit');
      expect(result.statistics.totalMatches).toBe(200);
      expect(result.matches.recentMatches).toHaveLength(0);
    });

    it('should handle team with only Dotabuff data', () => {
      const dotabuffOnlyData = {
        teamId: 1001,
        dotabuffTeam: mockDotabuffTeam
      };

      const result = processTeam(dotabuffOnlyData);
      
      expect(result.teamId).toBe(1001);
      expect(result.name).toBe('Team Spirit');
      expect(result.tag).toBe('TEAM'); // extractTagFromName finds "Team" (4 letters) as shortPart
      expect(result.matches.recentMatches).toHaveLength(3);
    });

    it('should extract team tag from name correctly', () => {
      const testCases = [
        { name: 'Team Spirit', expectedTag: 'TEAM' }, // "Team" is 4 letters, found as shortPart
        { name: 'OG', expectedTag: 'OG' }, // Single word, take first 3 chars
        { name: 'Evil Geniuses', expectedTag: 'EG' }, // No shortPart, fall back to initials
        { name: 'Team Secret', expectedTag: 'TEAM' }, // "Team" is 4 letters, found as shortPart
        { name: 'Fnatic', expectedTag: 'FNA' } // Single word, take first 3 chars
      ];

      testCases.forEach(({ name, expectedTag }) => {
        const testData = {
          teamId: 1001,
          dotabuffTeam: { ...mockDotabuffTeam, teamName: name }
        };
        const result = processTeam(testData);
        expect(result.tag).toBe(expectedTag);
      });
    });

    it('should determine region correctly', () => {
      const testCases = [
        { countryCode: 'US', expectedRegion: 'North America' },
        { countryCode: 'CN', expectedRegion: 'China' },
        { countryCode: 'RU', expectedRegion: 'Europe' },
        { countryCode: 'PH', expectedRegion: 'Southeast Asia' },
        { countryCode: 'BR', expectedRegion: 'South America' },
        { countryCode: 'XX', expectedRegion: 'Other' }
      ];

      testCases.forEach(({ countryCode, expectedRegion }) => {
        const testData = {
          ...mockRawTeamData,
          openDotaTeam: { ...mockOpenDotaTeam, country_code: countryCode }
        };
        const result = processTeam(testData);
        expect(result.profile.region).toBe(expectedRegion);
      });
    });

    it('should calculate skill level correctly', () => {
      const testCases = [
        { rating: 500, expectedLevel: 'amateur' },
        { rating: 1200, expectedLevel: 'semi_professional' },
        { rating: 1500, expectedLevel: 'professional' },
        { rating: 1700, expectedLevel: 'tier3' }, // 1601-1800 range
        { rating: 1900, expectedLevel: 'tier2' }, // 1801-2000 range
        { rating: 2100, expectedLevel: 'tier1' }  // 2001+ range
      ];

      testCases.forEach(({ rating, expectedLevel }) => {
        const testData = {
          ...mockRawTeamData,
          openDotaTeam: { ...mockOpenDotaTeam, rating }
        };
        const result = processTeam(testData);
        expect(result.performance.skillLevel).toBe(expectedLevel);
      });
    });

    it('should calculate play style correctly', () => {
      const result = processTeam(mockRawTeamData);

      expect(result.performance.playStyle.aggressive).toBeGreaterThanOrEqual(0);
      expect(result.performance.playStyle.aggressive).toBeLessThanOrEqual(100);
      expect(result.performance.playStyle.defensive).toBeGreaterThanOrEqual(0);
      expect(result.performance.playStyle.defensive).toBeLessThanOrEqual(100);
      expect(result.performance.playStyle.strategic).toBeGreaterThanOrEqual(0);
      expect(result.performance.playStyle.strategic).toBeLessThanOrEqual(100);
      expect(result.performance.playStyle.chaotic).toBeGreaterThanOrEqual(0);
      expect(result.performance.playStyle.chaotic).toBeLessThanOrEqual(100);
    });

    it('should throw error for null team data', () => {
      expect(() => processTeam(null as any)).toThrow('Raw team data is required');
    });

    it('should throw error for invalid team ID', () => {
      const invalidData = { ...mockRawTeamData, teamId: null };
      expect(() => processTeam(invalidData as any)).toThrow('Team ID is required');
    });

    it('should throw error when no team data provided', () => {
      const invalidData = { teamId: 1001 };
      expect(() => processTeam(invalidData as any)).toThrow('At least one data source (OpenDota or Dotabuff) is required');
    });

    it('should throw error for invalid OpenDota team name', () => {
      const invalidData = {
        teamId: 1001,
        openDotaTeam: { ...mockOpenDotaTeam, name: null }
      };
      expect(() => processTeam(invalidData as any)).toThrow('Invalid OpenDota team name');
    });

    it('should throw error for invalid Dotabuff team name', () => {
      const invalidData = {
        teamId: 1001,
        dotabuffTeam: { ...mockDotabuffTeam, teamName: null }
      };
      expect(() => processTeam(invalidData as any)).toThrow('Invalid Dotabuff team name');
    });

    it('should handle team without sponsor', () => {
      const noSponsorData = {
        ...mockRawTeamData,
        openDotaTeam: { ...mockOpenDotaTeam, sponsor: '' }
      };

      const result = processTeam(noSponsorData);
      expect(result.sponsor).toBe(''); // Empty string, not undefined
      expect(result.profile.sponsorships).toEqual([]); // Empty array, not undefined
    });

    it('should handle team without country code', () => {
      const noCountryData = {
        ...mockRawTeamData,
        openDotaTeam: { ...mockOpenDotaTeam, country_code: '' }
      };

      const result = processTeam(noCountryData);
      expect(result.countryCode).toBe(''); // Empty string, not undefined
      expect(result.profile.region).toBe('Unknown');
    });

    it('should handle empty player roster', () => {
      const noPlayersData = {
        ...mockRawTeamData,
        openDotaTeam: { ...mockOpenDotaTeam, players: [] }
      };

      const result = processTeam(noPlayersData);
      expect(result.roster.activeRoster).toHaveLength(0);
      expect(result.roster.rosterStability).toBe(0);
      expect(result.roster.averagePlayerTenure).toBe(0);
    });

    it('should handle team with no matches', () => {
      const noMatchesData = {
        teamId: 1001,
        openDotaTeam: mockOpenDotaTeam,
        dotabuffTeam: { teamName: 'Team Spirit', matches: {} }
      };

      const result = processTeam(noMatchesData);
      expect(result.matches.recentMatches).toHaveLength(0);
      expect(result.matches.headToHead).toHaveLength(0);
      expect(result.matches.tournamentPerformance).toHaveLength(0);
    });
  });

  describe('batchProcessTeams', () => {
    it('should process multiple teams successfully', () => {
      const teams = [
        mockRawTeamData,
        { 
          ...mockRawTeamData, 
          teamId: 1002,
          openDotaTeam: { ...mockOpenDotaTeam, team_id: 1002, name: 'OG' }
        }
      ];
      const results = batchProcessTeams(teams);

      expect(results).toHaveLength(2);
      expect(results[0]).toHaveProperty('teamId');
      expect(results[1]).toHaveProperty('teamId');
      expect((results[0] as ProcessedTeam).teamId).toBe(1001);
      expect((results[1] as ProcessedTeam).teamId).toBe(1002);
    });

    it('should handle errors gracefully in batch processing', () => {
      const validTeam = mockRawTeamData;
      const invalidTeam = { teamId: null };
      const teams = [validTeam, invalidTeam as any];
      
      const results = batchProcessTeams(teams);

      expect(results).toHaveLength(2);
      expect(results[0]).toHaveProperty('teamId');
      expect(results[1]).toHaveProperty('error');
      expect((results[1] as any).error).toContain('Team ID is required');
      expect((results[1] as any).teamId).toBeNull();
    });

    it('should handle completely invalid team objects', () => {
      const teams = [mockRawTeamData, null as any];
      const results = batchProcessTeams(teams);

      expect(results).toHaveLength(2);
      expect(results[0]).toHaveProperty('teamId');
      expect(results[1]).toHaveProperty('error');
      expect((results[1] as any).error).toContain('Raw team data is required');
      expect((results[1] as any).teamId).toBeUndefined();
    });
  });

  describe('validateProcessedTeam', () => {
    let validProcessedTeam: ProcessedTeam;

    beforeEach(() => {
      validProcessedTeam = processTeam(mockRawTeamData);
    });

    it('should validate a valid processed team', () => {
      expect(() => validateProcessedTeam(validProcessedTeam)).not.toThrow();
      expect(validateProcessedTeam(validProcessedTeam)).toBe(true);
    });

    it('should throw error for invalid team ID', () => {
      const invalidTeam = { ...validProcessedTeam, teamId: null };
      expect(() => validateProcessedTeam(invalidTeam as any)).toThrow('Invalid processed team ID');
    });

    it('should throw error for invalid team name', () => {
      const invalidTeam = { ...validProcessedTeam, name: null };
      expect(() => validateProcessedTeam(invalidTeam as any)).toThrow('Invalid processed team name');
    });

    it('should throw error for missing statistics', () => {
      const invalidTeam = { ...validProcessedTeam, statistics: null };
      expect(() => validateProcessedTeam(invalidTeam as any)).toThrow('Missing team statistics');
    });

    it('should throw error for missing performance', () => {
      const invalidTeam = { ...validProcessedTeam, performance: null };
      expect(() => validateProcessedTeam(invalidTeam as any)).toThrow('Missing team performance metrics');
    });

    it('should throw error for missing processing timestamp', () => {
      const invalidTeam = { ...validProcessedTeam };
      invalidTeam.processed.timestamp = '';
      expect(() => validateProcessedTeam(invalidTeam)).toThrow('Missing processing timestamp');
    });
  });

  describe('Performance Calculations', () => {
    it('should calculate consistency correctly', () => {
      const result = processTeam(mockRawTeamData);
      
      expect(result.performance.consistency).toBeGreaterThanOrEqual(0);
      expect(result.performance.consistency).toBeLessThanOrEqual(100);
    });

    it('should calculate versatility correctly', () => {
      const result = processTeam(mockRawTeamData);
      
      expect(result.performance.versatility).toBeGreaterThanOrEqual(0);
      expect(result.performance.versatility).toBeLessThanOrEqual(100);
    });

    it('should calculate improvement score correctly', () => {
      const result = processTeam(mockRawTeamData);
      
      expect(result.performance.improvement).toBeGreaterThanOrEqual(-100);
      expect(result.performance.improvement).toBeLessThanOrEqual(100);
    });

    it('should determine strengths and weaknesses', () => {
      const result = processTeam(mockRawTeamData);
      
      expect(Array.isArray(result.performance.strengths)).toBe(true);
      expect(Array.isArray(result.performance.weaknesses)).toBe(true);
    });

    it('should calculate roster stability correctly', () => {
      const result = processTeam(mockRawTeamData);
      
      expect(result.roster.rosterStability).toBeGreaterThanOrEqual(0);
      expect(result.roster.rosterStability).toBeLessThanOrEqual(100);
    });

    it('should calculate average player tenure correctly', () => {
      const result = processTeam(mockRawTeamData);
      
      expect(result.roster.averagePlayerTenure).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle team with zero rating', () => {
      const zeroRatingData = {
        ...mockRawTeamData,
        openDotaTeam: { ...mockOpenDotaTeam, rating: 0 }
      };
      
      const result = processTeam(zeroRatingData);
      expect(result.statistics.rating).toBe(0);
      expect(result.performance.skillLevel).toBe('amateur');
    });

    it('should handle team with perfect win rate', () => {
      const perfectWinData = {
        ...mockRawTeamData,
        openDotaTeam: { ...mockOpenDotaTeam, wins: 100, losses: 0 }
      };
      
      const result = processTeam(perfectWinData);
      expect(result.statistics.winRate).toBe(100);
      expect(result.statistics.wins).toBe(100);
      expect(result.statistics.losses).toBe(0);
    });

    it('should handle team with no wins', () => {
      const noWinsData = {
        ...mockRawTeamData,
        openDotaTeam: { ...mockOpenDotaTeam, wins: 0, losses: 100 }
      };
      
      const result = processTeam(noWinsData);
      expect(result.statistics.winRate).toBe(0);
      expect(result.statistics.wins).toBe(0);
      expect(result.statistics.losses).toBe(100);
    });

    it('should handle very short matches', () => {
      const shortMatchData = {
        ...mockRawTeamData,
        dotabuffTeam: {
          teamName: 'Team Spirit',
          matches: {
            '123': {
              match_id: 123,
              start_time: 1699123456,
              duration: 900, // 15 minutes
              radiant_win: true,
              radiant_name: 'Team Spirit',
              dire_name: 'OG',
              radiant_score: 10,
              dire_score: 5,
              leagueid: 12345
            }
          }
        }
      };
      
      const result = processTeam(shortMatchData);
      expect(result.performance.playStyle.aggressive).toBeGreaterThan(50);
    });

    it('should handle very long matches', () => {
      const longMatchData = {
        ...mockRawTeamData,
        dotabuffTeam: {
          teamName: 'Team Spirit',
          matches: {
            '123': {
              match_id: 123,
              start_time: 1699123456,
              duration: 4800, // 80 minutes
              radiant_win: true,
              radiant_name: 'Team Spirit',
              dire_name: 'OG',
              radiant_score: 50,
              dire_score: 45,
              leagueid: 12345
            }
          }
        }
      };
      
      const result = processTeam(longMatchData);
      expect(result.performance.playStyle.defensive).toBeGreaterThan(0);
    });

    it('should handle team without optional OpenDota fields', () => {
      const minimalOpenDotaTeam = {
        team_id: 1001,
        rating: 1500,
        wins: 50,
        losses: 30,
        last_match_time: 1699123456,
        name: 'Test Team',
        players: []
      };
      
      const minimalData = {
        teamId: 1001,
        openDotaTeam: minimalOpenDotaTeam as any
      };
      
      const result = processTeam(minimalData);
      expect(result.tag).toBe('TT'); // Should extract from name
      expect(result.logoUrl).toBeUndefined();
      expect(result.sponsor).toBeUndefined();
      expect(result.countryCode).toBeUndefined();
      expect(result.websiteUrl).toBeUndefined();
    });

    it('should handle matches with missing league IDs', () => {
      const noLeagueData = {
        ...mockRawTeamData,
        dotabuffTeam: {
          teamName: 'Team Spirit',
          matches: {
            '123': {
              match_id: 123,
              start_time: 1699123456,
              duration: 2400,
              radiant_win: true,
              radiant_name: 'Team Spirit',
              dire_name: 'OG',
              radiant_score: 25,
              dire_score: 20,
              leagueid: 0
            }
          }
        }
      };
      
      const result = processTeam(noLeagueData);
      expect(result.statistics.gamesPlayed.official).toBe(0);
      expect(result.statistics.gamesPlayed.tournament).toBe(0);
    });

    it('should handle calculation of rating from matches when OpenDota rating unavailable', () => {
      const dotabuffOnlyData = {
        teamId: 1001,
        dotabuffTeam: {
          teamName: 'Test Team',
          matches: {
            '1': {
              match_id: 1,
              start_time: 1699123456,
              duration: 2400,
              radiant_win: true,
              radiant_name: 'Test Team',
              dire_name: 'Enemy',
              radiant_score: 25,
              dire_score: 20,
              leagueid: 123
            },
            '2': {
              match_id: 2,
              start_time: 1699123455,
              duration: 2400,
              radiant_win: true,
              radiant_name: 'Test Team',
              dire_name: 'Enemy2',
              radiant_score: 30,
              dire_score: 15,
              leagueid: 124
            }
          }
        }
      };
      
      const result = processTeam(dotabuffOnlyData);
      expect(result.statistics.rating).toBeGreaterThan(1000); // Should be above baseline
    });
  });
}); 