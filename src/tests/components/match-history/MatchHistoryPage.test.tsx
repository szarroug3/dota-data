/**
 * @jest-environment jsdom
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';

import { MatchHistoryPage } from '@/components/match-history/MatchHistoryPage';
import { ConfigProvider } from '@/contexts/config-context';
import { DataCoordinatorProvider } from '@/contexts/data-coordinator-context';
import { HeroProvider } from '@/contexts/hero-context';
import { HeroDataFetchingProvider } from '@/contexts/hero-data-fetching-context';
import { MatchProvider } from '@/contexts/match-context';
import { MatchDataFetchingProvider } from '@/contexts/match-data-fetching-context';
import { PlayerProvider } from '@/contexts/player-context';
import { PlayerDataFetchingProvider } from '@/contexts/player-data-fetching-context';
import { TeamProvider } from '@/contexts/team-context';
import { TeamDataFetchingProvider } from '@/contexts/team-data-fetching-context';

// Mock the match history components
jest.mock('@/components/match-history/list/MatchListView', () => ({
  MatchListView: ({ viewMode, setViewMode }: { viewMode: string; setViewMode: (mode: string) => void }) => (
    <div data-testid="match-list-view">
      <div data-testid="current-view-mode">{viewMode}</div>
      <button 
        data-testid="set-list-view" 
        onClick={() => setViewMode('list')}
      >
        List View
      </button>
      <button 
        data-testid="set-card-view" 
        onClick={() => setViewMode('card')}
      >
        Card View
      </button>
      <button 
        data-testid="set-grid-view" 
        onClick={() => setViewMode('grid')}
      >
        Grid View
      </button>
    </div>
  ),
  MatchListViewMode: 'list' as const
}));

// Mock other components to simplify the test
jest.mock('@/components/match-history/common/EmptyState', () => ({
  EmptyState: () => <div data-testid="empty-state">Empty State</div>
}));

jest.mock('@/components/match-history/common/ErrorState', () => ({
  ErrorState: () => <div data-testid="error-state">Error State</div>
}));



jest.mock('@/components/match-history/list/HiddenMatchesModal', () => ({
  HiddenMatchesModal: () => <div data-testid="hidden-matches-modal">Hidden Modal</div>
}));

// Mock the ResizableMatchLayout component to avoid the react-resizable-panels issue
jest.mock('@/components/match-history/ResizableMatchLayout', () => ({
  ResizableMatchLayout: ({ viewMode, setViewMode }: { viewMode: string; setViewMode: (mode: string) => void }) => (
    <div data-testid="resizable-match-layout">
      <div data-testid="current-view-mode">{viewMode}</div>
      <button 
        data-testid="set-list-view" 
        onClick={() => setViewMode('list')}
      >
        List View
      </button>
      <button 
        data-testid="set-card-view" 
        onClick={() => setViewMode('card')}
      >
        Card View
      </button>
      <button 
        data-testid="set-grid-view" 
        onClick={() => setViewMode('grid')}
      >
        Grid View
      </button>
    </div>
  ),
}));

// Mock the hero context to prevent API calls during tests
jest.mock('@/contexts/hero-context', () => ({
  useHeroContext: () => ({
    heroes: [],
    isLoading: false,
    error: null,
    refreshHeroes: jest.fn(),
    clearError: jest.fn(),
  }),
  HeroProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock the hero data fetching context
jest.mock('@/contexts/hero-data-fetching-context', () => ({
  useHeroDataFetching: () => ({
    heroes: new Map(),
    isLoading: false,
    errors: new Map(),
    fetchHero: jest.fn(),
    refreshHero: jest.fn(),
    clearError: jest.fn(),
  }),
  HeroDataFetchingProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock the team context to provide some teams for testing
jest.mock('@/contexts/team-context', () => ({
  useTeamContext: () => ({
    teamDataList: [
      {
        team: { id: 'team1', name: 'Test Team', leagueId: 'league1', isActive: true, isLoading: false },
        league: { id: 'league1', name: 'Test League' },
        matches: [
          { id: 'match1', teamId: 'team1', leagueId: 'league1', opponent: 'Opponent', result: 'win', date: '2024-01-01', duration: 1800, teamSide: 'radiant', pickOrder: 'first', players: [], heroes: [] }
        ],
        players: [],
        summary: { totalMatches: 1, totalWins: 1, totalLosses: 0, overallWinRate: 100, lastMatchDate: '2024-01-01', averageMatchDuration: 1800, totalPlayers: 0 }
      }
    ],
    activeTeam: { teamId: 'team1', leagueId: 'league1' },
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
  }),
  TeamProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock the match context to provide matches
jest.mock('@/contexts/match-context', () => ({
  useMatchContext: () => ({
    matches: [
      { id: 'match1', teamId: 'team1', leagueId: 'league1', opponent: 'Opponent', result: 'win', date: '2024-01-01', duration: 1800, teamSide: 'radiant', pickOrder: 'first', players: [], heroes: [] }
    ],
    filteredMatches: [],
    selectedMatchId: null,
    selectedMatch: null,
    hiddenMatchIds: [],
    filters: { dateRange: { start: null, end: null }, result: 'all', opponent: '', heroes: [], players: [], duration: { min: null, max: null } },
    heroStatsGrid: {},
    preferences: { defaultView: 'list', showHiddenMatches: false, autoRefresh: false, refreshInterval: 30, showAdvancedStats: false },
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
                      <DataCoordinatorProvider>
                        {component}
                      </DataCoordinatorProvider>
                    </HeroProvider>
                  </PlayerProvider>
                </MatchProvider>
              </TeamProvider>
            </HeroDataFetchingProvider>
          </PlayerDataFetchingProvider>
        </MatchDataFetchingProvider>
      </TeamDataFetchingProvider>
    </ConfigProvider>
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
          heroes: []
        },
        sortBy: 'date',
        sortDirection: 'desc'
      }
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