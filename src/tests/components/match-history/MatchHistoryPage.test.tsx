/**
 * @jest-environment jsdom
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';

import { ConfigProvider } from '@/frontend/contexts/config-context';
import { MatchHistoryPage } from '@/frontend/matches/components/containers/MatchHistoryPage';

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
      <button data-testid="set-grid-view" onClick={() => setViewMode('grid')}>
        Grid View
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
      <button data-testid="set-grid-view" onClick={() => setViewMode('grid')}>
        Grid View
      </button>
    </div>
  ),
}));

// Mock AppData context instead of old contexts
jest.mock('@/contexts/app-data-context', () => ({
  useAppData: () => ({
    teams: new Map([
      [
        'team1',
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
  }),
}));

// Mock useViewMode to simulate localStorage preference and allow state updates
jest.mock('@/hooks/useViewMode', () => {
  return () => {
    const initial = (() => {
      let viewMode = 'list';
      const prefs = JSON.parse(localStorage.getItem('dota-scout-assistant-preferences') || '{}');
      if (prefs.matchHistory && prefs.matchHistory.defaultView) {
        viewMode = prefs.matchHistory.defaultView;
      }
      return viewMode;
    })();
    const [viewMode, setViewModeState] = React.useState(initial);
    const setViewMode = (mode: string) => {
      setViewModeState(mode);
      // Simulate updating localStorage like the real hook
      let prefs: any = {};
      prefs = JSON.parse(localStorage.getItem('dota-scout-assistant-preferences') || '{}');
      if (!prefs.matchHistory) prefs.matchHistory = {};
      prefs.matchHistory.defaultView = mode;
      localStorage.setItem('dota-scout-assistant-preferences', JSON.stringify(prefs));
    };
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
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    // Clear localStorage after each test
    localStorage.clear();
  });

  it('should initialize with default view mode from config', () => {
    renderWithProviders(<MatchHistoryPage />);

    // Should show the default view mode (list)
    expect(screen.getByTestId('current-view-mode')).toHaveTextContent('list');
  });

  it('should persist view mode changes to localStorage', async () => {
    renderWithProviders(<MatchHistoryPage />);

    // Change to card view
    fireEvent.click(screen.getByTestId('set-card-view'));

    await waitFor(() => {
      expect(screen.getByTestId('current-view-mode')).toHaveTextContent('card');
    });

    // Check that localStorage was updated
    const storedPreferences = JSON.parse(localStorage.getItem('dota-scout-assistant-preferences') || '{}');
    expect(storedPreferences.matchHistory?.defaultView).toBe('card');
  });

  it('should load saved view mode from localStorage on mount', () => {
    // Set up localStorage with a saved preference
    const savedPreferences = {
      matchHistory: {
        defaultView: 'grid',
        showHiddenMatches: false,
        defaultFilters: {
          dateRange: 30,
          result: 'all',
          heroes: [],
        },
        sortBy: 'date',
        sortDirection: 'desc',
      },
    };
    localStorage.setItem('dota-scout-assistant-preferences', JSON.stringify(savedPreferences));

    renderWithProviders(<MatchHistoryPage />);

    // Should load the saved view mode
    expect(screen.getByTestId('current-view-mode')).toHaveTextContent('grid');
  });

  it('should handle all view mode changes', async () => {
    renderWithProviders(<MatchHistoryPage />);

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

    // Test grid view
    fireEvent.click(screen.getByTestId('set-grid-view'));
    await waitFor(() => {
      expect(screen.getByTestId('current-view-mode')).toHaveTextContent('grid');
    });
  });
});
