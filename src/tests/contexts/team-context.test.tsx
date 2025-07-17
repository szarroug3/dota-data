/**
 * Team Context Tests
 * 
 * Tests for the team context functionality including team operations,
 * league-specific filtering, and player aggregation.
 */

import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { act } from 'react-dom/test-utils';

import { ConfigProvider } from '@/contexts/config-context';
import { TeamProvider, useTeamContext } from '@/contexts/team-context';

// Mock the data fetching contexts
const mockFetchTeamData = jest.fn().mockResolvedValue({
  id: '9517508',
  name: 'Test Team',
  matches: [
    {
      matchId: '7936128769',
      result: 'won' as const,
      duration: 2100,
      opponentName: 'Opponent Team',
      leagueId: '16435',
      startTime: 1725926427
    }
  ]
});

const mockFetchLeagueData = jest.fn().mockResolvedValue({
  id: '16435',
  name: 'Test League'
});

jest.mock('@/contexts/team-data-fetching-context', () => ({
  useTeamDataFetching: () => ({
    fetchTeamData: mockFetchTeamData,
    fetchLeagueData: mockFetchLeagueData
  })
}));

jest.mock('@/contexts/match-data-fetching-context', () => ({
  useMatchDataFetching: () => ({
    fetchMatchData: jest.fn().mockResolvedValue({
      match_id: 7936128769,
      radiant_win: true,
      duration: 2100,
      start_time: 1725926427,
      players: [
        {
          account_id: 123456789,
          player_slot: 0, // Radiant
          hero_id: 1,
          kills: 8,
          deaths: 2,
          assists: 12,
          personaname: 'Test Player 1',
          win: 1
        },
        {
          account_id: 987654321,
          player_slot: 128, // Dire
          hero_id: 2,
          kills: 5,
          deaths: 4,
          assists: 8,
          personaname: 'Test Player 2',
          win: 0
        }
      ]
    })
  })
}));

jest.mock('@/contexts/player-data-fetching-context', () => ({
  usePlayerDataFetching: () => ({
    fetchPlayerData: jest.fn().mockResolvedValue({
      profile: {
        account_id: 123456789,
        personaname: 'Test Player'
      }
    })
  })
}));

// Test component to access context
const TestComponent: React.FC = () => {
  const {
    teamDataList,
    activeTeam,
    isLoading,
    error,
    addTeam,
    removeTeam,
    setActiveTeam,
    teamExists,
    getTeamMatchesForLeague,
    getTeamPlayersForLeague
  } = useTeamContext();

  return (
    <div>
      <div data-testid="team-count">{teamDataList.length}</div>
      <div data-testid="active-team">{activeTeam ? `${activeTeam.teamId}-${activeTeam.leagueId}` : 'none'}</div>
      <div data-testid="loading">{isLoading ? 'true' : 'false'}</div>
      <div data-testid="error">{error || 'none'}</div>
      <button 
        data-testid="add-team" 
        onClick={() => addTeam('9517508', '16435')}
      >
        Add Team
      </button>
      <button 
        data-testid="remove-team" 
        onClick={() => removeTeam('9517508', '16435')}
      >
        Remove Team
      </button>
      <button 
        data-testid="set-active" 
        onClick={() => setActiveTeam('9517508', '16435')}
      >
        Set Active
      </button>
      <div data-testid="team-exists">{teamExists('9517508', '16435') ? 'true' : 'false'}</div>
      <div data-testid="matches-count">{getTeamMatchesForLeague('9517508', '16435').length}</div>
      <div data-testid="players-count">{getTeamPlayersForLeague('9517508', '16435').length}</div>
    </div>
  );
};

// Wrapper component with minimal providers
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ConfigProvider>
    <TeamProvider>
      {children}
    </TeamProvider>
  </ConfigProvider>
);

describe('TeamContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear localStorage to ensure clean state between tests
    if (typeof window !== 'undefined') {
      localStorage.clear();
    }
  });

  it('should initialize with empty state', () => {
    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    expect(screen.getByTestId('team-count')).toHaveTextContent('0');
    expect(screen.getByTestId('active-team')).toHaveTextContent('none');
    expect(screen.getByTestId('loading')).toHaveTextContent('false');
    expect(screen.getByTestId('error')).toHaveTextContent('none');
    expect(screen.getByTestId('team-exists')).toHaveTextContent('false');
  });

  it('should add a team successfully', async () => {
    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    const addButton = screen.getByTestId('add-team');
    
    // Check initial state
    expect(screen.getByTestId('team-count')).toHaveTextContent('0');
    expect(screen.getByTestId('loading')).toHaveTextContent('false');
    expect(screen.getByTestId('error')).toHaveTextContent('none');
    expect(screen.getByTestId('team-exists')).toHaveTextContent('false');
    
    // Click the button
    await act(async () => {
      addButton.click();
    });

    // Check for any errors immediately
    let errorElement = screen.getByTestId('error');
    if (errorElement.textContent !== 'none') {
      console.error('Team context error:', errorElement.textContent);
    }

    // Wait for the async operation to complete
    await waitFor(() => {
      expect(screen.getByTestId('team-count')).toHaveTextContent('1');
      expect(screen.getByTestId('team-exists')).toHaveTextContent('true');
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    }, { timeout: 10000 });

    // Check for any errors
    errorElement = screen.getByTestId('error');
    if (errorElement.textContent !== 'none') {
      console.error('Team context error:', errorElement.textContent);
    }

    // Wait for the async operation to complete
    await waitFor(() => {
      expect(screen.getByTestId('team-count')).toHaveTextContent('1');
      expect(screen.getByTestId('team-exists')).toHaveTextContent('true');
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    }, { timeout: 10000 });

    // Verify that the mock was called
    expect(mockFetchTeamData).toHaveBeenCalledWith('9517508');
  });

  it('should remove a team successfully', async () => {
    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    // First add a team
    const addButton = screen.getByTestId('add-team');
    await act(async () => {
      addButton.click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('team-count')).toHaveTextContent('1');
    });

    // Then remove it
    const removeButton = screen.getByTestId('remove-team');
    await act(async () => {
      removeButton.click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('team-count')).toHaveTextContent('0');
      expect(screen.getByTestId('team-exists')).toHaveTextContent('false');
    });
  });

  it('should set active team successfully', async () => {
    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    // First add a team
    const addButton = screen.getByTestId('add-team');
    await act(async () => {
      addButton.click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('team-count')).toHaveTextContent('1');
    });

    // Then set it as active
    const setActiveButton = screen.getByTestId('set-active');
    await act(async () => {
      setActiveButton.click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('active-team')).toHaveTextContent('9517508-16435');
    });
  });

  it('should return league-specific matches and players', async () => {
    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    // Add a team
    const addButton = screen.getByTestId('add-team');
    await act(async () => {
      addButton.click();
    });

    await waitFor(() => {
      // Teams now start with processed matches and players arrays
      // Match and player data will be fetched separately by their respective contexts
      expect(screen.getByTestId('matches-count')).toHaveTextContent('1');
      expect(screen.getByTestId('players-count')).toHaveTextContent('0');
    });
  });
}); 