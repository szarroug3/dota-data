/**
 * App Hydration Hook Tests
 *
 * Tests the app hydration hook's ability to coordinate data loading across
 * multiple contexts during application startup.
 */

import { render, screen, waitFor } from '@testing-library/react';

import { useConfigContext } from '@/frontend/contexts/config-context';
import { useShareContext } from '@/frontend/contexts/share-context';
import type { SharePayload } from '@/frontend/contexts/share-context';
import type { Team } from '@/frontend/lib/app-data/app-data-types';
import { useAppData } from '@/hooks/app-data/use-app-data';
import { useAppHydration } from '@/hooks/app-data/useAppHydration';

jest.mock('@/frontend/contexts/config-context');
jest.mock('@/frontend/contexts/share-context');
jest.mock('@/hooks/app-data/use-app-data');

const mockConfigContext = {
  activeTeam: null as { teamId: number; leagueId: number } | null,
  setActiveTeam: jest.fn(),
  getGlobalManualMatches: jest.fn(),
  setGlobalManualMatches: jest.fn(),
  getGlobalManualPlayers: jest.fn(),
  setGlobalManualPlayers: jest.fn(),
  config: {
    preferredExternalSite: 'dotabuff' as const,
    preferredMatchlistView: 'list' as const,
    preferredPlayerlistView: 'list' as const,
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
  heroes: new Map(),
  items: new Map(),
  leagues: new Map(),
  loadHeroesData: jest.fn(),
  loadItemsData: jest.fn(),
  loadLeaguesData: jest.fn(),
  loadFromStorage: jest.fn(),
  loadFromSharePayload: jest.fn(),
  loadAllManualMatches: jest.fn(),
  loadAllManualPlayers: jest.fn(),
  loadTeam: jest.fn(),
  getTeam: jest.fn(),
  refreshTeam: jest.fn(),
  getTeams: jest.fn(),
  setSelectedTeam: jest.fn(),
  updateTeamMatchParticipation: jest.fn(),
  updateTeamPlayersMetadata: jest.fn(),
  state: {
    selectedTeamId: '0-0',
    selectedTeamIdParsed: { teamId: 0, leagueId: 0 },
    selectedMatchId: null,
    selectedPlayerId: null,
    isLoading: false,
    error: null,
  },
};

const mockShareContext: {
  isShareMode: boolean;
  shareKey: string | null;
  payload: SharePayload | null;
  setPayload: jest.Mock;
  createShare: jest.Mock;
} = {
  isShareMode: false,
  shareKey: null,
  payload: null,
  setPayload: jest.fn(),
  createShare: jest.fn(),
};

const createTeam = (overrides: Partial<Team> = {}): Team => ({
  id: '1-2',
  teamId: 1,
  leagueId: 2,
  name: 'Team 1',
  leagueName: 'League 1',
  timeAdded: Date.now(),
  matches: new Map(),
  players: new Map(),
  createdAt: Date.now(),
  updatedAt: Date.now(),
  isLoading: false,
  highPerformingHeroes: new Set(),
  ...overrides,
});

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
    mockConfigContext.activeTeam = null;
    mockShareContext.isShareMode = false;
    mockShareContext.payload = null;
    mockAppData.loadHeroesData.mockResolvedValue(undefined);
    mockAppData.loadItemsData.mockResolvedValue(undefined);
    mockAppData.loadLeaguesData.mockResolvedValue(undefined);
    mockAppData.loadFromStorage.mockResolvedValue(undefined);
    mockAppData.loadFromSharePayload.mockResolvedValue(undefined);
    mockAppData.loadAllManualMatches.mockResolvedValue(undefined);
    mockAppData.loadAllManualPlayers.mockResolvedValue(undefined);
    mockAppData.loadTeam.mockResolvedValue(undefined);
    mockAppData.getTeam.mockReturnValue(undefined);
    mockAppData.refreshTeam.mockResolvedValue(undefined);
    mockAppData.getTeams.mockReturnValue([]);
    mockAppData.state.selectedTeamId = '0-0';

    // Setup mocks
    (useConfigContext as jest.Mock).mockReturnValue(mockConfigContext);
    (useShareContext as jest.Mock).mockReturnValue(mockShareContext);
    (useAppData as jest.Mock).mockReturnValue(mockAppData);
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

  it('should refresh active team when teams exist', async () => {
    const team = createTeam();
    mockAppData.getTeams.mockReturnValue([team]);
    mockAppData.state.selectedTeamId = team.id;

    render(<TestComponent />);

    await waitFor(() => {
      expect(mockAppData.refreshTeam).toHaveBeenCalledWith(team.teamId, team.leagueId);
    });
  });

  it('should be resilient when active team exists (no crash)', async () => {
    mockConfigContext.activeTeam = { teamId: 1, leagueId: 2 };
    render(<TestComponent />);
    await waitFor(() => {
      expect(mockAppData.loadTeam).toHaveBeenCalledWith(1, 2);
    });
  });

  it('should avoid reloading the active team when it is already stored', async () => {
    const team = createTeam();
    mockConfigContext.activeTeam = { teamId: team.teamId, leagueId: team.leagueId };
    mockAppData.getTeams.mockReturnValue([team]);
    mockAppData.getTeam.mockReturnValue(team);
    mockAppData.state.selectedTeamId = '0-0';

    render(<TestComponent />);

    expect(mockAppData.loadTeam).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(mockAppData.setSelectedTeam).toHaveBeenCalledWith(team.id);
    });
    await waitFor(() => {
      expect(mockAppData.refreshTeam).toHaveBeenCalledWith(team.teamId, team.leagueId);
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
    mockConfigContext.activeTeam = { teamId: 1, leagueId: 2 };
    mockAppData.loadTeam.mockRejectedValueOnce(new Error('Team loading failed'));
    mockAppData.loadTeam.mockResolvedValueOnce(undefined);

    render(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByTestId('hydration-error')).toHaveTextContent('Team loading failed');
    });
  });

  it('should handle errors during manual data loading', async () => {
    mockAppData.loadAllManualMatches.mockRejectedValue(new Error('Manual matches failed'));

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

  it('should hydrate from share payload when in share mode', async () => {
    mockShareContext.isShareMode = true;
    mockShareContext.payload = {
      teams: {
        '1-2': {
          team: { id: 1, name: 'Team 1' },
          league: { id: 2, name: 'League 1' },
          timeAdded: new Date().toISOString(),
          matches: {},
          players: {},
        },
      },
      activeTeam: { teamId: 1, leagueId: 2 },
      globalManualMatches: [],
      globalManualPlayers: [],
    };

    render(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByTestId('has-hydrated')).toHaveTextContent('true');
    });

    expect(mockAppData.loadFromSharePayload).toHaveBeenCalledWith({
      teams: mockShareContext.payload.teams,
      activeTeam: mockShareContext.payload.activeTeam,
    });
    expect(mockAppData.loadFromStorage).not.toHaveBeenCalled();
  });
});
