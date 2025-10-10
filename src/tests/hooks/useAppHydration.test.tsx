/**
 * App Hydration Hook Tests
 *
 * Tests the app hydration hook's ability to coordinate data loading across
 * multiple contexts during application startup.
 */

import { render, screen, waitFor } from '@testing-library/react';

import { useConfigContext } from '@/frontend/contexts/config-context';
import { useAppHydration } from '@/hooks/useAppHydration';

jest.mock('@/frontend/lib/app-data-metadata-helpers', () => ({
  refreshTeamsCachedMetadata: jest.fn(),
}));

const mockConfigContext = {
  getTeams: jest.fn(),
  setTeams: jest.fn(),
  activeTeam: null as { teamId: string; leagueId: string } | null,
  setActiveTeam: jest.fn(),
  config: {
    preferredExternalSite: 'dotabuff' as const,
    preferredMatchlistView: 'list' as const,
    theme: 'system' as const,
  },
  isLoading: false,
  isSaving: false,
  error: null,
  updateConfig: jest.fn(),
  resetConfig: jest.fn(),
  clearErrors: jest.fn(),
};

const mockAppData = {
  state: {
    selectedTeamId: '0-0',
    selectedTeamIdParsed: { teamId: 0, leagueId: 0 },
    selectedMatchId: null,
    selectedPlayerId: null,
    isLoading: false,
    error: null,
  },
  teams: new Map(),
  matches: new Map(),
  players: new Map(),
  heroes: new Map(),
  items: new Map(),
  leagues: new Map(),
  getTeams: jest.fn(() => [] as Array<{ id: string; teamId: number; leagueId: number; isGlobal?: boolean }>),
  getTeam: jest.fn(),
  loadFromStorage: jest.fn(async () => ({ activeTeam: null, otherTeams: [] })),
  loadHeroesData: jest.fn(async () => undefined),
  loadItemsData: jest.fn(async () => undefined),
  loadLeaguesData: jest.fn(async () => undefined),
  refreshTeam: jest.fn(async () => undefined),
  loadAllManualMatches: jest.fn(async () => undefined),
  loadAllManualPlayers: jest.fn(async () => undefined),
  loadTeam: jest.fn(async () => undefined),
  loadTeamMatches: jest.fn(async () => undefined),
  loadMatch: jest.fn(async () => undefined),
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
  getTeamPlayersForDisplay: jest.fn(() => []),
  getTeamPlayersSortedForDisplay: jest.fn(() => []),
  getTeamHiddenPlayersForDisplay: jest.fn(() => []),
  hidePlayerOnTeam: jest.fn(),
  unhidePlayerOnTeam: jest.fn(),
  getTeamMatchesForDisplay: jest.fn(() => []),
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
};

jest.mock('@/contexts/app-data-context', () => ({
  useAppData: () => mockAppData,
}));

jest.mock('@/frontend/contexts/config-context');

// Test component to render the hook
function TestComponent() {
  const { hasHydrated, hydrationError } = useAppHydration();

  return (
    <div>
      <div data-testid="has-hydrated">{hasHydrated.toString()}</div>
      <div data-testid="is-hydrating">false</div>
      <div data-testid="hydration-error">{hydrationError || 'none'}</div>
    </div>
  );
}

