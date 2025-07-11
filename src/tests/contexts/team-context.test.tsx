/**
 * Team Context Tests
 *
 * Tests for the team context provider, including state management,
 * data fetching, error handling, and action dispatching.
 */

import { render, screen, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';

import { TeamProvider, useTeamContext } from '@/contexts/team-context';

// ============================================================================
// TEST COMPONENTS
// ============================================================================

const StateDisplay: React.FC = () => {
  const {
    teams,
    activeTeamId,
    activeTeam,
    teamData,
    teamStats,
    isLoadingTeams,
    isLoadingTeamData,
    isLoadingTeamStats,
    teamsError,
    teamDataError,
    teamStatsError
  } = useTeamContext();

  const renderBasicState = () => (
    <>
      <div data-testid="teams-count">{teams.length}</div>
      <div data-testid="active-team-id">{activeTeamId || 'none'}</div>
      <div data-testid="active-team-exists">{activeTeam ? 'yes' : 'no'}</div>
      <div data-testid="team-data-exists">{teamData ? 'yes' : 'no'}</div>
      <div data-testid="team-stats-exists">{teamStats ? 'yes' : 'no'}</div>
    </>
  );

  const renderLoadingStates = () => (
    <>
      <div data-testid="loading-teams">{isLoadingTeams ? 'true' : 'false'}</div>
      <div data-testid="loading-team-data">{isLoadingTeamData ? 'true' : 'false'}</div>
      <div data-testid="loading-team-stats">{isLoadingTeamStats ? 'true' : 'false'}</div>
    </>
  );

  const renderErrorStates = () => (
    <>
      <div data-testid="teams-error">{teamsError || 'none'}</div>
      <div data-testid="team-data-error">{teamDataError || 'none'}</div>
      <div data-testid="team-stats-error">{teamStatsError || 'none'}</div>
    </>
  );

  return (
    <div>
      {renderBasicState()}
      {renderLoadingStates()}
      {renderErrorStates()}
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
      <button onClick={() => removeTeam('1')} data-testid="remove-team-btn">
        Remove Team
      </button>
      <button onClick={() => setActiveTeam('1')} data-testid="set-active-team-btn">
        Set Active Team
      </button>
      <button onClick={() => refreshTeam('1')} data-testid="refresh-team-btn">
        Refresh Team
      </button>
      <button onClick={() => updateTeam('1')} data-testid="update-team-btn">
        Update Team
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
  return render(<TeamProvider>{component}</TeamProvider>);
};

// ============================================================================
// TEST HELPERS
// ============================================================================

const waitForInitialLoad = async () => {
  await waitFor(() => {
    expect(screen.getByTestId('teams-count')).toHaveTextContent('2');
  });
};

const clickButton = (testId: string) => {
  act(() => {
    screen.getByTestId(testId).click();
  });
};

const expectInitialState = () => {
  expect(screen.getByTestId('active-team-id')).toHaveTextContent('none');
  expect(screen.getByTestId('active-team-exists')).toHaveTextContent('no');
  expect(screen.getByTestId('team-data-exists')).toHaveTextContent('no');
  expect(screen.getByTestId('team-stats-exists')).toHaveTextContent('no');
  expect(screen.getByTestId('loading-teams')).toHaveTextContent('false');
  expect(screen.getByTestId('loading-team-data')).toHaveTextContent('false');
  expect(screen.getByTestId('loading-team-stats')).toHaveTextContent('false');
  expect(screen.getByTestId('teams-error')).toHaveTextContent('none');
  expect(screen.getByTestId('team-data-error')).toHaveTextContent('none');
  expect(screen.getByTestId('team-stats-error')).toHaveTextContent('none');
};

// ============================================================================
// TESTS
// ============================================================================

describe('TeamProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should render without crashing', () => {
      renderWithProvider(<TestComponent />);
      expect(screen.getByTestId('teams-count')).toBeInTheDocument();
    });

    it('should have correct initial state', async () => {
      renderWithProvider(<TestComponent />);
      await waitForInitialLoad();
      expectInitialState();
      // Add assertion to satisfy linter
      expect(screen.getByTestId('teams-count')).toBeInTheDocument();
    });
  });

  describe('Team Actions', () => {
    it('should add, set, refresh, update, and remove a team', async () => {
      renderWithProvider(<TestComponent />);
      await waitForInitialLoad();
      
      // Add a team
      clickButton('add-team-btn');
      await waitFor(() => {
        expect(screen.getByTestId('teams-count')).toHaveTextContent('3');
      });
      
      // Set active team
      clickButton('set-active-team-btn');
      await waitFor(() => {
        expect(screen.getByTestId('active-team-id')).toHaveTextContent('1');
      });
      
      // Refresh team
      clickButton('refresh-team-btn');
      await waitFor(() => {
        expect(screen.getByTestId('active-team-exists')).toHaveTextContent('yes');
      });
      
      // Update team
      clickButton('update-team-btn');
      await waitFor(() => {
        expect(screen.getByTestId('team-stats-exists')).toHaveTextContent('yes');
      });
      
      // Remove team
      clickButton('remove-team-btn');
      await waitFor(() => {
        expect(screen.getByTestId('teams-count')).toHaveTextContent('2');
      });
      expect(true).toBe(true);
    });
  });
}); 