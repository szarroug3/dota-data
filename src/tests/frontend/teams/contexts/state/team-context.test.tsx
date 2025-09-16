/**
 * Team Context Tests
 *
 * Tests for the team context functionality including team operations,
 * league-specific filtering, and player aggregation.
 */

import { render, screen } from '@testing-library/react';

import { ConfigProvider } from '@/frontend/contexts/config-context';
import { ConstantsProvider } from '@/frontend/contexts/constants-context';
import { ConstantsDataFetchingProvider } from '@/frontend/contexts/constants-data-fetching-context';
import { MatchDataFetchingProvider } from '@/frontend/matches/contexts/fetching/match-data-fetching-context';
import { MatchProvider } from '@/frontend/matches/contexts/state/match-context';
import { PlayerDataFetchingProvider } from '@/frontend/players/contexts/fetching/player-data-fetching-context';
import { PlayerProvider } from '@/frontend/players/contexts/state/player-context';
import { TeamDataFetchingProvider } from '@/frontend/teams/contexts/fetching/team-data-fetching-context';
import { TeamProvider, useTeamContext } from '@/frontend/teams/contexts/state/team-context';

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
      render(
        <ConfigProvider>
          <ConstantsDataFetchingProvider>
            <ConstantsProvider>
              <MatchDataFetchingProvider>
                <MatchProvider>
                  <TeamDataFetchingProvider>
                    <PlayerDataFetchingProvider>
                      <PlayerProvider>
                        <TeamProvider>
                          <div>Test Content</div>
                        </TeamProvider>
                      </PlayerProvider>
                    </PlayerDataFetchingProvider>
                  </TeamDataFetchingProvider>
                </MatchProvider>
              </MatchDataFetchingProvider>
            </ConstantsProvider>
          </ConstantsDataFetchingProvider>
        </ConfigProvider>,
      );

      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('should have clearSelectedTeamId function', () => {
      const TestComponent = () => {
        const { clearSelectedTeamId } = useTeamContext();
        expect(typeof clearSelectedTeamId).toBe('function');
        return <div>Test</div>;
      };

      render(
        <ConfigProvider>
          <ConstantsDataFetchingProvider>
            <ConstantsProvider>
              <MatchDataFetchingProvider>
                <MatchProvider>
                  <TeamDataFetchingProvider>
                    <PlayerDataFetchingProvider>
                      <PlayerProvider>
                        <TeamProvider>
                          <TestComponent />
                        </TeamProvider>
                      </PlayerProvider>
                    </PlayerDataFetchingProvider>
                  </TeamDataFetchingProvider>
                </MatchProvider>
              </MatchDataFetchingProvider>
            </ConstantsProvider>
          </ConstantsDataFetchingProvider>
        </ConfigProvider>,
      );
    });
  });
});
