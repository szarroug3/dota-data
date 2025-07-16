/**
 * Player Context Tests
 *
 * Tests for the player context provider, including state management,
 * data fetching, error handling, and action dispatching.
 */

import { render, screen, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';

import { PlayerProvider, usePlayerContext } from '@/contexts/player-context';
import { PlayerDataFetchingProvider } from '@/contexts/player-data-fetching-context';
import type { OpenDotaPlayerComprehensive } from '@/types/external-apis';

// ============================================================================
// MOCK DATA
// ============================================================================

const mockPlayerData: OpenDotaPlayerComprehensive = {
  profile: {
    profile: {
      account_id: 123456,
      personaname: 'TestPlayer',
      name: 'TestPlayer',
      plus: false,
      cheese: 0,
      steamid: '76561198012345678',
      avatar: 'https://example.com/avatar.jpg',
      avatarmedium: 'https://example.com/avatar_medium.jpg',
      avatarfull: 'https://example.com/avatar_full.jpg',
      profileurl: 'https://steamcommunity.com/id/testplayer',
      last_login: '2024-01-01T00:00:00Z',
      loccountrycode: 'US',
      status: null,
      fh_unavailable: false,
      is_contributor: false,
      is_subscriber: false
    },
    rank_tier: 50,
    leaderboard_rank: 0
  },
  counts: {
    leaver_status: {},
    game_mode: {},
    lobby_type: {},
    lane_role: {},
    region: {},
    patch: {}
  },
  heroes: [],
  rankings: [],
  ratings: [],
  recentMatches: [],
  totals: {
    np: 0,
    fantasy: 0,
    cosmetic: 0,
    all_time: 0,
    ranked: 0,
    turbo: 0,
    matched: 0
  },
  wl: {
    win: 100,
    lose: 50
  },
  wardMap: {
    obs: {},
    sen: {}
  }
};

// ============================================================================
// MOCK PROVIDER
// ============================================================================

// Remove MockPlayerDataFetchingProvider and context mock

// Mock global.fetch to return mockPlayerData
beforeAll(() => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockPlayerData)
    }) as any
  );
});

afterAll(() => {
  if (typeof (global.fetch as jest.Mock).mockRestore === 'function') {
    (global.fetch as jest.Mock).mockRestore();
  }
});

// ============================================================================
// TEST COMPONENTS
// ============================================================================

const StateDisplay: React.FC = () => {
  const {
    players,
    filteredPlayers,
    selectedPlayerId,
    selectedPlayer,
    filters,
    isLoadingPlayers,
    isLoadingPlayerData,
    playersError,
    playerDataError
  } = usePlayerContext();

  return (
    <div>
      <div data-testid="players-count">{players.length}</div>
      <div data-testid="filtered-players-count">{filteredPlayers.length}</div>
      <div data-testid="selected-player-id">{selectedPlayerId || 'none'}</div>
      <div data-testid="selected-player-exists">{selectedPlayer ? 'yes' : 'no'}</div>
      <div data-testid="filters-result">{filters.result}</div>
      <div data-testid="filters-heroes-count">{filters.heroes.length}</div>
      <div data-testid="filters-roles-count">{filters.roles.length}</div>
      <div data-testid="loading-players">{isLoadingPlayers ? 'true' : 'false'}</div>
      <div data-testid="loading-player-data">{isLoadingPlayerData ? 'true' : 'false'}</div>
      <div data-testid="players-error">{playersError || 'none'}</div>
      <div data-testid="player-data-error">{playerDataError || 'none'}</div>
    </div>
  );
};

const ActionButtons: React.FC = () => {
  const {
    setSelectedPlayer,
    addPlayer,
    removePlayer,
    refreshPlayer,
    setFilters,
    filters
  } = usePlayerContext();

  return (
    <div>
      <button onClick={() => setSelectedPlayer('p3')} data-testid="set-selected-player">
        Set Selected Player
      </button>
      <button onClick={() => addPlayer('p3')} data-testid="add-player">
        Add Player
      </button>
      <button onClick={() => removePlayer('p3')} data-testid="remove-player">
        Remove Player
      </button>
      <button onClick={() => refreshPlayer('p3')} data-testid="refresh-player">
        Refresh Player
      </button>
      <button onClick={() => setFilters({ ...filters, result: 'win' })} data-testid="set-filters">
        Set Filters
      </button>
    </div>
  );
};

