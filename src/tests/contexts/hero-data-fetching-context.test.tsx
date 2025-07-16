import { TextDecoder, TextEncoder } from 'util';
global.TextEncoder = TextEncoder;
// @ts-expect-error - Node.js TextDecoder is compatible with browser TextDecoder
global.TextDecoder = TextDecoder;

/**
 * Hero Data Fetching Context Tests
 * 
 * Tests the hero data fetching context functionality including:
 * - Cache management
 * - Error handling
 * - API interactions
 * - Force fetch functionality
 */

import { render, screen, waitFor } from '@testing-library/react';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import fetch from 'node-fetch';

import { HeroDataFetchingProvider, useHeroDataFetching } from '@/contexts/hero-data-fetching-context';
import type { OpenDotaHero } from '@/types/external-apis';

// @ts-expect-error - node-fetch v2 types are compatible with global fetch
global.fetch = fetch;
// @ts-expect-error - node-fetch v2 types are compatible with global Request
global.Request = fetch.Request;
// @ts-expect-error - node-fetch v2 types are compatible with global Response
global.Response = fetch.Response;

// ============================================================================
// MOCK DATA
// ============================================================================

const mockHeroes: OpenDotaHero[] = [
  {
    id: 1,
    name: 'antimage',
    localized_name: 'Anti-Mage',
    primary_attr: 'agi',
    attack_type: 'Melee',
    roles: ['Carry', 'Escape', 'Nuker'],
    legs: 2
  },
  {
    id: 2,
    name: 'axe',
    localized_name: 'Axe',
    primary_attr: 'str',
    attack_type: 'Melee',
    roles: ['Initiator', 'Durable', 'Disabler', 'Jungler'],
    legs: 2
  },
  {
    id: 3,
    name: 'bane',
    localized_name: 'Bane',
    primary_attr: 'int',
    attack_type: 'Ranged',
    roles: ['Support', 'Disabler', 'Nuker', 'Durable'],
    legs: 2
  }
];

// ============================================================================
// MSW SERVER SETUP
// ============================================================================

