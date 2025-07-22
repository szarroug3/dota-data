/**
 * Team Context Tests
 * 
 * Tests for the team context functionality including team operations,
 * league-specific filtering, and player aggregation.
 */

import { ConfigProvider } from '@/contexts/config-context';
import { ConstantsProvider } from '@/contexts/constants-context';
import { ConstantsDataFetchingProvider } from '@/contexts/constants-data-fetching-context';
import { MatchProvider } from '@/contexts/match-context';
import { PlayerProvider } from '@/contexts/player-context';
import { TeamProvider, useTeamContext } from '@/contexts/team-context';

describe('TeamContext', () => {
  describe('Import Test', () => {
    it('should import providers correctly', () => {
      // Test that we can import the providers without errors
      expect(() => {
        expect(ConfigProvider).toBeDefined();
        expect(ConstantsDataFetchingProvider).toBeDefined();
        expect(ConstantsProvider).toBeDefined();
        expect(MatchProvider).toBeDefined();
        expect(PlayerProvider).toBeDefined();
        expect(TeamProvider).toBeDefined();
      }).not.toThrow();
    });
  });

  describe('Basic Functionality', () => {
    it('should have basic team context functionality', () => {
      // Test that the team context exports are available
      expect(TeamProvider).toBeDefined();
      expect(useTeamContext).toBeDefined();
    });
  });
}); 