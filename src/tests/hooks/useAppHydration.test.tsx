/**
 * App Hydration Hook Tests
 *
 * Tests the app hydration hook's ability to coordinate data loading across
 * multiple contexts during application startup.
 */

import { render, screen, waitFor } from '@testing-library/react';

import { useConfigContext } from '@/frontend/contexts/config-context';
import { useConstantsContext } from '@/frontend/contexts/constants-context';
import { useTeamContext } from '@/frontend/teams/contexts/state/team-context';
import { useAppHydration } from '@/hooks/useAppHydration';

// Mock the contexts
jest.mock('@/frontend/contexts/config-context');
jest.mock('@/frontend/contexts/constants-context');
jest.mock('@/frontend/teams/contexts/state/team-context');
jest.mock('@/frontend/matches/contexts/state/match-context', () => ({
  useMatchContext: () => ({}),
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

const mockConstantsContext = {
  heroes: { 1: { id: 1, name: 'Hero' } } as Record<string, any>,
  items: { 1: { id: 1, name: 'Item' } } as Record<string, any>,
  fetchHeroes: jest.fn(),
  fetchItems: jest.fn(),
  isLoading: false,
  error: null,
};

const mockTeamContext = {
  teams: new Map(),
  activeTeam: null,
  isLoading: false,
  error: null,
  addTeam: jest.fn(),
  refreshTeam: jest.fn(),
  refreshTeamSummary: jest.fn(),
  refreshAllTeamSummaries: jest.fn(),
  removeTeam: jest.fn(),
  editTeam: jest.fn(),
  setActiveTeam: jest.fn(),
  addMatchToTeam: jest.fn(),
  addPlayerToTeam: jest.fn(),
  setTeams: jest.fn(),
  loadTeamsFromConfig: jest.fn(),
  loadManualMatches: jest.fn(),
  loadManualPlayers: jest.fn(),
  getTeam: jest.fn(),
  getActiveTeam: jest.fn(),
  getAllTeams: jest.fn(),
  hideMatch: jest.fn(),
  showMatch: jest.fn(),
  hidePlayer: jest.fn(),
  showPlayer: jest.fn(),
};

// Test component to render the hook
function TestComponent() {
  const { hasHydrated, isHydrating, hydrationError } = useAppHydration();

  return (
    <div>
      <div data-testid="has-hydrated">{hasHydrated.toString()}</div>
      <div data-testid="is-hydrating">{isHydrating.toString()}</div>
      <div data-testid="hydration-error">{hydrationError || 'none'}</div>
    </div>
  );
}

describe('useAppHydration', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Reset mock implementations
    mockConstantsContext.fetchHeroes.mockResolvedValue(undefined);
    mockConstantsContext.fetchItems.mockResolvedValue(undefined);
    // Ensure constants appear available for the polling loop
    mockConstantsContext.heroes = { 1: { id: 1 } };
    mockConstantsContext.items = { 1: { id: 1 } };
    mockTeamContext.loadTeamsFromConfig.mockResolvedValue(undefined);
    mockTeamContext.addTeam.mockResolvedValue(undefined);
    mockTeamContext.refreshAllTeamSummaries.mockResolvedValue(undefined);
    mockTeamContext.loadManualMatches.mockResolvedValue(undefined);
    mockTeamContext.loadManualPlayers.mockResolvedValue(undefined);

    // Setup mocks
    (useConfigContext as jest.Mock).mockReturnValue(mockConfigContext);
    (useConstantsContext as jest.Mock).mockReturnValue(mockConstantsContext);
    (useTeamContext as jest.Mock).mockReturnValue(mockTeamContext);
  });

  it('should initialize with default hydration state', async () => {
    mockConstantsContext.fetchHeroes.mockRejectedValue(new Error('Test error'));
    render(<TestComponent />);
    expect(screen.getByTestId('has-hydrated')).toHaveTextContent('false');
    await waitFor(() => {
      expect(screen.getByTestId('hydration-error')).toHaveTextContent('Test error');
    });
  });

  it('should complete hydration successfully with no teams', async () => {
    render(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByTestId('has-hydrated')).toHaveTextContent('true');
    });

    expect(mockConstantsContext.fetchHeroes).toHaveBeenCalled();
    expect(mockConstantsContext.fetchItems).toHaveBeenCalled();
    expect(mockTeamContext.loadTeamsFromConfig).not.toHaveBeenCalled();
    expect(mockTeamContext.addTeam).not.toHaveBeenCalled();
  });

  it('should load teams from config when teams exist', async () => {
    const mockTeams = new Map();
    mockTeams.set('team1-league1', {
      team: { id: 'team1', name: 'Team 1', isActive: true, isLoading: false },
      league: { id: 'league1', name: 'League 1' },
      timeAdded: Date.now(),
      matches: [],
      players: [],
      performance: {
        totalMatches: 0,
        totalWins: 0,
        totalLosses: 0,
        overallWinRate: 0,
        heroUsage: { picks: [], bans: [], picksAgainst: [], bansAgainst: [], picksByPlayer: {} },
        draftStats: {
          firstPickCount: 0,
          secondPickCount: 0,
          firstPickWinRate: 0,
          secondPickWinRate: 0,
          uniqueHeroesPicked: 0,
          uniqueHeroesBanned: 0,
          mostPickedHero: '',
          mostBannedHero: '',
        },
        currentWinStreak: 0,
        currentLoseStreak: 0,
        averageMatchDuration: 0,
        averageKills: 0,
        averageDeaths: 0,
        averageGold: 0,
        averageExperience: 0,
      },
    });
    mockConfigContext.getTeams.mockReturnValue(mockTeams);

    render(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByTestId('has-hydrated')).toHaveTextContent('true');
    });

    expect(mockTeamContext.loadTeamsFromConfig).toHaveBeenCalledWith(mockTeams);
    expect(mockTeamContext.refreshAllTeamSummaries).toHaveBeenCalled();
  });

  it('should be resilient when active team exists (no crash)', async () => {
    mockConfigContext.activeTeam = { teamId: 'team1', leagueId: 'league1' };
    render(<TestComponent />);
    await waitFor(() => {
      expect(screen.getByTestId('has-hydrated')).toHaveTextContent('true');
    });
  });

  it('should handle errors during constants fetching', async () => {
    mockConstantsContext.fetchHeroes.mockRejectedValue(new Error('Heroes fetch failed'));

    render(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByTestId('hydration-error')).toHaveTextContent('Heroes fetch failed');
    });
  });

  it('should handle errors during team loading', async () => {
    const mockTeams = new Map();
    mockTeams.set('team1-league1', {
      team: { id: 'team1', name: 'Team 1', isActive: true, isLoading: false },
      league: { id: 'league1', name: 'League 1' },
      timeAdded: Date.now(),
      matches: [],
      players: [],
      performance: {
        totalMatches: 0,
        totalWins: 0,
        totalLosses: 0,
        overallWinRate: 0,
        heroUsage: { picks: [], bans: [], picksAgainst: [], bansAgainst: [], picksByPlayer: {} },
        draftStats: {
          firstPickCount: 0,
          secondPickCount: 0,
          firstPickWinRate: 0,
          secondPickWinRate: 0,
          uniqueHeroesPicked: 0,
          uniqueHeroesBanned: 0,
          mostPickedHero: '',
          mostBannedHero: '',
        },
        currentWinStreak: 0,
        currentLoseStreak: 0,
        averageMatchDuration: 0,
        averageKills: 0,
        averageDeaths: 0,
        averageGold: 0,
        averageExperience: 0,
      },
    });
    mockConfigContext.getTeams.mockReturnValue(mockTeams);
    mockTeamContext.loadTeamsFromConfig.mockRejectedValue(new Error('Team loading failed'));

    render(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByTestId('hydration-error')).toHaveTextContent('Team loading failed');
    });
  });

  it('should handle errors during manual data loading', async () => {
    const mockTeams = new Map();
    mockTeams.set('team1-league1', {
      team: { id: 'team1', name: 'Team 1', isActive: true, isLoading: false },
      league: { id: 'league1', name: 'League 1' },
      timeAdded: Date.now(),
      matches: [],
      players: [],
      performance: {
        totalMatches: 0,
        totalWins: 0,
        totalLosses: 0,
        overallWinRate: 0,
        heroUsage: { picks: [], bans: [], picksAgainst: [], bansAgainst: [], picksByPlayer: {} },
        draftStats: {
          firstPickCount: 0,
          secondPickCount: 0,
          firstPickWinRate: 0,
          secondPickWinRate: 0,
          uniqueHeroesPicked: 0,
          uniqueHeroesBanned: 0,
          mostPickedHero: '',
          mostBannedHero: '',
        },
        currentWinStreak: 0,
        currentLoseStreak: 0,
        averageMatchDuration: 0,
        averageKills: 0,
        averageDeaths: 0,
        averageGold: 0,
        averageExperience: 0,
      },
    });
    mockConfigContext.getTeams.mockReturnValue(mockTeams);
    mockTeamContext.loadTeamsFromConfig.mockResolvedValue(undefined);
    mockTeamContext.loadManualMatches.mockRejectedValue(new Error('Manual matches failed'));

    render(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByTestId('hydration-error')).toHaveTextContent('Manual matches failed');
    });
  });

  it('should prevent multiple hydration runs', async () => {
    render(<TestComponent />);

    // Wait for first hydration to complete
    await waitFor(() => {
      expect(screen.getByTestId('has-hydrated')).toHaveTextContent('true');
    });

    // Verify hydration was only called once
    expect(mockConstantsContext.fetchHeroes).toHaveBeenCalledTimes(1);
    expect(mockConstantsContext.fetchItems).toHaveBeenCalledTimes(1);
  });
});
