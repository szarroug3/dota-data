import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';

import { ConfigProvider, useConfigContext } from '@/frontend/contexts/config-context';
import { ThemeContextProvider, useThemeContext } from '@/frontend/contexts/theme-context';
import { AppLoader } from '@/frontend/shared/layout/AppLoader';

// Mock AppData context instead of old team context
jest.mock('@/contexts/app-data-context', () => ({
  useAppData: () => ({
    teams: new Map(),
    matches: new Map(),
    players: new Map(),
    heroes: new Map(),
    items: new Map(),
    leagues: new Map(),
    selectedTeamId: null,
    setSelectedTeamId: jest.fn(),
    addTeam: jest.fn(),
    updateTeam: jest.fn(),
    removeTeam: jest.fn(),
    addMatch: jest.fn(),
    updateMatch: jest.fn(),
    removeMatch: jest.fn(),
    addPlayer: jest.fn(),
    updatePlayer: jest.fn(),
    removePlayer: jest.fn(),
    loadTeamData: jest.fn(),
    loadMatchData: jest.fn(),
    loadPlayerData: jest.fn(),
    loadHeroesData: jest.fn(),
    loadItemsData: jest.fn(),
    loadLeaguesData: jest.fn(),
    getTeamMatchesForDisplay: jest.fn(() => []),
    getTeamPlayersForDisplay: jest.fn(() => []),
    getTeamPlayersSortedForDisplay: jest.fn(() => []),
    getTeamHiddenPlayersForDisplay: jest.fn(() => []),
    hidePlayerOnTeam: jest.fn(),
    unhidePlayerOnTeam: jest.fn(),
    getTeamPlayersSortedForDisplay: jest.fn(() => []),
    getTeamMatchFilters: jest.fn(() => ({
      filteredMatches: [],
      filterStats: {
        totalMatches: 0,
        filteredMatches: 0,
        filterBreakdown: {
          dateRange: 0,
          result: 0,
          teamSide: 0,
          pickOrder: 0,
          heroesPlayed: 0,
          opponent: 0,
          highPerformersOnly: 0,
        },
      },
    })),
    getTeamHeroSummaryForMatches: jest.fn(() => ({
      matchesCount: 0,
      activeTeamPicks: [],
      opponentTeamPicks: [],
      activeTeamBans: [],
      opponentTeamBans: [],
    })),
  }),
}));

// Mock the contexts
jest.mock('@/frontend/contexts/theme-context', () => ({
  useThemeContext: jest.fn(),
  ThemeContextProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="theme-provider">{children}</div>
  ),
}));

jest.mock('@/frontend/contexts/config-context', () => ({
  useConfigContext: jest.fn(),
  ConfigProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="config-provider">{children}</div>,
}));

describe('AppLoader', () => {
  it('should show blank screen while loading', () => {
    (useThemeContext as jest.Mock).mockReturnValue({ isThemeLoading: true });
    (useConfigContext as jest.Mock).mockReturnValue({ isLoading: true });

    render(
      <ThemeContextProvider>
        <ConfigProvider>
          <AppLoader>
            <div data-testid="app-content">App Content</div>
          </AppLoader>
        </ConfigProvider>
      </ThemeContextProvider>,
    );

    // Should show blank screen (no content)
    expect(screen.queryByTestId('app-content')).not.toBeInTheDocument();
    expect(screen.queryByTestId('loading-skeleton')).not.toBeInTheDocument();
  });

  it('should render app content after loading is complete', async () => {
    (useThemeContext as jest.Mock).mockReturnValue({ isThemeLoading: false });
    (useConfigContext as jest.Mock).mockReturnValue({ isLoading: false });

    render(
      <ThemeContextProvider>
        <ConfigProvider>
          <AppLoader>
            <div data-testid="app-content">App Content</div>
          </AppLoader>
        </ConfigProvider>
      </ThemeContextProvider>,
    );

    // Should render app content after loading
    await waitFor(() => {
      expect(screen.getByText('App Content')).toBeInTheDocument();
    });
  });
});