const TestComponent: React.FC = () => (
  <div>
    <StateDisplay />
    <ActionButtons />
  </div>
);

const renderWithProvider = (component: React.ReactElement) => {
  return render(
    <PlayerDataFetchingProvider>
      <PlayerProvider>{component}</PlayerProvider>
    </PlayerDataFetchingProvider>
  );
};

// ============================================================================
// TEST HELPERS
// ============================================================================

const waitForInitialLoad = async () => {
  await waitFor(() => {
    expect(screen.getByTestId('players-count')).toHaveTextContent('0');
  });
};

const clickButton = (testId: string) => {
  act(() => {
    screen.getByTestId(testId).click();
  });
};

const expectInitialState = () => {
  expect(screen.getByTestId('filtered-players-count')).toHaveTextContent('0');
  expect(screen.getByTestId('selected-player-id')).toHaveTextContent('none');
  expect(screen.getByTestId('selected-player-exists')).toHaveTextContent('no');
  expect(screen.getByTestId('filters-result')).toHaveTextContent('all');
  expect(screen.getByTestId('filters-heroes-count')).toHaveTextContent('0');
  expect(screen.getByTestId('filters-roles-count')).toHaveTextContent('0');
  expect(screen.getByTestId('loading-players')).toHaveTextContent('false');
  expect(screen.getByTestId('loading-player-data')).toHaveTextContent('false');
  expect(screen.getByTestId('players-error')).toHaveTextContent('none');
  expect(screen.getByTestId('player-data-error')).toHaveTextContent('none');
};

// ============================================================================
// TESTS
// ============================================================================

describe('PlayerProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should render without crashing', () => {
      renderWithProvider(<TestComponent />);
      expect(screen.getByTestId('players-count')).toBeInTheDocument();
    });

    it('should provide initial state', async () => {
      renderWithProvider(<TestComponent />);
      
      // Initial state should show loading or have loaded data
      const loadingState = screen.getByTestId('loading-players').textContent;
      expect(['true', 'false']).toContain(loadingState);
      
      if (loadingState === 'true') {
        // Wait for data to load
        await waitFor(() => {
          expect(screen.getByTestId('loading-players')).toHaveTextContent('false');
        });
      }

      expect(screen.getByTestId('players-count')).toHaveTextContent('0');
      expectInitialState();
    });
  });

  describe('Player Actions', () => {
    it('should set selected player', async () => {
      renderWithProvider(<TestComponent />);
      await waitForInitialLoad();
      
      clickButton('set-selected-player');
      
      await waitFor(() => {
        expect(screen.getByTestId('selected-player-id')).toHaveTextContent('p3');
      });
    });

    it('should add and remove players', async () => {
      renderWithProvider(<TestComponent />);
      await waitForInitialLoad();
      
      clickButton('add-player');
      await waitFor(() => {
        expect(screen.getByTestId('players-count')).toHaveTextContent('1');
      });
      // Wait for the player to be added before removing
      await new Promise(resolve => setTimeout(resolve, 50));
      clickButton('remove-player');
      await waitFor(() => {
        expect(screen.getByTestId('players-count')).toHaveTextContent('0');
      });
    });

    it('should refresh player data', async () => {
      renderWithProvider(<TestComponent />);
      await waitForInitialLoad();
      
      clickButton('add-player');
      await waitFor(() => {
        expect(screen.getByTestId('players-count')).toHaveTextContent('1');
      });
      // Wait for the player to be added before refreshing
      await new Promise(resolve => setTimeout(resolve, 50));
      clickButton('refresh-player');
      await waitFor(() => {
        expect(screen.getByTestId('players-count')).toHaveTextContent('1');
      });
    });

    it('should set filters', async () => {
      renderWithProvider(<TestComponent />);
      await waitForInitialLoad();
      
      clickButton('set-filters');
      
      await waitFor(() => {
        expect(screen.getByTestId('filters-result')).toHaveTextContent('win');
      });
    });
  });
}); 