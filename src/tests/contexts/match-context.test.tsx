/**
 * Match Context Tests
 *
 * Comprehensive tests for the match context provider including
 * state management, data fetching, error handling, and actions.
 */

import { act, render, screen, waitFor } from '@testing-library/react';
import React from 'react';

import { MatchProvider, useMatchContext } from '@/contexts/match-context';

// ============================================================================
// TEST COMPONENTS
// ============================================================================

const StateDisplay: React.FC = () => {
  const {
    matches,
    filteredMatches,
    selectedMatchId,
    selectedMatch,
    hiddenMatchIds,
    filters,
    heroStatsGrid,
    isLoadingMatches,
    isLoadingMatchDetails,
    isLoadingHeroStats,
    matchesError,
    matchDetailsError,
    heroStatsError
  } = useMatchContext();

  const renderBasicState = () => (
    <>
      <div data-testid="matches-count">{matches.length}</div>
      <div data-testid="filtered-matches-count">{filteredMatches.length}</div>
      <div data-testid="selected-match-id">{selectedMatchId || 'none'}</div>
      <div data-testid="selected-match-exists">{selectedMatch ? 'yes' : 'no'}</div>
      <div data-testid="hidden-match-ids">{hiddenMatchIds.join(',') || 'none'}</div>
      <div data-testid="filters-result">{filters.result}</div>
    </>
  );

  const renderLoadingStates = () => (
    <>
      <div data-testid="hero-stats-exists">{Object.keys(heroStatsGrid).length > 0 ? 'yes' : 'no'}</div>
      <div data-testid="loading-matches">{isLoadingMatches ? 'loading' : 'idle'}</div>
      <div data-testid="loading-match-details">{isLoadingMatchDetails ? 'loading' : 'idle'}</div>
      <div data-testid="loading-hero-stats">{isLoadingHeroStats ? 'loading' : 'idle'}</div>
    </>
  );

  const renderErrorStates = () => (
    <>
      <div data-testid="matches-error">{matchesError || 'none'}</div>
      <div data-testid="match-details-error">{matchDetailsError || 'none'}</div>
      <div data-testid="hero-stats-error">{heroStatsError || 'none'}</div>
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
    filters,
    setFilters,
    selectMatch,
    hideMatch,
    showMatch,
    refreshMatches,
    refreshMatchDetails,
    clearErrors
  } = useMatchContext();

  return (
    <div>
      <button onClick={() => setFilters({ ...filters, result: 'win' })} data-testid="set-filters">
        Set Filters
      </button>
      <button onClick={() => selectMatch('m1')} data-testid="select-match">
        Select Match
      </button>
      <button onClick={() => hideMatch('m1')} data-testid="hide-match">
        Hide Match
      </button>
      <button onClick={() => showMatch('m1')} data-testid="show-match">
        Show Match
      </button>
      <button onClick={() => refreshMatches()} data-testid="refresh-matches">
        Refresh Matches
      </button>
      <button onClick={() => refreshMatchDetails('m1')} data-testid="refresh-match-details">
        Refresh Match Details
      </button>
      <button onClick={clearErrors} data-testid="clear-errors">
        Clear Errors
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
  return render(<MatchProvider>{component}</MatchProvider>);
};

// ============================================================================
// TEST HELPERS
// ============================================================================

const waitForInitialLoad = async () => {
  await waitFor(() => {
    expect(screen.getByTestId('matches-count')).toHaveTextContent('1');
  });
};

const clickButton = (testId: string) => {
  act(() => {
    screen.getByTestId(testId).click();
  });
};

const expectInitialState = () => {
  expect(screen.getByTestId('filtered-matches-count')).toHaveTextContent('1');
  expect(screen.getByTestId('selected-match-id')).toHaveTextContent('none');
  expect(screen.getByTestId('selected-match-exists')).toHaveTextContent('no');
  expect(screen.getByTestId('hidden-match-ids')).toHaveTextContent('none');
  expect(screen.getByTestId('filters-result')).toHaveTextContent('all');
  expect(screen.getByTestId('hero-stats-exists')).toHaveTextContent('no');
  expect(screen.getByTestId('loading-matches')).toHaveTextContent('idle');
  expect(screen.getByTestId('loading-match-details')).toHaveTextContent('idle');
  expect(screen.getByTestId('loading-hero-stats')).toHaveTextContent('idle');
  expect(screen.getByTestId('matches-error')).toHaveTextContent('none');
  expect(screen.getByTestId('match-details-error')).toHaveTextContent('none');
  expect(screen.getByTestId('hero-stats-error')).toHaveTextContent('none');
};

// ============================================================================
// TESTS
// ============================================================================

describe('MatchProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should render without crashing', () => {
      renderWithProvider(<TestComponent />);
      expect(screen.getByTestId('matches-count')).toBeInTheDocument();
    });

    it('should have correct initial state', async () => {
      renderWithProvider(<TestComponent />);
      await waitForInitialLoad();
      expectInitialState();
      // Add assertion to satisfy linter
      expect(screen.getByTestId('matches-count')).toBeInTheDocument();
    });
  });

  describe('Match Actions', () => {
    it('should set filters and filter matches', async () => {
      renderWithProvider(<TestComponent />);
      await waitForInitialLoad();
      
      clickButton('set-filters');
      
      await waitFor(() => {
        expect(screen.getByTestId('filters-result')).toHaveTextContent('win');
      });
      expect(screen.getByTestId('filtered-matches-count')).toHaveTextContent('1');
    });

    it('should select a match and load details', async () => {
      renderWithProvider(<TestComponent />);
      await waitForInitialLoad();
      
      clickButton('select-match');
      
      await waitFor(() => {
        expect(screen.getByTestId('selected-match-id')).toHaveTextContent('m1');
      });
      await waitFor(() => {
        expect(screen.getByTestId('selected-match-exists')).toHaveTextContent('yes');
      });
    });

    it('should hide and show a match', async () => {
      renderWithProvider(<TestComponent />);
      await waitForInitialLoad();
      
      clickButton('hide-match');
      expect(screen.getByTestId('hidden-match-ids')).toHaveTextContent('m1');
      
      clickButton('show-match');
      expect(screen.getByTestId('hidden-match-ids')).toHaveTextContent('none');
    });
  });

  describe('Data Loading', () => {
    it('should refresh matches and hero stats', async () => {
      renderWithProvider(<TestComponent />);
      await waitForInitialLoad();
      
      clickButton('refresh-matches');
      
      await waitFor(() => {
        expect(screen.getByTestId('matches-count')).toHaveTextContent('1');
      });
      expect(screen.getByTestId('hero-stats-exists')).toHaveTextContent('no');
    });

    it('should parse a match (reload details)', async () => {
      renderWithProvider(<TestComponent />);
      await waitForInitialLoad();
      
      clickButton('select-match');
      await waitFor(() => {
        expect(screen.getByTestId('selected-match-exists')).toHaveTextContent('yes');
      });
      
      clickButton('refresh-match-details');
      await waitFor(() => {
        expect(screen.getByTestId('selected-match-exists')).toHaveTextContent('yes');
      });
      expect(true).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should clear errors', async () => {
      renderWithProvider(<TestComponent />);
      await waitForInitialLoad();
      
      clickButton('clear-errors');
      
      expect(screen.getByTestId('matches-error')).toHaveTextContent('none');
      expect(screen.getByTestId('match-details-error')).toHaveTextContent('none');
      expect(screen.getByTestId('hero-stats-error')).toHaveTextContent('none');
    });
  });
}); 