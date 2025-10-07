/**
 * App Hydration Hook Tests
 *
 * Tests the app hydration hook's ability to coordinate data loading across
 * multiple contexts during application startup.
 */

import { render, screen, waitFor } from '@testing-library/react';

import { useConfigContext } from '@/frontend/contexts/config-context';
import { useAppHydration } from '@/hooks/useAppHydration';

// Mock AppData context instead of old contexts
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
  }),
}));

// Mock the contexts
jest.mock('@/frontend/contexts/config-context');

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
  teams: new Map(),
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
};

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

    // Reset mock implementations
    mockAppData.loadHeroesData.mockResolvedValue(undefined);
    mockAppData.loadItemsData.mockResolvedValue(undefined);
    mockAppData.loadLeaguesData.mockResolvedValue(undefined);
    // Ensure constants appear available for the polling loop
    mockAppData.heroes.set(1, {
      id: 1,
      name: 'Hero',
      localizedName: 'Hero',
      primaryAttribute: 'strength',
      attackType: 'melee',
      roles: [],
      imageUrl: '',
    });
    mockAppData.items.set(1, {
      id: 1,
      name: 'Item',
      localizedName: 'Item',
      cost: 0,
      secretShop: false,
      sideShop: false,
      recipe: false,
      imageUrl: '',
    });

    // Setup mocks
    (useConfigContext as jest.Mock).mockReturnValue(mockConfigContext);
    // AppData context is already mocked globally
  });

  it('should initialize with default hydration state', async () => {
    mockAppData.loadHeroesData.mockRejectedValue(new Error('Test error'));
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

    expect(mockAppData.loadHeroesData).toHaveBeenCalled();
    expect(mockAppData.loadItemsData).toHaveBeenCalled();
    expect(mockAppData.loadLeaguesData).toHaveBeenCalled();
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

    expect(mockAppData.loadTeamData).toHaveBeenCalled();
  });

  it('should be resilient when active team exists (no crash)', async () => {
    mockConfigContext.activeTeam = { teamId: 'team1', leagueId: 'league1' };
    render(<TestComponent />);
    await waitFor(() => {
      expect(screen.getByTestId('has-hydrated')).toHaveTextContent('true');
    });
  });

  it('should handle errors during constants fetching', async () => {
    mockAppData.loadHeroesData.mockRejectedValue(new Error('Heroes fetch failed'));

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
    mockAppData.loadTeamData.mockRejectedValue(new Error('Team loading failed'));

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
    mockAppData.loadTeamData.mockResolvedValue(undefined);
    mockAppData.loadMatchData.mockRejectedValue(new Error('Manual matches failed'));

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
    expect(mockAppData.loadHeroesData).toHaveBeenCalledTimes(1);
    expect(mockAppData.loadItemsData).toHaveBeenCalledTimes(1);
  });
});