const server = setupServer(
  // Success case
  rest.get('/api/heroes', (req, res, ctx) => {
    return res(ctx.json(mockHeroes));
  }) as any,
  
  // Server error
  rest.get('/api/heroes/error', (req, res, ctx) => {
    return res(ctx.status(500), ctx.json({ error: 'Internal server error' }));
  }) as any
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// ============================================================================
// TEST COMPONENT
// ============================================================================

const TestComponent = () => {
  const { 
    fetchHeroesData, 
    clearHeroesCache, 
    clearAllCache,
    clearHeroesError, 
    clearAllErrors,
    isHeroesCached, 
    getHeroesError
  } = useHeroDataFetching();
  
  const handleFetchHeroes = async () => {
    const result = await fetchHeroesData();
    return result;
  };
  
  const handleFetchHeroesForce = async () => {
    const result = await fetchHeroesData(true);
    return result;
  };
  
  const handleFetchHeroesError = async () => {
    // This will trigger an error by trying to fetch from a non-existent endpoint
    const result = await fetchHeroesData();
    return result;
  };
  
  return (
    <div>
      <div data-testid="heroes-error">{getHeroesError() || 'no-error'}</div>
      <div data-testid="heroes-cached">{isHeroesCached().toString()}</div>
      <button data-testid="fetch-heroes" onClick={handleFetchHeroes}>Fetch Heroes</button>
      <button data-testid="fetch-heroes-force" onClick={handleFetchHeroesForce}>Force Fetch Heroes</button>
      <button data-testid="fetch-heroes-error" onClick={handleFetchHeroesError}>Fetch Heroes Error</button>
      <button data-testid="clear-heroes-cache" onClick={clearHeroesCache}>Clear Heroes Cache</button>
      <button data-testid="clear-all-cache" onClick={clearAllCache}>Clear All Cache</button>
      <button data-testid="clear-heroes-error" onClick={clearHeroesError}>Clear Heroes Error</button>
      <button data-testid="clear-all-errors" onClick={clearAllErrors}>Clear All Errors</button>
    </div>
  );
};

// ============================================================================
// TESTS
// ============================================================================

describe('HeroDataFetchingContext', () => {
  beforeEach(() => {
    render(
      <HeroDataFetchingProvider>
        <TestComponent />
      </HeroDataFetchingProvider>
    );
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      expect(screen.getByTestId('heroes-error')).toHaveTextContent('no-error');
      expect(screen.getByTestId('heroes-cached')).toHaveTextContent('false');
    });
  });

  describe('Successful Data Fetching', () => {
    it('should fetch heroes data successfully', async () => {
      const fetchButton = screen.getByTestId('fetch-heroes');
      await waitFor(() => fetchButton.click());
      
      // Should complete successfully
      await waitFor(() => {
        expect(screen.getByTestId('heroes-error')).toHaveTextContent('no-error');
      });
      
      // Should be cached after successful fetch
      expect(screen.getByTestId('heroes-cached')).toHaveTextContent('true');
    });

    it('should return cached data on subsequent fetches', async () => {
      // First fetch
      const fetchButton = screen.getByTestId('fetch-heroes');
      await waitFor(() => fetchButton.click());
      
      await waitFor(() => {
        expect(screen.getByTestId('heroes-error')).toHaveTextContent('no-error');
      });
      
      // Second fetch should use cache
      fetchButton.click();
      
      // Should return immediately and still be cached
      expect(screen.getByTestId('heroes-cached')).toHaveTextContent('true');
    });

    it('should force fetch when force parameter is true', async () => {
      // First fetch to populate cache
      const fetchButton = screen.getByTestId('fetch-heroes');
      await waitFor(() => fetchButton.click());
      
      await waitFor(() => {
        expect(screen.getByTestId('heroes-cached')).toHaveTextContent('true');
      });
      
      // Force fetch should still work
      const forceFetchButton = screen.getByTestId('fetch-heroes-force');
      await waitFor(() => forceFetchButton.click());
      
      // Should still be cached after force fetch
      expect(screen.getByTestId('heroes-cached')).toHaveTextContent('true');
      expect(screen.getByTestId('heroes-error')).toHaveTextContent('no-error');
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      // Mock a network error by temporarily removing the handler
      server.use(
        rest.get('/api/heroes', (req, res) => {
          return res.networkError('Network error');
        }) as any
      );

      const fetchButton = screen.getByTestId('fetch-heroes');
      await waitFor(() => fetchButton.click());
      
      await waitFor(() => {
        expect(screen.getByTestId('heroes-error')).toHaveTextContent('Failed to fetch heroes data');
      });
      
      // Should not be cached after error
      expect(screen.getByTestId('heroes-cached')).toHaveTextContent('false');
    });
  });

  describe('Cache Management', () => {
    it('should clear heroes cache', async () => {
      // First fetch to populate cache
      const fetchButton = screen.getByTestId('fetch-heroes');
      await waitFor(() => fetchButton.click());
      
      await waitFor(() => {
        expect(screen.getByTestId('heroes-cached')).toHaveTextContent('true');
      });
      
      // Clear cache
      const clearButton = screen.getByTestId('clear-heroes-cache');
      await waitFor(() => clearButton.click());
      
      // Should not be cached anymore
      await waitFor(() => {
        expect(screen.getByTestId('heroes-cached')).toHaveTextContent('false');
      });
    });

    it('should clear all cache', async () => {
      // First fetch to populate cache
      const fetchButton = screen.getByTestId('fetch-heroes');
      await waitFor(() => fetchButton.click());
      
      await waitFor(() => {
        expect(screen.getByTestId('heroes-cached')).toHaveTextContent('true');
      });
      
      // Clear all cache
      const clearAllButton = screen.getByTestId('clear-all-cache');
      await waitFor(() => clearAllButton.click());
      
      // Should not be cached anymore
      await waitFor(() => {
        expect(screen.getByTestId('heroes-cached')).toHaveTextContent('false');
      });
    });
  });

  describe('Error Management', () => {
    it('should clear heroes error', async () => {
      // Create an error by temporarily removing the handler
      server.use(
        rest.get('/api/heroes', (req, res) => {
          return res.networkError('Network error');
        }) as any
      );

      const fetchButton = screen.getByTestId('fetch-heroes');
      await waitFor(() => fetchButton.click());
      
      await waitFor(() => {
        expect(screen.getByTestId('heroes-error')).toHaveTextContent('Failed to fetch heroes data');
      });
      
      // Clear error
      const clearErrorButton = screen.getByTestId('clear-heroes-error');
      await waitFor(() => clearErrorButton.click());
      
      // Should not have error anymore
      await waitFor(() => {
        expect(screen.getByTestId('heroes-error')).toHaveTextContent('no-error');
      });
    });

    it('should clear all errors', async () => {
      // Create an error by temporarily removing the handler
      server.use(
        rest.get('/api/heroes', (req, res) => {
          return res.networkError('Network error');
        }) as any
      );

      const fetchButton = screen.getByTestId('fetch-heroes');
      await waitFor(() => fetchButton.click());
      
      await waitFor(() => {
        expect(screen.getByTestId('heroes-error')).toHaveTextContent('Failed to fetch heroes data');
      });
      
      // Clear all errors
      const clearAllErrorsButton = screen.getByTestId('clear-all-errors');
      await waitFor(() => clearAllErrorsButton.click());
      
      // Should not have error anymore
      await waitFor(() => {
        expect(screen.getByTestId('heroes-error')).toHaveTextContent('no-error');
      });
    });
  });

  describe('Context Provider', () => {
    it('should throw error when used outside provider', () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<TestComponent />);
      }).toThrow('useHeroDataFetching must be used within a HeroDataFetchingProvider');

      consoleSpy.mockRestore();
    });
  });
}); 