describe('useAppHydration', () => {
beforeEach(() => {
  jest.clearAllMocks();

  mockAppData.heroes.clear();
  mockAppData.items.clear();
  mockAppData.leagues.clear();
  mockAppData.getTeams.mockReset();
  mockAppData.getTeams.mockReturnValue([]);
  mockAppData.getTeam.mockReset();
  mockAppData.loadFromStorage.mockReset();
  mockAppData.loadFromStorage.mockResolvedValue({ activeTeam: null, otherTeams: [] });
  mockAppData.loadHeroesData.mockReset();
  mockAppData.loadHeroesData.mockResolvedValue(undefined);
  mockAppData.loadItemsData.mockReset();
  mockAppData.loadItemsData.mockResolvedValue(undefined);
  mockAppData.loadLeaguesData.mockReset();
  mockAppData.loadLeaguesData.mockResolvedValue(undefined);
  mockAppData.refreshTeam.mockReset();
  mockAppData.refreshTeam.mockResolvedValue(undefined);
  mockAppData.loadAllManualMatches.mockReset();
  mockAppData.loadAllManualMatches.mockResolvedValue(undefined);
  mockAppData.loadAllManualPlayers.mockReset();
  mockAppData.loadAllManualPlayers.mockResolvedValue(undefined);
  mockAppData.loadTeam.mockReset();
  mockAppData.loadTeam.mockResolvedValue(undefined);
  mockAppData.loadTeamMatches.mockReset();
  mockAppData.loadTeamMatches.mockResolvedValue(undefined);
  mockAppData.loadMatch.mockReset();
  mockAppData.loadMatch.mockResolvedValue(undefined);

  mockAppData.state.selectedTeamId = '0-0';

  mockConfigContext.getTeams.mockReset();
  mockConfigContext.getTeams.mockReturnValue(new Map());
  mockConfigContext.setTeams.mockReset();
  mockConfigContext.activeTeam = null;
  mockConfigContext.setActiveTeam.mockReset();
  mockConfigContext.updateConfig.mockReset();
  mockConfigContext.resetConfig.mockReset();
  mockConfigContext.clearErrors.mockReset();

  (useConfigContext as jest.Mock).mockReturnValue(mockConfigContext);
});

  it('should surface errors during initial hydration', async () => {
    mockAppData.loadHeroesData.mockRejectedValueOnce(new Error('Test error'));
    render(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByTestId('hydration-error')).toHaveTextContent('Test error');
    });
  });

  it('should complete hydration successfully with no teams', async () => {
    render(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByTestId('has-hydrated')).toHaveTextContent('true');
      expect(mockAppData.loadHeroesData).toHaveBeenCalled();
      expect(mockAppData.loadItemsData).toHaveBeenCalled();
      expect(mockAppData.loadLeaguesData).toHaveBeenCalled();
    });

    expect(mockAppData.loadFromStorage).toHaveBeenCalled();
  });

  it('refreshes existing teams returned by app data', async () => {
    mockAppData.state.selectedTeamId = '123-456';
    mockAppData.getTeams.mockReturnValue([
      { id: '123-456', teamId: 123, leagueId: 456, isGlobal: false } as any,
    ]);

    render(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByTestId('has-hydrated')).toHaveTextContent('true');
    });

    expect(mockAppData.refreshTeam).toHaveBeenCalledWith(123, 456);
  });

  it('should be resilient when active team exists (no crash)', async () => {
    mockConfigContext.activeTeam = { teamId: 'team1', leagueId: 'league1' };
    render(<TestComponent />);
    await waitFor(() => {
      expect(screen.getByTestId('has-hydrated')).toHaveTextContent('true');
    });
  });

  it('should handle errors during constants fetching', async () => {
    mockAppData.loadHeroesData.mockRejectedValueOnce(new Error('Heroes fetch failed'));

    render(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByTestId('hydration-error')).toHaveTextContent('Heroes fetch failed');
    });
  });

  it('loads the active team from config when provided', async () => {
    mockConfigContext.activeTeam = { teamId: 7, leagueId: 8 };
    render(<TestComponent />);
    await waitFor(() => {
      expect(mockAppData.loadTeam).toHaveBeenCalledWith(7, 8);
    });
  });

  it('should handle errors during manual data loading', async () => {
    mockAppData.getTeams.mockReturnValue([
      { id: '123-456', teamId: 123, leagueId: 456, isGlobal: false } as any,
    ]);
    mockAppData.loadAllManualMatches.mockRejectedValueOnce(new Error('Manual matches failed'));

    render(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByTestId('hydration-error')).toHaveTextContent('Manual matches failed');
    });

    expect(mockAppData.loadAllManualMatches).toHaveBeenCalled();
  });

  it('should prevent multiple hydration runs', async () => {
    render(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByTestId('has-hydrated')).toHaveTextContent('true');
      expect(mockAppData.loadHeroesData).toHaveBeenCalledTimes(1);
      expect(mockAppData.loadItemsData).toHaveBeenCalledTimes(1);
    });
  });
});
