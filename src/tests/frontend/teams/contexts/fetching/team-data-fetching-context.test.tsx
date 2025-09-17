/**
 * Team Data Fetching Context Tests
 *
 * Tests the team data fetching context functionality including:
 * - Cache management
 * - Error handling
 * - API interactions
 * - Force fetch functionality
 */

import { render, screen, waitFor } from '@testing-library/react';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import fetch from 'node-fetch';

import {
  TeamDataFetchingProvider,
  useTeamDataFetching,
} from '@/frontend/teams/contexts/fetching/team-data-fetching-context';
import type { DotabuffLeague, DotabuffTeam } from '@/types/external-apis';

// @ts-expect-error - node-fetch v2 types are compatible with global fetch
global.fetch = fetch;
// @ts-expect-error - node-fetch v2 types are compatible with global Request
global.Request = fetch.Request;
// @ts-expect-error - node-fetch v2 types are compatible with global Response
global.Response = fetch.Response;

// ============================================================================
// MOCK DATA
// ============================================================================

const mockTeam: DotabuffTeam = {
  id: '123',
  name: 'Test Team',
  matches: [],
};

const mockLeague: DotabuffLeague = {
  id: '456',
  name: 'Test League',
};

// ============================================================================
// MSW SERVER SETUP
// ============================================================================

