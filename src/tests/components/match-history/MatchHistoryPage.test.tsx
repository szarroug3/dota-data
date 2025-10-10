/**
 * @jest-environment jsdom
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';

import { ConfigProvider } from '@/frontend/contexts/config-context';
import { MatchHistoryPageContainer } from '@/frontend/matches/components/containers/MatchHistoryPageContainer';

const mockTeam = {
  id: 'team1',
  teamId: 12345,
  leagueId: 67890,
  name: 'Test Team',
  leagueName: 'Test League',
  matches: new Map<number, any>(),
  players: new Map(),
  createdAt: Date.now(),
  updatedAt: Date.now(),
  timeAdded: Date.now(),
  isLoading: false,
  isGlobal: false,
  highPerformingHeroes: new Set<string>(),
  manualPlayerIds: [] as number[],
  performance: {
    totalMatches: 0,
    totalWins: 0,
    totalLosses: 0,
    overallWinRate: 0,
    erroredMatches: 0,
    totalDurationSeconds: 0,
    averageMatchDurationSeconds: 0,
    manualMatchCount: 0,
    manualPlayerCount: 0,
  },
};

const mockAppData = {
  state: {
    selectedTeamId: mockTeam.id,
    selectedTeamIdParsed: { teamId: mockTeam.teamId, leagueId: mockTeam.leagueId },
    selectedMatchId: null as number | null,
    selectedPlayerId: null as number | null,
    isLoading: false,
    error: null,
  },
  teams: new Map([[mockTeam.id, mockTeam]]),
  matches: new Map<number, any>(),
  players: new Map(),
  heroes: new Map(),
  items: new Map(),
  leagues: new Map(),
  leagueMatchesCache: new Map([
    [
      mockTeam.leagueId,
      {
        matches: new Map(),
        matchIdsByTeam: new Map([[mockTeam.teamId, [] as number[]]]),
        fetchedAt: Date.now(),
      },
    ],
  ]),
  getTeam: jest.fn(() => mockTeam),
  getTeams: jest.fn(() => [mockTeam]),
  getMatch: jest.fn(() => null),
  getTeamMatchesMetadata: jest.fn(() => new Map()),
  teamHasMatch: jest.fn(() => false),
  getTeamHiddenPlayersForDisplay: jest.fn(() => []),
  hidePlayerOnTeam: jest.fn(),
  unhidePlayerOnTeam: jest.fn(),
  getTeamMatchesForDisplay: jest.fn(() => []),
  getTeamHiddenMatchesForDisplay: jest.fn(() => []),
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
  hideMatchOnTeam: jest.fn(),
  unhideMatchOnTeam: jest.fn(),
  refreshMatch: jest.fn(async () => undefined),
  addManualMatchToTeam: jest.fn(async () => undefined),
  removeManualMatchFromTeam: jest.fn(async () => undefined),
};

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
jest.mock('@/frontend/matches/components/stateless/ResizableMatchLayout', () => ({
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
  useAppData: () => mockAppData,
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
    localStorage.clear();
    jest.clearAllMocks();
    mockTeam.matches.clear();
    mockAppData.matches.clear();
    mockAppData.players.clear();
    mockAppData.heroes.clear();
    mockAppData.items.clear();
    mockAppData.leagues.clear();
    mockAppData.teams.clear();
    mockAppData.teams.set(mockTeam.id, mockTeam);
    mockAppData.leagueMatchesCache.clear();
    mockAppData.leagueMatchesCache.set(mockTeam.leagueId, {
      matches: new Map(),
      matchIdsByTeam: new Map([[mockTeam.teamId, [] as number[]]]),
      fetchedAt: Date.now(),
    });
    mockAppData.state.selectedTeamId = mockTeam.id;
    mockAppData.getTeam.mockReturnValue(mockTeam);
    mockAppData.getTeams.mockReturnValue([mockTeam]);
    mockAppData.getMatch.mockReturnValue(null);
    mockAppData.getTeamMatchesMetadata.mockReturnValue(new Map());
    mockAppData.teamHasMatch.mockReturnValue(false);
  });

  afterEach(() => {
    // Clear localStorage after each test
    localStorage.clear();
  });

  it('should initialize with default view mode from config', () => {
    renderWithProviders(<MatchHistoryPageContainer />);

    // Should show the default view mode (list)
    expect(screen.getByTestId('current-view-mode')).toHaveTextContent('list');
  });

  it('should persist view mode changes to localStorage', async () => {
    renderWithProviders(<MatchHistoryPageContainer />);

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

    renderWithProviders(<MatchHistoryPageContainer />);

    // Should load the saved view mode
    expect(screen.getByTestId('current-view-mode')).toHaveTextContent('grid');
  });

  it('should handle all view mode changes', async () => {
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

    // Test grid view
    fireEvent.click(screen.getByTestId('set-grid-view'));
    await waitFor(() => {
      expect(screen.getByTestId('current-view-mode')).toHaveTextContent('grid');
    });
  });
});
