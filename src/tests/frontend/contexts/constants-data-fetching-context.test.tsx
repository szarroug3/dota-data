/**
 * Constants Data Fetching Context Tests
 *
 * Tests for the constants data fetching context functionality including
 * hero and item data fetching, caching, and error handling.
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { act } from 'react-dom/test-utils';

import {
  ConstantsDataFetchingProvider,
  useConstantsDataFetching,
} from '@/frontend/contexts/constants-data-fetching-context';

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Test component to access context
const TestComponent: React.FC = () => {
  const {
    fetchHeroesData,
    fetchItemsData,
    clearHeroesCache,
    clearItemsCache,
    clearAllCache,
    clearAllErrors,
    isHeroesCached,
    isItemsCached,
    getHeroesError,
    getItemsError,
  } = useConstantsDataFetching();

  const [heroesResult, setHeroesResult] = React.useState<string>('none');
  const [itemsResult, setItemsResult] = React.useState<string>('none');
  const [heroesCached, setHeroesCached] = React.useState<boolean>(false);
  const [itemsCached, setItemsCached] = React.useState<boolean>(false);
  const [heroesError, setHeroesError] = React.useState<string>('none');
  const [itemsError, setItemsError] = React.useState<string>('none');

  // Update cache status and errors when they change
  React.useEffect(() => {
    setHeroesCached(isHeroesCached());
    setItemsCached(isItemsCached());
    setHeroesError(getHeroesError() || 'none');
    setItemsError(getItemsError() || 'none');
  }, [isHeroesCached, isItemsCached, getHeroesError, getItemsError]);

  return (
    <div>
      <div data-testid="heroes-result">{heroesResult}</div>
      <div data-testid="items-result">{itemsResult}</div>
      <div data-testid="heroes-cached">{heroesCached.toString()}</div>
      <div data-testid="items-cached">{itemsCached.toString()}</div>
      <div data-testid="heroes-error">{heroesError}</div>
      <div data-testid="items-error">{itemsError}</div>

      <button
        onClick={async () => {
          const result = await fetchHeroesData();
          if ('error' in result) {
            setHeroesResult('error');
          } else {
            setHeroesResult(`${result.length} heroes`);
          }
        }}
        data-testid="fetch-heroes-btn"
      >
        Fetch Heroes
      </button>

      <button
        onClick={async () => {
          const result = await fetchItemsData();
          if ('error' in result) {
            setItemsResult('error');
          } else {
            setItemsResult(`${Object.keys(result).length} items`);
          }
        }}
        data-testid="fetch-items-btn"
      >
        Fetch Items
      </button>

      <button
        onClick={() => {
          clearHeroesCache();
          setHeroesCached(isHeroesCached());
        }}
        data-testid="clear-heroes-cache-btn"
      >
        Clear Heroes Cache
      </button>

      <button
        onClick={() => {
          clearItemsCache();
          setItemsCached(isItemsCached());
        }}
        data-testid="clear-items-cache-btn"
      >
        Clear Items Cache
      </button>

      <button
        onClick={() => {
          clearAllCache();
          setHeroesCached(isHeroesCached());
          setItemsCached(isItemsCached());
        }}
        data-testid="clear-all-cache-btn"
      >
        Clear All Cache
      </button>

      <button
        onClick={() => {
          clearAllErrors();
        }}
        data-testid="clear-all-errors-btn"
      >
        Clear All Errors
      </button>
    </div>
  );
};

// Wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ConstantsDataFetchingProvider>{children}</ConstantsDataFetchingProvider>
);

describe('ConstantsDataFetchingContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
  });

  describe('Initial State', () => {
    it('should initialize with empty state', () => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>,
      );

      expect(screen.getByTestId('heroes-result')).toHaveTextContent('none');
      expect(screen.getByTestId('items-result')).toHaveTextContent('none');
      expect(screen.getByTestId('heroes-cached')).toHaveTextContent('false');
      expect(screen.getByTestId('items-cached')).toHaveTextContent('false');
      expect(screen.getByTestId('heroes-error')).toHaveTextContent('none');
      expect(screen.getByTestId('items-error')).toHaveTextContent('none');
    });
  });

  describe('fetchHeroesData', () => {
    it('should fetch heroes successfully', async () => {
      const mockHeroes = [
        { id: 1, name: 'Anti-Mage', localized_name: 'Anti-Mage' },
        { id: 2, name: 'Axe', localized_name: 'Axe' },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockHeroes),
      });

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>,
      );

      const fetchHeroesButton = screen.getByTestId('fetch-heroes-btn');
      await act(async () => {
        await userEvent.click(fetchHeroesButton);
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/heroes');
      });

      await waitFor(() => {
        expect(screen.getByTestId('heroes-result')).toHaveTextContent('2 heroes');
      });
    });

    it('should handle errors when fetching heroes', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Failed to fetch heroes'));

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>,
      );

      const fetchHeroesButton = screen.getByTestId('fetch-heroes-btn');
      await act(async () => {
        await userEvent.click(fetchHeroesButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('heroes-result')).toHaveTextContent('error');
      });
    });
  });

  describe('fetchItemsData', () => {
    it('should fetch items successfully', async () => {
      const mockItems = {
        '1': { id: 1, name: 'Blink Dagger', localized_name: 'Blink Dagger' },
        '2': { id: 2, name: 'Force Staff', localized_name: 'Force Staff' },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockItems),
      });

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>,
      );

      const fetchItemsButton = screen.getByTestId('fetch-items-btn');
      await act(async () => {
        await userEvent.click(fetchItemsButton);
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/items');
      });

      await waitFor(() => {
        expect(screen.getByTestId('items-result')).toHaveTextContent('2 items');
      });
    });

    it('should handle errors when fetching items', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Failed to fetch items'));

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>,
      );

      const fetchItemsButton = screen.getByTestId('fetch-items-btn');
      await act(async () => {
        await userEvent.click(fetchItemsButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('items-result')).toHaveTextContent('error');
      });
    });
  });

  describe('Cache Management', () => {
    it('should clear heroes cache', async () => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>,
      );

      const clearHeroesCacheButton = screen.getByTestId('clear-heroes-cache-btn');
      await act(async () => {
        await userEvent.click(clearHeroesCacheButton);
      });

      // The cache should be cleared
      await waitFor(() => {
        expect(screen.getByTestId('heroes-cached')).toHaveTextContent('false');
      });
    });

    it('should clear items cache', async () => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>,
      );

      const clearItemsCacheButton = screen.getByTestId('clear-items-cache-btn');
      await act(async () => {
        await userEvent.click(clearItemsCacheButton);
      });

      // The cache should be cleared
      await waitFor(() => {
        expect(screen.getByTestId('items-cached')).toHaveTextContent('false');
      });
    });

    it('should clear all cache', async () => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>,
      );

      const clearAllCacheButton = screen.getByTestId('clear-all-cache-btn');
      await act(async () => {
        await userEvent.click(clearAllCacheButton);
      });

      // All cache should be cleared
      await waitFor(() => {
        expect(screen.getByTestId('heroes-cached')).toHaveTextContent('false');
        expect(screen.getByTestId('items-cached')).toHaveTextContent('false');
      });
    });
  });

  describe('Error Management', () => {
    it('should clear all errors', async () => {
      // First cause an error
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>,
      );

      const fetchHeroesButton = screen.getByTestId('fetch-heroes-btn');
      await act(async () => {
        await userEvent.click(fetchHeroesButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('heroes-result')).toHaveTextContent('error');
      });

      // Then clear errors
      const clearAllErrorsButton = screen.getByTestId('clear-all-errors-btn');
      await act(async () => {
        await userEvent.click(clearAllErrorsButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('heroes-error')).toHaveTextContent('none');
      });
    });
  });

  describe('Cache Status', () => {
    it('should check if heroes are cached', async () => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>,
      );

      // Initially not cached
      expect(screen.getByTestId('heroes-cached')).toHaveTextContent('false');

      // Fetch heroes to cache them
      const mockHeroes = [{ id: 1, name: 'Anti-Mage', localized_name: 'Anti-Mage' }];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockHeroes),
      });

      const fetchHeroesButton = screen.getByTestId('fetch-heroes-btn');
      await act(async () => {
        await userEvent.click(fetchHeroesButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('heroes-cached')).toHaveTextContent('true');
      });
    });

    it('should check if items are cached', async () => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>,
      );

      // Initially not cached
      expect(screen.getByTestId('items-cached')).toHaveTextContent('false');

      // Fetch items to cache them
      const mockItems = { '1': { id: 1, name: 'Blink Dagger', localized_name: 'Blink Dagger' } };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockItems),
      });

      const fetchItemsButton = screen.getByTestId('fetch-items-btn');
      await act(async () => {
        await userEvent.click(fetchItemsButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('items-cached')).toHaveTextContent('true');
      });
    });
  });
});
