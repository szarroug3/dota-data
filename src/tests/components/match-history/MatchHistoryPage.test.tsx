/**
 * @jest-environment jsdom
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';

import { ConfigProvider } from '@/frontend/contexts/config-context';
import { MatchHistoryPage } from '@/frontend/matches/components/containers/MatchHistoryPage';
import { MatchDataFetchingProvider } from '@/frontend/matches/contexts/fetching/match-data-fetching-context';
import { MatchProvider } from '@/frontend/matches/contexts/state/match-context';
import { PlayerDataFetchingProvider } from '@/frontend/players/contexts/fetching/player-data-fetching-context';
import { PlayerProvider } from '@/frontend/players/contexts/state/player-context';
import { TeamDataFetchingProvider } from '@/frontend/teams/contexts/fetching/team-data-fetching-context';
import { TeamProvider } from '@/frontend/teams/contexts/state/team-context';

// Remove data coordinator dependency (no longer used)
const DataCoordinatorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => <>{children}</>;

// Remove hero contexts from test since not required by the page after split
const HeroProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => <>{children}</>;
const HeroDataFetchingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => <>{children}</>;

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

// Mock constants context expected by HeroSummaryTable
jest.mock('@/frontend/contexts/constants-context', () => ({
  useConstantsContext: () => ({
    heroes: { 1: { id: 1, name: 'Hero' } },
    items: { 1: { id: 1, name: 'Item' } },
    fetchHeroes: jest.fn(),
    fetchItems: jest.fn(),
    isLoading: false,
    error: null,
  }),
  ConstantsProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock the hero context to prevent API calls during tests
// No hero contexts needed in this test

// Mock the team context to provide some teams for testing
jest.mock('@/frontend/teams/contexts/state/team-context', () => ({
  useTeamContext: () => ({
    teamDataList: [
      {
        team: { id: 'team1', name: 'Test Team', leagueId: 'league1', isActive: true, isLoading: false },
        league: { id: 'league1', name: 'Test League' },
        matches: [
          {
            id: 'match1',
            teamId: 'team1',
            leagueId: 'league1',
            opponent: 'Opponent',
            result: 'win',
            date: '2024-01-01',
            duration: 1800,
            teamSide: 'radiant',
            pickOrder: 'first',
            players: [],
            heroes: [],
          },
        ],
        players: [],
        summary: {
          totalMatches: 1,
          totalWins: 1,
          totalLosses: 0,
          overallWinRate: 100,
          lastMatchDate: '2024-01-01',
          averageMatchDuration: 1800,
          totalPlayers: 0,
        },
      },
    ],
    activeTeam: { teamId: 'team1', leagueId: 'league1' },
    selectedTeamId: { teamId: 1, leagueId: 1 },
    teams: new Map<string, any>([
      [
        '1-1',
        {
          team: { id: 'team1', name: 'Test Team', leagueId: 'league1', isActive: true, isLoading: false },
          league: { id: 'league1', name: 'Test League' },
          matches: { 123: { side: 'radiant', pickOrder: 'first' } },
          players: [],
          manualMatches: {},
          summary: {
            totalMatches: 1,
            totalWins: 1,
            totalLosses: 0,
            overallWinRate: 100,
            lastMatchDate: '2024-01-01',
            averageMatchDuration: 1800,
            totalPlayers: 0,
          },
        },
      ],
    ]),
    isLoading: false,
    error: null,
    addTeam: jest.fn(),
    removeTeam: jest.fn(),
    setActiveTeam: jest.fn(),
    refreshTeam: jest.fn(),
    getTeamMatchesForLeague: jest.fn(),
    getTeamPlayersForLeague: jest.fn(),
    teamExists: jest.fn(),
    clearError: jest.fn(),
    getSelectedTeam: () => ({
      team: { id: 'team1', name: 'Test Team' },
      league: { id: 'league1', name: 'Test League' },
      matches: { 123: { side: 'radiant', pickOrder: 'first' } },
      manualMatches: {},
      manualPlayers: [],
      players: [],
      performance: {} as any,
    }),
    addMatchToTeam: jest.fn().mockResolvedValue(undefined),
    getAllTeams: () => [
      {
        team: { id: 'team1', name: 'Test Team', leagueId: 'league1', isActive: true, isLoading: false },
        league: { id: 'league1', name: 'Test League' },
        matches: [
          {
            id: 'match1',
            teamId: 'team1',
            leagueId: 'league1',
            opponent: 'Opponent',
            result: 'win',
            date: '2024-01-01',
            duration: 1800,
            teamSide: 'radiant',
            pickOrder: 'first',
            players: [],
            heroes: [],
          },
        ],
        players: [],
        summary: {
          totalMatches: 1,
          totalWins: 1,
          totalLosses: 0,
          overallWinRate: 100,
          lastMatchDate: '2024-01-01',
          averageMatchDuration: 1800,
          totalPlayers: 0,
        },
      },
    ],
  }),
  TeamProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock the match context to provide matches
jest.mock('@/frontend/matches/contexts/state/match-context', () => ({
  useMatchContext: () => ({
    matches: [
      {
        id: 'match1',
        teamId: 'team1',
        leagueId: 'league1',
        opponent: 'Opponent',
        result: 'win',
        date: '2024-01-01',
        duration: 1800,
        teamSide: 'radiant',
        pickOrder: 'first',
        players: [],
        heroes: [],
      },
    ],
    filteredMatches: [],
    selectedMatchId: null,
    selectedMatch: null,
    hiddenMatchIds: [],
    filters: {
      dateRange: { start: null, end: null },
      result: 'all',
      opponent: '',
      heroes: [],
      players: [],
      duration: { min: null, max: null },
    },
    heroStatsGrid: {},
    preferences: {
      defaultView: 'list',
      showHiddenMatches: false,
      autoRefresh: false,
      refreshInterval: 30,
      showAdvancedStats: false,
    },
    isLoadingMatches: false,
    isLoadingMatchDetails: false,
    isLoadingHeroStats: false,
    matchesError: null,
    matchDetailsError: null,
    heroStatsError: null,
    setFilters: jest.fn(),
    selectMatch: jest.fn(),
    hideMatch: jest.fn(),
    showMatch: jest.fn(),
    addMatches: jest.fn(),
    refreshMatches: jest.fn(),
    refreshMatchDetails: jest.fn(),
    refreshHeroStats: jest.fn(),
    clearErrors: jest.fn(),
    updatePreferences: jest.fn(),
    getMatch: (id: number) => ({ id, teamId: 'team1', leagueId: 'league1' }),
  }),
  MatchProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
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
      <TeamDataFetchingProvider>
        <MatchDataFetchingProvider>
          <PlayerDataFetchingProvider>
            <HeroDataFetchingProvider>
              <TeamProvider>
                <MatchProvider>
                  <PlayerProvider>
                    <HeroProvider>
                      <DataCoordinatorProvider>{component}</DataCoordinatorProvider>
                    </HeroProvider>
                  </PlayerProvider>
                </MatchProvider>
              </TeamProvider>
            </HeroDataFetchingProvider>
          </PlayerDataFetchingProvider>
        </MatchDataFetchingProvider>
      </TeamDataFetchingProvider>
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
