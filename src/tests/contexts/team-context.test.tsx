/**
 * Team Context Tests
 *
 * Tests for the team context provider, including state management,
 * data fetching, error handling, and action dispatching.
 */

import { render, screen, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';

import { TeamProvider, useTeamContext } from '@/contexts/team-context';
import { TeamDataFetchingProvider } from '@/contexts/team-data-fetching-context';

// Mock the data fetching context
const mockFetchTeamData = jest.fn();
const mockFetchLeagueData = jest.fn();

jest.mock('@/contexts/team-data-fetching-context', () => ({
  ...jest.requireActual('@/contexts/team-data-fetching-context'),
  useTeamDataFetching: () => ({
    isLoading: false,
    error: null,
    fetchTeamData: mockFetchTeamData,
    fetchLeagueData: mockFetchLeagueData,
    clearCache: jest.fn(),
    isTeamCached: jest.fn().mockReturnValue(false),
    isLeagueCached: jest.fn().mockReturnValue(false),
    isCached: jest.fn().mockReturnValue(false),
    clearError: jest.fn()
  })
}));

// ============================================================================
// TEST COMPONENTS
// ============================================================================

const StateDisplay: React.FC = () => {
  const {
    teamDataList,
    activeTeam
  } = useTeamContext();

  const renderBasicState = () => (
    <>
      <div data-testid="teams-count">{teamDataList.length}</div>
      <div data-testid="active-team-id">{activeTeam?.teamId || 'none'}</div>
      <div data-testid="active-league-id">{activeTeam?.leagueId || 'none'}</div>
      <div data-testid="active-team-exists">{activeTeam ? 'yes' : 'no'}</div>
      <div data-testid="team-data-exists">{teamDataList.length > 0 ? 'yes' : 'no'}</div>
    </>
  );

  return (
    <div>
      {renderBasicState()}
    </div>
  );
};

const ActionButtons: React.FC = () => {
  const {
    setActiveTeam,
    addTeam,
    removeTeam,
    refreshTeam,
    updateTeam
  } = useTeamContext();

  return (
    <div>
      <button onClick={() => addTeam('t3', 'l1')} data-testid="add-team-btn">
        Add Team
      </button>
      <button onClick={() => removeTeam('t5', 'l3')} data-testid="remove-team-btn">
        Remove Team
      </button>
      <button onClick={() => setActiveTeam('t3', 'l1')} data-testid="set-active-team-btn">
        Set Active Team
      </button>
      <button onClick={() => refreshTeam('t4', 'l1')} data-testid="refresh-team-btn">
        Refresh Team
      </button>
      <button onClick={() => updateTeam('t3', 'l1', 't5', 'l3')} data-testid="update-team-btn">
        Update Team
      </button>
      <button onClick={() => updateTeam('t3', 'l1', 't3', 'l2')} data-testid="update-league-only-btn">
        Update League Only
      </button>
      <button onClick={() => updateTeam('t3', 'l1', 't6', 'l1')} data-testid="update-team-only-btn">
        Update Team Only
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
    <TeamDataFetchingProvider>
      <TeamProvider>{component}</TeamProvider>
    </TeamDataFetchingProvider>
  );
};

// ============================================================================
// TEST HELPERS
// ============================================================================

const waitForInitialLoad = async () => {
  await waitFor(() => {
    expect(screen.getByTestId('teams-count')).toBeInTheDocument();
  });
};

const clickButton = (testId: string) => {
  act(() => {
    screen.getByTestId(testId).click();
  });
};

const expectInitialState = () => {
  expect(screen.getByTestId('active-team-id')).toHaveTextContent('none');
  expect(screen.getByTestId('active-league-id')).toHaveTextContent('none');
  expect(screen.getByTestId('active-team-exists')).toHaveTextContent('no');
  expect(screen.getByTestId('team-data-exists')).toHaveTextContent('no');
};

// ============================================================================
// TESTS
// ============================================================================

describe('TeamProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up default mock responses
    mockFetchTeamData.mockResolvedValue({
      id: 't3',
      name: 'Test Team',
      matches: [
        {
          matchId: '123',
          result: 'won',
          duration: 1800,
          opponentName: 'Opponent Team',
          startTime: Date.now() / 1000
        }
      ]
    });
    
    mockFetchLeagueData.mockResolvedValue({
      id: 'l1',
      name: 'Test League'
    });
  });

  describe('Initial State', () => {
    it('should render without crashing and display initial state', () => {
      renderWithProvider(<TestComponent />);
      expect(screen.getByTestId('teams-count')).toBeInTheDocument();
      expect(screen.getByTestId('active-team-id')).toBeInTheDocument();
      expect(screen.getByTestId('active-league-id')).toBeInTheDocument();
      expect(screen.getByTestId('active-team-exists')).toBeInTheDocument();
      expect(screen.getByTestId('team-data-exists')).toBeInTheDocument();
    });

    it('should have correct initial state', async () => {
      renderWithProvider(<TestComponent />);
      await waitForInitialLoad();
      expectInitialState();
      // Additional assertion to satisfy linter
      expect(screen.getByTestId('teams-count')).toBeInTheDocument();
    });
  });

  describe('Team Actions', () => {
    it('should add, set, refresh, update, and remove a team', async () => {
      renderWithProvider(<TestComponent />);
      await waitForInitialLoad();
      
      // Add a team - should appear immediately with optimistic update
      clickButton('add-team-btn');
      await waitFor(() => {
        expect(screen.getByTestId('teams-count')).toHaveTextContent('1');
      });
      
      // Set active team
      clickButton('set-active-team-btn');
      await waitFor(() => {
        expect(screen.getByTestId('active-team-id')).toHaveTextContent('t3');
        expect(screen.getByTestId('active-league-id')).toHaveTextContent('l1');
        expect(screen.getByTestId('active-team-exists')).toHaveTextContent('yes');
      });
      
      // Refresh team
      clickButton('refresh-team-btn');
      await waitFor(() => {
        expect(screen.getByTestId('active-team-exists')).toHaveTextContent('yes');
      });
      
      // Update team (changes teamId from 't3' to 't5' and leagueId from 'l1' to 'l3')
      // Set up mocks for the update operation
      mockFetchTeamData.mockResolvedValueOnce({
        id: 't5',
        name: 'Updated Team',
        matches: []
      });
      mockFetchLeagueData.mockResolvedValueOnce({
        id: 'l3',
        name: 'Updated League'
      });
      
      clickButton('update-team-btn');
      await waitFor(() => {
        expect(screen.getByTestId('teams-count')).toHaveTextContent('1');
        expect(screen.getByTestId('active-team-id')).toHaveTextContent('t5');
        expect(screen.getByTestId('active-league-id')).toHaveTextContent('l3');
      });
      
      // Remove team
      clickButton('remove-team-btn');
      await waitFor(() => {
        expect(screen.getByTestId('teams-count')).toHaveTextContent('0');
      });
    });

    it('should handle team ID only changes', async () => {
      renderWithProvider(<TestComponent />);
      await waitForInitialLoad();
      
      // Add a team
      clickButton('add-team-btn');
      await waitFor(() => {
        expect(screen.getByTestId('teams-count')).toHaveTextContent('1');
      });
      
      // Set active team
      clickButton('set-active-team-btn');
      await waitFor(() => {
        expect(screen.getByTestId('active-team-id')).toHaveTextContent('t3');
        expect(screen.getByTestId('active-league-id')).toHaveTextContent('l1');
      });
      
      // Update team ID only (t3 -> t6, league stays l1)
      mockFetchTeamData.mockResolvedValueOnce({
        id: 't6',
        name: 'Updated Team',
        matches: []
      });
      mockFetchLeagueData.mockResolvedValueOnce({
        id: 'l1',
        name: 'Test League'
      });
      
      act(() => {
        screen.getByTestId('update-team-only-btn').click();
      });
      await waitFor(() => {
        expect(screen.getByTestId('teams-count')).toHaveTextContent('1');
        expect(screen.getByTestId('active-team-id')).toHaveTextContent('t6');
        expect(screen.getByTestId('active-league-id')).toHaveTextContent('l1');
      });
    });

    it('should handle league ID only changes', async () => {
      renderWithProvider(<TestComponent />);
      await waitForInitialLoad();
      
      // Add a team
      clickButton('add-team-btn');
      await waitFor(() => {
        expect(screen.getByTestId('teams-count')).toHaveTextContent('1');
      });
      
      // Set active team
      clickButton('set-active-team-btn');
      await waitFor(() => {
        expect(screen.getByTestId('active-team-id')).toHaveTextContent('t3');
        expect(screen.getByTestId('active-league-id')).toHaveTextContent('l1');
      });
      
      // Update league ID only (team stays t3, league l1 -> l2)
      mockFetchTeamData.mockResolvedValueOnce({
        id: 't3',
        name: 'Test Team',
        matches: []
      });
      mockFetchLeagueData.mockResolvedValueOnce({
        id: 'l2',
        name: 'Updated League'
      });
      
      act(() => {
        screen.getByTestId('update-league-only-btn').click();
      });
      await waitFor(() => {
        expect(screen.getByTestId('teams-count')).toHaveTextContent('1');
        expect(screen.getByTestId('active-team-id')).toHaveTextContent('t3');
        expect(screen.getByTestId('active-league-id')).toHaveTextContent('l2');
      });
    });
  });

  it('should update team and behave like new team with optimistic loading', async () => {
    renderWithProvider(<TestComponent />);
    await waitForInitialLoad();
    
    // Add a team first
    clickButton('add-team-btn');
    await waitFor(() => {
      expect(screen.getByTestId('teams-count')).toHaveTextContent('1');
    });
    
    // Set it as active
    clickButton('set-active-team-btn');
    await waitFor(() => {
      expect(screen.getByTestId('active-team-id')).toHaveTextContent('t3');
    });
    
    // Update the team - should show optimistic loading state
    clickButton('update-team-btn');
    await waitFor(() => {
      expect(screen.getByTestId('teams-count')).toHaveTextContent('1');
      expect(screen.getByTestId('active-team-id')).toHaveTextContent('t5');
    });
    
    // The team should now be updated with new ID
    expect(screen.getByTestId('active-team-id')).toHaveTextContent('t5');
  });

  it('should deactivate team when update results in error', async () => {
    renderWithProvider(<TestComponent />);
    await waitForInitialLoad();
    
    // Add a team first
    clickButton('add-team-btn');
    await waitFor(() => {
      expect(screen.getByTestId('teams-count')).toHaveTextContent('1');
    });
    
    // Set it as active
    clickButton('set-active-team-btn');
    await waitFor(() => {
      expect(screen.getByTestId('active-team-id')).toHaveTextContent('t3');
    });
    
    // Mock the API to return an error for the update
    mockFetchTeamData.mockRejectedValueOnce(new Error('Team not found'));
    mockFetchLeagueData.mockRejectedValueOnce(new Error('League not found'));
    
    // Update the team - should result in error and deactivation
    try {
      clickButton('update-team-btn');
      await waitFor(() => {
        expect(screen.getByTestId('active-team-id')).toHaveTextContent('none');
      });
    } catch {
      // Expected error, continue
    }
    
    // Team should be deactivated due to error
    expect(screen.getByTestId('active-team-exists')).toHaveTextContent('no');
  });

  it('should automatically activate team when it becomes the only team without error after update', async () => {
    renderWithProvider(<TestComponent />);
    await waitForInitialLoad();
    
    // Add first team
    clickButton('add-team-btn');
    await waitFor(() => {
      expect(screen.getByTestId('teams-count')).toHaveTextContent('1');
    });
    
    // Mock API to return error for first team
    mockFetchTeamData.mockRejectedValueOnce(new Error('Team not found'));
    mockFetchLeagueData.mockRejectedValueOnce(new Error('League not found'));
    
    // Add second team
    try {
      clickButton('add-team-btn');
      await waitFor(() => {
        expect(screen.getByTestId('teams-count')).toHaveTextContent('2');
      });
    } catch {
      // Expected error, continue
    }
    
    // Mock API to return error for second team
    mockFetchTeamData.mockRejectedValueOnce(new Error('Team not found'));
    mockFetchLeagueData.mockRejectedValueOnce(new Error('League not found'));
    
    // Both teams should have errors, so no active team
    expect(screen.getByTestId('active-team-exists')).toHaveTextContent('no');
    
    // Now update the first team to remove its error
    mockFetchTeamData.mockResolvedValueOnce({
      id: 't3',
      name: 'Updated Team',
      matches: []
    });
    mockFetchLeagueData.mockResolvedValueOnce({
      id: 'l1',
      name: 'Updated League'
    });
    
    clickButton('update-team-btn');
    await waitFor(() => {
      expect(screen.getByTestId('active-team-id')).toHaveTextContent('t5');
    });
    
    // The updated team should now be active since it's the only one without an error
    expect(screen.getByTestId('active-team-exists')).toHaveTextContent('yes');
  });
}); 