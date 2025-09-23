/**
 * Match Data Fetching Context Tests
 *
 * Tests the match data fetching context functionality including:
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
  MatchDataFetchingProvider,
  useMatchDataFetching,
} from '@/frontend/matches/contexts/fetching/match-data-fetching-context';
import type { OpenDotaMatch } from '@/types/external-apis';

// @ts-expect-error - node-fetch v2 types are compatible with global fetch
global.fetch = fetch;
// @ts-expect-error - node-fetch v2 types are compatible with global Request
global.Request = fetch.Request;
// @ts-expect-error - node-fetch v2 types are compatible with global Response
global.Response = fetch.Response;

// ============================================================================
// MOCK DATA
// ============================================================================

const mockMatch = {
  match_id: 12345,
  radiant_win: true,
  duration: 1800,
  start_time: 1640995200,
  players: [],
} as OpenDotaMatch;

// ============================================================================
// MSW SERVER SETUP
// ============================================================================

const server = setupServer(
  // Success case
  rest.get('/api/matches/12345', (req, res, ctx) => {
    return res(ctx.json(mockMatch));
  }) as any,

  // Match not found
  rest.get('/api/matches/99999', (req, res, ctx) => {
    return res(ctx.status(404), ctx.json({ error: 'Match not found' }));
  }) as any,

  // Server error
  rest.get('/api/matches/50000', (req, res, ctx) => {
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
  const { fetchMatchData, clearMatchCache, clearAllCache, isMatchCached } = useMatchDataFetching();

  const handleFetchMatch = async () => {
    const result = await fetchMatchData(12345);
    return result;
  };

  const handleFetchMatchForce = async () => {
    const result = await fetchMatchData(12345, true);
    return result;
  };

  const handleFetchMatchError = async () => {
    const result = await fetchMatchData(99999);
    return result;
  };

  const handleFetchServerError = async () => {
    const result = await fetchMatchData(50000);
    return result;
  };

  return (
    <div>
      <div data-testid="match-error">{'no-error'}</div>
      <div data-testid="match-cached">{isMatchCached(12345).toString()}</div>
      <button data-testid="fetch-match" onClick={handleFetchMatch}>
        Fetch Match
      </button>
      <button data-testid="fetch-match-force" onClick={handleFetchMatchForce}>
        Force Fetch Match
      </button>
      <button data-testid="fetch-match-error" onClick={handleFetchMatchError}>
        Fetch Match Error
      </button>
      <button data-testid="fetch-server-error" onClick={handleFetchServerError}>
        Fetch Server Error
      </button>
      <button data-testid="clear-match-cache" onClick={() => clearMatchCache(12345)}>
        Clear Match Cache
      </button>
      <button data-testid="clear-all-cache" onClick={clearAllCache}>
        Clear All Cache
      </button>
    </div>
  );
};

// ============================================================================
// TESTS
// ============================================================================

describe('MatchDataFetchingContext', () => {
  beforeEach(() => {
    render(
      <MatchDataFetchingProvider>
        <TestComponent />
      </MatchDataFetchingProvider>,
    );
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      expect(screen.getByTestId('match-error')).toHaveTextContent('no-error');
      expect(screen.getByTestId('match-cached')).toHaveTextContent('false');
    });
  });

  describe('Successful Data Fetching', () => {
    it('should fetch match data successfully', async () => {
      const fetchButton = screen.getByTestId('fetch-match');
      await waitFor(() => fetchButton.click());

      // Should complete successfully
      await waitFor(() => {
        expect(screen.getByTestId('match-error')).toHaveTextContent('no-error');
      });

      // Should be cached after successful fetch
      expect(screen.getByTestId('match-cached')).toHaveTextContent('true');
    });

    it('should return cached data on subsequent fetches', async () => {
      // First fetch
      const fetchButton = screen.getByTestId('fetch-match');
      await waitFor(() => fetchButton.click());

      await waitFor(() => {
        expect(screen.getByTestId('match-error')).toHaveTextContent('no-error');
      });

      // Second fetch should use cache
      fetchButton.click();

      // Should return immediately and still be cached
      expect(screen.getByTestId('match-cached')).toHaveTextContent('true');
    });

    it('should force fetch when force parameter is true', async () => {
      // First fetch to populate cache
      const fetchButton = screen.getByTestId('fetch-match');
      await waitFor(() => fetchButton.click());

      await waitFor(() => {
        expect(screen.getByTestId('match-cached')).toHaveTextContent('true');
      });

      // Force fetch should still work
      const forceFetchButton = screen.getByTestId('fetch-match-force');
      await waitFor(() => forceFetchButton.click());

      // Should still be cached after force fetch
      expect(screen.getByTestId('match-cached')).toHaveTextContent('true');
      expect(screen.getByTestId('match-error')).toHaveTextContent('no-error');
    });
  });

  describe('Error Handling', () => {
    it('should handle match not found errors', async () => {
      const fetchButton = screen.getByTestId('fetch-match-error');
      await waitFor(() => fetchButton.click());

      await waitFor(() => {
        expect(screen.getByTestId('match-error')).toHaveTextContent('Match not found');
      });

      // Should not be cached after error
      expect(screen.getByTestId('match-cached')).toHaveTextContent('false');
    });

    it('should handle server errors', async () => {
      const fetchButton = screen.getByTestId('fetch-server-error');
      await waitFor(() => fetchButton.click());

      await waitFor(() => {
        expect(screen.getByTestId('match-error')).toHaveTextContent('Internal server error');
      });

      // Should not be cached after error
      expect(screen.getByTestId('match-cached')).toHaveTextContent('false');
    });
  });

  describe('Cache Management', () => {
    it('should clear specific match cache', async () => {
      // First fetch to populate cache
      const fetchButton = screen.getByTestId('fetch-match');
      await waitFor(() => fetchButton.click());

      await waitFor(() => {
        expect(screen.getByTestId('match-cached')).toHaveTextContent('true');
      });

      // Clear specific cache
      const clearButton = screen.getByTestId('clear-match-cache');
      await waitFor(() => clearButton.click());

      // Should not be cached anymore
      await waitFor(() => {
        expect(screen.getByTestId('match-cached')).toHaveTextContent('false');
      });
    });

    it('should clear all cache', async () => {
      // First fetch to populate cache
      const fetchButton = screen.getByTestId('fetch-match');
      await waitFor(() => fetchButton.click());

      await waitFor(() => {
        expect(screen.getByTestId('match-cached')).toHaveTextContent('true');
      });

      // Clear all cache
      const clearAllButton = screen.getByTestId('clear-all-cache');
      await waitFor(() => clearAllButton.click());

      // Should not be cached anymore
      await waitFor(() => {
        expect(screen.getByTestId('match-cached')).toHaveTextContent('false');
      });
    });
  });

  describe('Error Management', () => {
    it('should clear specific match error', async () => {
      // First fetch to create error
      const fetchButton = screen.getByTestId('fetch-match-error');
      await waitFor(() => fetchButton.click());

      await waitFor(() => {
        expect(screen.getByTestId('match-error')).toHaveTextContent('Match not found');
      });

      // Clear specific error
      const clearErrorButton = screen.getByTestId('clear-match-error');
      await waitFor(() => clearErrorButton.click());

      // Should not have error anymore
      await waitFor(() => {
        expect(screen.getByTestId('match-error')).toHaveTextContent('no-error');
      });
    });

    it('should clear all errors', async () => {
      // First fetch to create error
      const fetchButton = screen.getByTestId('fetch-match-error');
      await waitFor(() => fetchButton.click());

      await waitFor(() => {
        expect(screen.getByTestId('match-error')).toHaveTextContent('Match not found');
      });
    });
  });

  describe('Context Provider', () => {
    it('should throw error when used outside provider', () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<TestComponent />);
      }).toThrow('useMatchDataFetching must be used within a MatchDataFetchingProvider');

      consoleSpy.mockRestore();
    });
  });
});
