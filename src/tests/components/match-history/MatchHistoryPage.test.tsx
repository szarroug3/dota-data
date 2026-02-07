/**
 * @jest-environment jsdom
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';

import { ConfigProvider } from '@/frontend/contexts/config-context';
import type { HeroSummaryEntry } from '@/frontend/lib/app-data/app-data-types';
import { MatchHistoryPageContainer } from '@/frontend/matches/components/containers/MatchHistoryPageContainer';

// Remove data coordinator dependency (no longer used)
const DataCoordinatorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => <>{children}</>;

// Mock the match history components
jest.mock('@/frontend/matches/components/list/MatchListView', () => ({
  MatchListView: ({ viewMode, setViewMode }: { viewMode: string; setViewMode: (mode: string) => void }) => (
    <div data-testid="match-list-view">
      <div data-testid="current-view-mode">{viewMode}</div>
      <button data-testid="set-list-view" onClick={() => setViewMode('list')}>
        List View
      </button>
      <button data-testid="set-card-view" onClick={() => setViewMode('card')}>
        Card View
      </button>
    </div>
  ),
  MatchListViewMode: 'list' as const,
}));

// Mock config context to provide an active team so the page renders main layout
jest.mock('@/frontend/contexts/config-context', () => ({
  useConfigContext: () => ({
    activeTeam: { teamId: 'team1', leagueId: 'league1' },
    getTeams: () => new Map(),
    isLoading: false,
    config: { preferredMatchlistView: 'list' },
    setTeams: jest.fn(),
    setActiveTeam: jest.fn(),
    updateConfig: jest.fn(),
    resetConfig: jest.fn(),
    clearErrors: jest.fn(),
    error: null,
    isSaving: false,
  }),
  ConfigProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock other components to simplify the test
jest.mock('@/frontend/matches/components/stateless/common/EmptyState', () => ({
  EmptyState: () => <div data-testid="empty-state">Empty State</div>,
}));

jest.mock('@/frontend/matches/components/stateless/common/ErrorState', () => ({
  ErrorState: () => <div data-testid="error-state">Error State</div>,
}));

jest.mock('@/frontend/matches/components/stateless/HiddenMatchesModal', () => ({
  HiddenMatchesModal: () => <div data-testid="hidden-matches-modal">Hidden Modal</div>,
}));

// Mock the ResizableMatchLayout component to avoid the react-resizable-panels issue
jest.mock('@/frontend/matches/components/containers/ResizableMatchLayout', () => ({
  ResizableMatchLayout: ({ viewMode, setViewMode }: { viewMode: string; setViewMode: (mode: string) => void }) => (
    <div data-testid="resizable-match-layout">
      <div data-testid="current-view-mode">{viewMode}</div>
      <button data-testid="set-list-view" onClick={() => setViewMode('list')}>
        List View
      </button>
      <button data-testid="set-card-view" onClick={() => setViewMode('card')}>
        Card View
      </button>
    </div>
  ),
}));

// Mock AppData context instead of old contexts
jest.mock('@/contexts/app-data-context', () => ({
  useAppData: () => ({
    state: {
      selectedTeamId: 'team1-league1',
    },
    teams: new Map([
      [
        'team1-league1',
        {
          teamId: 'team1',
          leagueId: 'league1',
          name: 'Test Team',
          leagueName: 'Test League',
          isLoading: false,
          performance: {
            totalMatches: 0,
            totalWins: 0,
            totalLosses: 0,
            overallWinRate: 0,
            currentWinStreak: 0,
            currentLoseStreak: 0,
            averageMatchDuration: 0,
            averageKills: 0,
            averageDeaths: 0,
            averageGold: 0,
            averageExperience: 0,
          },
        },
      ],
    ]),
    matches: new Map(),
    players: new Map(),
    heroes: new Map([
      [
        1,
        {
          id: 1,
          name: 'Hero',
          localizedName: 'Hero',
          primaryAttribute: 'strength',
          attackType: 'melee',
          roles: [],
          imageUrl: '',
        },
      ],
    ]),
    items: new Map([
      [
        1,
        {
          id: 1,
          name: 'Item',
          localizedName: 'Item',
          cost: 0,
          secretShop: false,
          sideShop: false,
          recipe: false,
          imageUrl: '',
        },
      ],
    ]),
    leagues: new Map(),
    getTeam: jest.fn((teamId: string) => {
      if (teamId === 'team1-league1') {
        return {
          teamId: 'team1',
          leagueId: 'league1',
          name: 'Test Team',
        };
      }
      return undefined;
    }),
    getTeamMatchesWithPlaceholders: jest.fn(() => []),
    getTeamMatchesMetadata: jest.fn(() => new Map()),
    getMatch: jest.fn(() => null),
    getHiddenMatches: jest.fn(() => []),
    getHighPerformingHeroIdsForTeam: jest.fn(() => new Set()),
    getMatchHistoryData: jest.fn(() => ({
      activeTeamMatches: [],
      teamMatches: new Map(),
      filteredMatches: [],
      visibleMatches: [],
      unhiddenMatches: [],
      selectedMatch: null,
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
    filterHeroSummaryByHighPerformers: jest.fn((entries: HeroSummaryEntry[]) => entries),
    sortHeroSummaryEntries: jest.fn((entries: HeroSummaryEntry[]) => entries),
    hideMatch: jest.fn(),
    unhideMatch: jest.fn(),
    addManualMatchToTeam: jest.fn(),
    refreshMatch: jest.fn(),
    teamHasMatch: jest.fn(() => false),
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
  }),
}));

// Mock useViewMode to simulate localStorage preference and allow state updates
jest.mock('@/hooks/layout/useViewMode', () => {
  return (defaultMode: string = 'list') => {
    const [viewMode, setViewMode] = React.useState(defaultMode);
    return {
      viewMode,
      setViewMode,
    };
  };
});

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <ConfigProvider>
      <DataCoordinatorProvider>{component}</DataCoordinatorProvider>
    </ConfigProvider>,
  );
};

describe('MatchHistoryPage', () => {
  it('should initialize with default view mode from config', () => {
    renderWithProviders(<MatchHistoryPageContainer />);

    // Should show the default view mode (list)
    expect(screen.getByTestId('current-view-mode')).toHaveTextContent('list');
  });

  it('should update view mode when changed', async () => {
    renderWithProviders(<MatchHistoryPageContainer />);

    // Change to card view
    fireEvent.click(screen.getByTestId('set-card-view'));

    await waitFor(() => {
      expect(screen.getByTestId('current-view-mode')).toHaveTextContent('card');
    });
  });

  it('should handle list and card view changes', async () => {
    renderWithProviders(<MatchHistoryPageContainer />);

    // Test list view
    fireEvent.click(screen.getByTestId('set-list-view'));
    await waitFor(() => {
      expect(screen.getByTestId('current-view-mode')).toHaveTextContent('list');
    });

    // Test card view
    fireEvent.click(screen.getByTestId('set-card-view'));
    await waitFor(() => {
      expect(screen.getByTestId('current-view-mode')).toHaveTextContent('card');
    });
  });
});
