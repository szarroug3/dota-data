/**
 * Player Context Tests
 *
 * Tests for the player context provider, including state management,
 * data fetching, error handling, and action dispatching.
 */

import { render, screen, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';

import { PlayerProvider, usePlayerContext } from '@/contexts/player-context';

// ============================================================================
// TEST COMPONENTS
// ============================================================================

const StateDisplay: React.FC = () => {
  const {
    players,
    filteredPlayers,
    selectedPlayerId,
    selectedPlayer,
    playerStats,
    filters,
    isLoadingPlayers,
    isLoadingPlayerData,
    isLoadingPlayerStats,
    playersError,
    playerDataError,
    playerStatsError
  } = usePlayerContext();

  return (
    <div>
      <div data-testid="players-count">{players.length}</div>
      <div data-testid="filtered-players-count">{filteredPlayers.length}</div>
      <div data-testid="selected-player-id">{selectedPlayerId || 'none'}</div>
      <div data-testid="selected-player-exists">{selectedPlayer ? 'yes' : 'no'}</div>
      <div data-testid="player-stats-exists">{playerStats ? 'yes' : 'no'}</div>
      <div data-testid="filters-result">{filters.result}</div>
      <div data-testid="loading-players">{isLoadingPlayers ? 'true' : 'false'}</div>
      <div data-testid="loading-player-data">{isLoadingPlayerData ? 'true' : 'false'}</div>
      <div data-testid="loading-player-stats">{isLoadingPlayerStats ? 'true' : 'false'}</div>
      <div data-testid="players-error">{playersError || 'none'}</div>
      <div data-testid="player-data-error">{playerDataError || 'none'}</div>
      <div data-testid="player-stats-error">{playerStatsError || 'none'}</div>
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
      <button onClick={() => setSelectedPlayer('p1')} data-testid="set-selected-player">
        Set Selected Player
      </button>
      <button onClick={() => addPlayer('p3')} data-testid="add-player">
        Add Player
      </button>
      <button onClick={() => removePlayer('p1')} data-testid="remove-player">
        Remove Player
      </button>
      <button onClick={() => refreshPlayer('p1')} data-testid="refresh-player">
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
  return render(<PlayerProvider>{component}</PlayerProvider>);
};

// ============================================================================
// TEST HELPERS
// ============================================================================

const waitForInitialLoad = async () => {
  await waitFor(() => {
    expect(screen.getByTestId('players-count')).toHaveTextContent('2');
  });
};

const clickButton = (testId: string) => {
  act(() => {
    screen.getByTestId(testId).click();
  });
};

const expectInitialState = () => {
  expect(screen.getByTestId('filtered-players-count')).toHaveTextContent('2');
  expect(screen.getByTestId('selected-player-id')).toHaveTextContent('none');
  expect(screen.getByTestId('selected-player-exists')).toHaveTextContent('no');
  expect(screen.getByTestId('player-stats-exists')).toHaveTextContent('no');
  expect(screen.getByTestId('filters-result')).toHaveTextContent('all');
  expect(screen.getByTestId('loading-players')).toHaveTextContent('false');
  expect(screen.getByTestId('loading-player-data')).toHaveTextContent('false');
  expect(screen.getByTestId('loading-player-stats')).toHaveTextContent('false');
  expect(screen.getByTestId('players-error')).toHaveTextContent('none');
  expect(screen.getByTestId('player-data-error')).toHaveTextContent('none');
  expect(screen.getByTestId('player-stats-error')).toHaveTextContent('none');
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

      expect(screen.getByTestId('players-count')).toHaveTextContent('2');
      expectInitialState();
    });
  });

  describe('Player Actions', () => {
    it('should set selected player and load data', async () => {
      renderWithProvider(<TestComponent />);
      await waitForInitialLoad();
      
      clickButton('set-selected-player');
      
      await waitFor(() => {
        expect(screen.getByTestId('selected-player-id')).toHaveTextContent('p1');
      });
      await waitFor(() => {
        expect(screen.getByTestId('selected-player-exists')).toHaveTextContent('yes');
      });
    });

    it('should add and remove players', async () => {
      renderWithProvider(<TestComponent />);
      await waitForInitialLoad();
      
      clickButton('add-player');
      await waitFor(() => {
        expect(screen.getByTestId('players-count')).toHaveTextContent('3');
      });
      
      clickButton('remove-player');
      await waitFor(() => {
        expect(screen.getByTestId('players-count')).toHaveTextContent('2');
      });
    });

    it('should refresh player data', async () => {
      renderWithProvider(<TestComponent />);
      await waitForInitialLoad();
      
      clickButton('set-selected-player');
      await waitFor(() => {
        expect(screen.getByTestId('selected-player-exists')).toHaveTextContent('yes');
      });
      
      clickButton('refresh-player');
      await waitFor(() => {
        expect(screen.getByTestId('selected-player-exists')).toHaveTextContent('yes');
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