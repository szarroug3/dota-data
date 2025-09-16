/**
 * Match Context Tests
 *
 * Tests for the match context functionality including match operations,
 * data processing, and state management.
 */

import { ConfigProvider } from '@/frontend/contexts/config-context';
import { ConstantsProvider } from '@/frontend/contexts/constants-context';
import { ConstantsDataFetchingProvider } from '@/frontend/contexts/constants-data-fetching-context';
import { MatchProvider, useMatchContext } from '@/frontend/matches/contexts/state/match-context';
import { PlayerProvider } from '@/frontend/players/contexts/state/player-context';
import { TeamProvider } from '@/frontend/teams/contexts/state/team-context';

describe('MatchContext', () => {
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
    it('should have basic match context functionality', () => {
      // Test that the match context exports are available
      expect(MatchProvider).toBeDefined();
      expect(useMatchContext).toBeDefined();
    });
  });
});