const server = setupServer(
  // Success case
  rest.get('/api/teams/123', (req, res, ctx) => {
    return res(ctx.json(mockTeam));
  }) as any,
  rest.get('/api/leagues/456', (req, res, ctx) => {
    return res(ctx.json(mockLeague));
  }) as any,

  // Team not found
  rest.get('/api/teams/999', (req, res, ctx) => {
    return res(ctx.status(404), ctx.json({ error: 'Team not found' }));
  }) as any,

  // League not found
  rest.get('/api/leagues/999', (req, res, ctx) => {
    return res(ctx.status(404), ctx.json({ error: 'League not found' }));
  }) as any,

  // Server error
  rest.get('/api/teams/500', (req, res, ctx) => {
    return res(ctx.status(500), ctx.json({ error: 'Internal server error' }));
  }) as any,
  rest.get('/api/leagues/500', (req, res, ctx) => {
    return res(ctx.status(500), ctx.json({ error: 'Internal server error' }));
  }) as any,
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// ============================================================================
// TEST COMPONENT
// ============================================================================

const TestComponent = () => {
  const {
    fetchTeamData,
    fetchLeagueData,
    clearTeamCache,
    clearLeagueCache,
    clearAllCache,
    clearTeamError,
    clearLeagueError,
    clearAllErrors,
    isTeamCached,
    isLeagueCached,
    getTeamError,
    getLeagueError,
  } = useTeamDataFetching();

  const handleFetchTeam = async () => {
    const result = await fetchTeamData(123);
    return result;
  };

  const handleFetchLeague = async () => {
    const result = await fetchLeagueData(456);
    return result;
  };

  const handleFetchTeamForce = async () => {
    const result = await fetchTeamData(123, true);
    return result;
  };

  const handleFetchLeagueForce = async () => {
    const result = await fetchLeagueData(456, true);
    return result;
  };

  const handleFetchBoth = async () => {
    const teamResult = await fetchTeamData(123);
    const leagueResult = await fetchLeagueData(456);
    return { team: teamResult, league: leagueResult };
  };

  const handleForceFetchBoth = async () => {
    const teamResult = await fetchTeamData(123, true);
    const leagueResult = await fetchLeagueData(456, true);
    return { team: teamResult, league: leagueResult };
  };

  const handleFetchTeamError = async () => {
    const result = await fetchTeamData(999);
    return result;
  };

  const handleFetchLeagueError = async () => {
    const result = await fetchLeagueData(999);
    return result;
  };

  const handleFetchBothErrors = async () => {
    const teamResult = await fetchTeamData(999);
    const leagueResult = await fetchLeagueData(999);
    return { team: teamResult, league: leagueResult };
  };

  const handleFetchServerError = async () => {
    const teamResult = await fetchTeamData(500);
    const leagueResult = await fetchLeagueData(500);
    return { team: teamResult, league: leagueResult };
  };

  return (
    <div>
      <div data-testid="team-error">{getTeamError(123) || getTeamError(999) || getTeamError(500) || 'no-error'}</div>
      <div data-testid="league-error">
        {getLeagueError(456) || getLeagueError(999) || getLeagueError(500) || 'no-error'}
      </div>
      <div data-testid="team-cached">{isTeamCached(123).toString()}</div>
      <div data-testid="league-cached">{isLeagueCached(456).toString()}</div>
      <div data-testid="both-cached">{(isTeamCached(123) && isLeagueCached(456)).toString()}</div>
      <button data-testid="fetch-team" onClick={handleFetchTeam}>
        Fetch Team
      </button>
      <button data-testid="fetch-league" onClick={handleFetchLeague}>
        Fetch League
      </button>
      <button data-testid="fetch-team-force" onClick={handleFetchTeamForce}>
        Force Fetch Team
      </button>
      <button data-testid="fetch-league-force" onClick={handleFetchLeagueForce}>
        Force Fetch League
      </button>
      <button data-testid="fetch-both" onClick={handleFetchBoth}>
        Fetch Both
      </button>
      <button data-testid="force-fetch-both" onClick={handleForceFetchBoth}>
        Force Fetch Both
      </button>
      <button data-testid="fetch-team-error" onClick={handleFetchTeamError}>
        Fetch Team Error
      </button>
      <button data-testid="fetch-league-error" onClick={handleFetchLeagueError}>
        Fetch League Error
      </button>
      <button data-testid="fetch-both-errors" onClick={handleFetchBothErrors}>
        Fetch Both Errors
      </button>
      <button data-testid="fetch-server-error" onClick={handleFetchServerError}>
        Fetch Server Error
      </button>
      <button data-testid="clear-team-cache" onClick={() => clearTeamCache(123)}>
        Clear Team Cache
      </button>
      <button data-testid="clear-league-cache" onClick={() => clearLeagueCache(456)}>
        Clear League Cache
      </button>
      <button data-testid="clear-all-cache" onClick={clearAllCache}>
        Clear All Cache
      </button>
      <button data-testid="clear-team-error" onClick={() => clearTeamError(999)}>
        Clear Team Error
      </button>
      <button data-testid="clear-league-error" onClick={() => clearLeagueError(999)}>
        Clear League Error
      </button>
      <button data-testid="clear-all-errors" onClick={clearAllErrors}>
        Clear All Errors
      </button>
    </div>
  );
};

// ============================================================================
// TESTS
// ============================================================================

describe('TeamDataFetchingContext', () => {
  beforeEach(() => {
    render(
      <TeamDataFetchingProvider>
        <TestComponent />
      </TeamDataFetchingProvider>,
    );
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      expect(screen.getByTestId('team-error')).toHaveTextContent('no-error');
      expect(screen.getByTestId('league-error')).toHaveTextContent('no-error');
      expect(screen.getByTestId('team-cached')).toHaveTextContent('false');
      expect(screen.getByTestId('league-cached')).toHaveTextContent('false');
      expect(screen.getByTestId('both-cached')).toHaveTextContent('false');
    });
  });

  describe('Successful Data Fetching', () => {
    it('should fetch team and league data successfully', async () => {
      const fetchButton = screen.getByTestId('fetch-both');
      await waitFor(() => fetchButton.click());

      // Should complete successfully
      await waitFor(() => {
        expect(screen.getByTestId('team-error')).toHaveTextContent('no-error');
        expect(screen.getByTestId('league-error')).toHaveTextContent('no-error');
      });

      // Should be cached after successful fetch
      expect(screen.getByTestId('team-cached')).toHaveTextContent('true');
      expect(screen.getByTestId('league-cached')).toHaveTextContent('true');
      expect(screen.getByTestId('both-cached')).toHaveTextContent('true');
    });

    it('should return cached data on subsequent fetches', async () => {
      // First fetch
      const fetchButton = screen.getByTestId('fetch-both');
      await waitFor(() => fetchButton.click());

      await waitFor(() => {
        expect(screen.getByTestId('team-error')).toHaveTextContent('no-error');
        expect(screen.getByTestId('league-error')).toHaveTextContent('no-error');
      });

      // Second fetch should use cache
      fetchButton.click();

      // Should return immediately and still be cached
      expect(screen.getByTestId('team-cached')).toHaveTextContent('true');
      expect(screen.getByTestId('league-cached')).toHaveTextContent('true');
    });

    it('should force fetch when force parameter is true', async () => {
      // First fetch to populate cache
      const fetchButton = screen.getByTestId('fetch-both');
      await waitFor(() => fetchButton.click());

      await waitFor(() => {
        expect(screen.getByTestId('both-cached')).toHaveTextContent('true');
      });

      // Force fetch should still work
      const forceFetchButton = screen.getByTestId('force-fetch-both');
      await waitFor(() => forceFetchButton.click());

      // Should still be successful
      await waitFor(() => {
        expect(screen.getByTestId('team-error')).toHaveTextContent('no-error');
        expect(screen.getByTestId('league-error')).toHaveTextContent('no-error');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle team fetch errors', async () => {
      const fetchTeamErrorButton = screen.getByTestId('fetch-team-error');
      await waitFor(() => fetchTeamErrorButton.click());

      await waitFor(() => {
        expect(screen.getByTestId('team-error')).toHaveTextContent('Team not found');
      });
    });

    it('should handle league fetch errors', async () => {
      const fetchLeagueErrorButton = screen.getByTestId('fetch-league-error');
      await waitFor(() => fetchLeagueErrorButton.click());

      await waitFor(() => {
        expect(screen.getByTestId('league-error')).toHaveTextContent('League not found');
      });
    });

    it('should handle server errors', async () => {
      const fetchServerErrorButton = screen.getByTestId('fetch-server-error');
      await waitFor(() => fetchServerErrorButton.click());

      await waitFor(() => {
        expect(screen.getByTestId('team-error')).toHaveTextContent('Internal server error');
        expect(screen.getByTestId('league-error')).toHaveTextContent('Internal server error');
      });
    });

    it('should handle both team and league errors', async () => {
      const fetchBothErrorsButton = screen.getByTestId('fetch-both-errors');
      await waitFor(() => fetchBothErrorsButton.click());

      await waitFor(() => {
        expect(screen.getByTestId('team-error')).toHaveTextContent('Team not found');
        expect(screen.getByTestId('league-error')).toHaveTextContent('League not found');
      });
    });
  });

  describe('Cache Management', () => {
    it('should cache successful fetches', async () => {
      const fetchButton = screen.getByTestId('fetch-both');
      await waitFor(() => fetchButton.click());

      await waitFor(() => {
        expect(screen.getByTestId('team-error')).toHaveTextContent('no-error');
        expect(screen.getByTestId('league-error')).toHaveTextContent('no-error');
      });

      expect(screen.getByTestId('team-cached')).toHaveTextContent('true');
      expect(screen.getByTestId('league-cached')).toHaveTextContent('true');
      expect(screen.getByTestId('both-cached')).toHaveTextContent('true');
    });

    it('should clear specific team cache when requested', async () => {
      // First fetch to populate cache
      const fetchButton = screen.getByTestId('fetch-both');
      await waitFor(() => fetchButton.click());

      await waitFor(() => {
        expect(screen.getByTestId('team-cached')).toHaveTextContent('true');
        expect(screen.getByTestId('league-cached')).toHaveTextContent('true');
      });

      // Clear team cache
      const clearTeamCacheButton = screen.getByTestId('clear-team-cache');
      await waitFor(() => clearTeamCacheButton.click());

      expect(screen.getByTestId('team-cached')).toHaveTextContent('false');
      expect(screen.getByTestId('league-cached')).toHaveTextContent('true');
    });

    it('should clear specific league cache when requested', async () => {
      // First fetch to populate cache
      const fetchButton = screen.getByTestId('fetch-both');
      await waitFor(() => fetchButton.click());

      await waitFor(() => {
        expect(screen.getByTestId('team-cached')).toHaveTextContent('true');
        expect(screen.getByTestId('league-cached')).toHaveTextContent('true');
      });

      // Clear league cache
      const clearLeagueCacheButton = screen.getByTestId('clear-league-cache');
      await waitFor(() => clearLeagueCacheButton.click());

      expect(screen.getByTestId('team-cached')).toHaveTextContent('true');
      expect(screen.getByTestId('league-cached')).toHaveTextContent('false');
    });

    it('should clear all cache when requested', async () => {
      // First fetch to populate cache
      const fetchButton = screen.getByTestId('fetch-both');
      await waitFor(() => fetchButton.click());

      await waitFor(() => {
        expect(screen.getByTestId('team-cached')).toHaveTextContent('true');
        expect(screen.getByTestId('league-cached')).toHaveTextContent('true');
      });

      // Clear all cache
      const clearAllCacheButton = screen.getByTestId('clear-all-cache');
      await waitFor(() => clearAllCacheButton.click());

      expect(screen.getByTestId('team-cached')).toHaveTextContent('false');
      expect(screen.getByTestId('league-cached')).toHaveTextContent('false');
      expect(screen.getByTestId('both-cached')).toHaveTextContent('false');
    });
  });

  describe('Error Management', () => {
    it('should clear team error when requested', async () => {
      // Create team error
      const fetchTeamErrorButton = screen.getByTestId('fetch-team-error');
      await waitFor(() => fetchTeamErrorButton.click());

      await waitFor(() => {
        expect(screen.getByTestId('team-error')).toHaveTextContent('Team not found');
      });

      // Clear team error
      const clearTeamErrorButton = screen.getByTestId('clear-team-error');
      await waitFor(() => clearTeamErrorButton.click());

      expect(screen.getByTestId('team-error')).toHaveTextContent('no-error');
    });

    it('should clear league error when requested', async () => {
      // Create league error
      const fetchLeagueErrorButton = screen.getByTestId('fetch-league-error');
      await waitFor(() => fetchLeagueErrorButton.click());

      await waitFor(() => {
        expect(screen.getByTestId('league-error')).toHaveTextContent('League not found');
      });

      // Clear league error
      const clearLeagueErrorButton = screen.getByTestId('clear-league-error');
      await waitFor(() => clearLeagueErrorButton.click());

      expect(screen.getByTestId('league-error')).toHaveTextContent('no-error');
    });

    it('should clear all errors when requested', async () => {
      // Create both errors
      const fetchBothErrorsButton = screen.getByTestId('fetch-both-errors');
      await waitFor(() => fetchBothErrorsButton.click());

      await waitFor(() => {
        expect(screen.getByTestId('team-error')).toHaveTextContent('Team not found');
        expect(screen.getByTestId('league-error')).toHaveTextContent('League not found');
      });

      // Clear all errors
      const clearAllErrorsButton = screen.getByTestId('clear-all-errors');
      await waitFor(() => clearAllErrorsButton.click());

      expect(screen.getByTestId('team-error')).toHaveTextContent('no-error');
      expect(screen.getByTestId('league-error')).toHaveTextContent('no-error');
    });
  });

  describe('Cache Status Queries', () => {
    it('should correctly report cache status', async () => {
      // Initially not cached
      expect(screen.getByTestId('team-cached')).toHaveTextContent('false');
      expect(screen.getByTestId('league-cached')).toHaveTextContent('false');

      // Fetch data
      const fetchButton = screen.getByTestId('fetch-both');
      await waitFor(() => fetchButton.click());

      await waitFor(() => {
        expect(screen.getByTestId('team-cached')).toHaveTextContent('true');
        expect(screen.getByTestId('league-cached')).toHaveTextContent('true');
      });
    });
  });

  describe('Error Status Queries', () => {
    it('should correctly report error status', async () => {
      // Initially no errors
      expect(screen.getByTestId('team-error')).toHaveTextContent('no-error');
      expect(screen.getByTestId('league-error')).toHaveTextContent('no-error');

      // Create errors
      const fetchBothErrorsButton = screen.getByTestId('fetch-both-errors');
      await waitFor(() => fetchBothErrorsButton.click());

      await waitFor(() => {
        expect(screen.getByTestId('team-error')).toHaveTextContent('Team not found');
        expect(screen.getByTestId('league-error')).toHaveTextContent('League not found');
      });
    });
  });
});
