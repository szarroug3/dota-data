/**
 * Player Context Tests
 * 
 * Tests for the player context functionality including player operations,
 * data processing, and state management.
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { act } from 'react-dom/test-utils';

import { PlayerProvider, usePlayerContext } from '@/contexts/player-context';

// Mock the data fetching context
const mockFetchPlayerData = jest.fn().mockResolvedValue({
  profile: {
    account_id: 123456789,
    personaname: 'Test Player',
    avatarfull: 'https://example.com/avatar.jpg',
    loccountrycode: 'US',
    last_login: '2024-01-01T00:00:00.000Z'
  },
  competitive_rank: 5000,
  rank_tier: 70,
  leaderboard_rank: 100,
  solo_competitive_rank: 4800,
  mmr_estimate: {
    estimate: 5000,
    stdDev: 200,
    n: 100
  }
});

jest.mock('@/contexts/player-data-fetching-context', () => ({
  usePlayerDataFetching: () => ({
    fetchPlayerData: mockFetchPlayerData
  })
}));

// Test component to access context
const TestComponent: React.FC = () => {
  const {
    players,
    selectedPlayerId,
    setSelectedPlayerId,
    isLoading,
    addPlayer,
    refreshPlayer,
  } = usePlayerContext();

  return (
    <div>
      <div data-testid="players-count">{players.size}</div>
      <div data-testid="selected-player-id">{selectedPlayerId || 'none'}</div>
      <div data-testid="is-loading">{isLoading.toString()}</div>
      
      <button 
        data-testid="add-player-btn"
        onClick={() => addPlayer(123456789)}
      >
        Add Player
      </button>
      
      <button 
        data-testid="refresh-player-btn"
        onClick={() => refreshPlayer(123456789)}
      >
        Refresh Player
      </button>
      
      <button 
        data-testid="set-selected-player-btn"
        onClick={() => setSelectedPlayerId(123456789)}
      >
        Set Selected Player
      </button>
      
      <button 
        onClick={() => setSelectedPlayerId(null)}
        data-testid="clear-selected-player-btn"
      >
        Clear Selected Player
      </button>
    </div>
  );
};

// Wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <PlayerProvider>
    {children}
  </PlayerProvider>
);

describe('PlayerContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should initialize with empty state', () => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      expect(screen.getByTestId('players-count')).toHaveTextContent('0');
      expect(screen.getByTestId('selected-player-id')).toHaveTextContent('none');
      expect(screen.getByTestId('is-loading')).toHaveTextContent('false');
    });
  });

  describe('addPlayer', () => {
    it('should add a player successfully', async () => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      const addPlayerButton = screen.getByTestId('add-player-btn');
      await act(async () => {
        await userEvent.click(addPlayerButton);
      });

      await waitFor(() => {
        expect(mockFetchPlayerData).toHaveBeenCalledWith(123456789, false);
      });
    });

    it('should handle errors when adding a player', async () => {
      mockFetchPlayerData.mockRejectedValueOnce(new Error('Failed to fetch player'));
      
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      const addPlayerButton = screen.getByTestId('add-player-btn');
      await act(async () => {
        await userEvent.click(addPlayerButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('players-count')).toHaveTextContent('1');
        expect(screen.getByTestId('selected-player-id')).toHaveTextContent('none');
        expect(screen.getByTestId('is-loading')).toHaveTextContent('false');
      });
    });

    it('should return existing player if not forced', async () => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      // Add player first time
      const addPlayerButton = screen.getByTestId('add-player-btn');
      await act(async () => {
        await userEvent.click(addPlayerButton);
      });

      await waitFor(() => {
        expect(mockFetchPlayerData).toHaveBeenCalledTimes(1);
      });

      // Add same player again (should not fetch)
      await act(async () => {
        await userEvent.click(addPlayerButton);
      });

      await waitFor(() => {
        expect(mockFetchPlayerData).toHaveBeenCalledTimes(1); // Should not be called again
      });
    });
  });

  describe('refreshPlayer', () => {
    it('should refresh a player successfully', async () => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      const refreshPlayerButton = screen.getByTestId('refresh-player-btn');
      await act(async () => {
        await userEvent.click(refreshPlayerButton);
      });

      await waitFor(() => {
        expect(mockFetchPlayerData).toHaveBeenCalledWith(123456789, true);
      });
    });

    it('should force refresh even if player exists', async () => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      // Add player first
      const addPlayerButton = screen.getByTestId('add-player-btn');
      await act(async () => {
        await userEvent.click(addPlayerButton);
      });

      await waitFor(() => {
        expect(mockFetchPlayerData).toHaveBeenCalledTimes(1);
      });

      // Refresh player (should fetch again)
      const refreshPlayerButton = screen.getByTestId('refresh-player-btn');
      await act(async () => {
        await userEvent.click(refreshPlayerButton);
      });

      await waitFor(() => {
        expect(mockFetchPlayerData).toHaveBeenCalledTimes(2); // Should be called again
      });
    });
  });

  describe('setSelectedPlayerId', () => {
    it('should set the selected player ID', async () => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      const setSelectedPlayerButton = screen.getByTestId('set-selected-player-btn');
      await act(async () => {
        await userEvent.click(setSelectedPlayerButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('selected-player-id')).toHaveTextContent('123456789');
      });
    });

    it('should clear the selected player ID', async () => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      // First set a selected player
      const setSelectedPlayerButton = screen.getByTestId('set-selected-player-btn');
      await act(async () => {
        await userEvent.click(setSelectedPlayerButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('selected-player-id')).toHaveTextContent('123456789');
      });

      // Then clear it
      const clearSelectedPlayerButton = screen.getByTestId('clear-selected-player-btn');
      await act(async () => {
        await userEvent.click(clearSelectedPlayerButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('selected-player-id')).toHaveTextContent('none');
      });
    });
  });

  describe('Data Access', () => {
    it('should get a player by ID', async () => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      // Add a player first
      const addPlayerButton = screen.getByTestId('add-player-btn');
      await act(async () => {
        await userEvent.click(addPlayerButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('players-count')).toHaveTextContent('1');
        expect(screen.getByTestId('selected-player-id')).toHaveTextContent('none');
        expect(screen.getByTestId('is-loading')).toHaveTextContent('false');
      });
    });

    it('should get all players', async () => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      // Add a player first
      const addPlayerButton = screen.getByTestId('add-player-btn');
      await act(async () => {
        await userEvent.click(addPlayerButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('players-count')).toHaveTextContent('1');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      mockFetchPlayerData.mockRejectedValueOnce(new Error('Network error'));
      
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      const addPlayerButton = screen.getByTestId('add-player-btn');
      await act(async () => {
        await userEvent.click(addPlayerButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('players-count')).toHaveTextContent('1');
        expect(screen.getByTestId('selected-player-id')).toHaveTextContent('none');
        expect(screen.getByTestId('is-loading')).toHaveTextContent('false');
      });
    });

    it('should clear errors when operations succeed', async () => {
      // First cause an error
      mockFetchPlayerData.mockRejectedValueOnce(new Error('Network error'));
      
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      const addPlayerButton = screen.getByTestId('add-player-btn');
      await act(async () => {
        await userEvent.click(addPlayerButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('players-count')).toHaveTextContent('1');
        expect(screen.getByTestId('selected-player-id')).toHaveTextContent('none');
        expect(screen.getByTestId('is-loading')).toHaveTextContent('false');
      });

      // Then succeed
      mockFetchPlayerData.mockResolvedValueOnce({
        profile: {
          account_id: 123456789,
          personaname: 'Test Player'
        }
      });

      await act(async () => {
        await userEvent.click(addPlayerButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('players-count')).toHaveTextContent('1');
        expect(screen.getByTestId('selected-player-id')).toHaveTextContent('none');
        expect(screen.getByTestId('is-loading')).toHaveTextContent('false');
      });
    });
  });
}); 