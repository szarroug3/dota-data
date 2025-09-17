'use client';

/**
 * Constants Data Fetching Context
 *
 * Responsible for fetching constants data (heroes, items) from APIs and external sources.
 * Provides raw API responses to the constants data management context.
 * Separates data fetching concerns from data management.
 */

import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

import { requestAndValidate, type JsonValue } from '@/frontend/lib/api-client';
import { schemas } from '@/types/api-zod';
import type { OpenDotaHero, OpenDotaItem } from '@/types/external-apis';

// ============================================================================
// TYPES
// ============================================================================

interface ConstantsDataFetchingContextValue {
  // Core data fetching (handles cache logic internally)
  fetchHeroesData: (force?: boolean) => Promise<OpenDotaHero[] | { error: string }>;
  fetchItemsData: (force?: boolean) => Promise<Record<string, OpenDotaItem> | { error: string }>;

  // Cache management (for explicit control)
  clearHeroesCache: () => void;
  clearItemsCache: () => void;
  clearAllCache: () => void;

  // Error management
  clearHeroesError: () => void;
  clearItemsError: () => void;
  clearAllErrors: () => void;

  // Status queries (for debugging/monitoring)
  isHeroesCached: () => boolean;
  isItemsCached: () => boolean;
  getHeroesError: () => string | null;
  getItemsError: () => string | null;
}

interface ConstantsDataFetchingProviderProps {
  children: React.ReactNode;
}

// ============================================================================
// CONTEXT CREATION
// ============================================================================

const ConstantsDataFetchingContext = createContext<ConstantsDataFetchingContextValue | undefined>(undefined);

// ============================================================================
// CUSTOM HOOKS
// ============================================================================

const useConstantsDataState = () => {
  const [heroesCache, setHeroesCache] = useState<OpenDotaHero[] | null>(null);
  const [itemsCache, setItemsCache] = useState<Record<string, OpenDotaItem> | null>(null);
  const [heroesError, setHeroesError] = useState<string | null>(null);
  const [itemsError, setItemsError] = useState<string | null>(null);

  return {
    heroesCache,
    setHeroesCache,
    itemsCache,
    setItemsCache,
    heroesError,
    setHeroesError,
    itemsError,
    setItemsError,
  };
};

const useCacheManagement = (
  setHeroesCache: React.Dispatch<React.SetStateAction<OpenDotaHero[] | null>>,
  setItemsCache: React.Dispatch<React.SetStateAction<Record<string, OpenDotaItem> | null>>,
) => {
  const clearHeroesCache = useCallback(() => {
    setHeroesCache(null);
  }, [setHeroesCache]);

  const clearItemsCache = useCallback(() => {
    setItemsCache(null);
  }, [setItemsCache]);

  const clearAllCache = useCallback(() => {
    setHeroesCache(null);
    setItemsCache(null);
  }, [setHeroesCache, setItemsCache]);

  const isHeroesCached = useCallback((heroesCache: OpenDotaHero[] | null) => {
    return heroesCache !== null;
  }, []);

  const isItemsCached = useCallback((itemsCache: Record<string, OpenDotaItem> | null) => {
    return itemsCache !== null;
  }, []);

  return {
    clearHeroesCache,
    clearItemsCache,
    clearAllCache,
    isHeroesCached,
    isItemsCached,
  };
};

const useErrorManagement = (
  setHeroesError: React.Dispatch<React.SetStateAction<string | null>>,
  setItemsError: React.Dispatch<React.SetStateAction<string | null>>,
) => {
  const clearHeroesError = useCallback(() => {
    setHeroesError(null);
  }, [setHeroesError]);

  const clearItemsError = useCallback(() => {
    setItemsError(null);
  }, [setItemsError]);

  const clearAllErrors = useCallback(() => {
    setHeroesError(null);
    setItemsError(null);
  }, [setHeroesError, setItemsError]);

  const getHeroesError = useCallback((heroesError: string | null) => {
    return heroesError;
  }, []);

  const getItemsError = useCallback((itemsError: string | null) => {
    return itemsError;
  }, []);

  return {
    clearHeroesError,
    clearItemsError,
    clearAllErrors,
    getHeroesError,
    getItemsError,
  };
};

function useHeroesApi(
  heroesCache: OpenDotaHero[] | null,
  setHeroesCache: React.Dispatch<React.SetStateAction<OpenDotaHero[] | null>>,
  setHeroesError: React.Dispatch<React.SetStateAction<string | null>>,
) {
  const heroesCacheRef = useRef<OpenDotaHero[] | null>(null);
  heroesCacheRef.current = heroesCache;

  const handleError = useCallback(
    (errorMsg: string) => {
      setHeroesError(errorMsg);
    },
    [setHeroesError],
  );

  const handleSuccess = useCallback(
    (heroes: OpenDotaHero[]) => {
      setHeroesCache(heroes);
      setHeroesError(null);
    },
    [setHeroesCache, setHeroesError],
  );

  const processResponse = useCallback(
    async (path: string): Promise<OpenDotaHero[] | { error: string }> => {
      try {
        const heroes = await requestAndValidate<OpenDotaHero[]>(
          path,
          (d: JsonValue) => schemas.getApiHeroes.parse(d) as OpenDotaHero[],
        );
        handleSuccess(heroes);
        return heroes;
      } catch (err) {
        const errorMsg =
          err && typeof err === 'object' && 'message' in err
            ? String((err as Error).message)
            : 'Failed to fetch heroes data';
        handleError(errorMsg);
        return { error: errorMsg };
      }
    },
    [handleError, handleSuccess],
  );

  const fetchHeroesData = useCallback(
    async (force = false): Promise<OpenDotaHero[] | { error: string }> => {
      if (!force && heroesCacheRef.current !== null) {
        return heroesCacheRef.current;
      }
      try {
        const path = force ? '/api/heroes?force=true' : '/api/heroes';
        return await processResponse(path);
      } catch (error) {
        const errorMsg = 'Failed to fetch heroes data';
        console.error('Error fetching heroes data:', error);
        handleError(errorMsg);
        return { error: errorMsg };
      }
    },
    [processResponse, handleError],
  );

  return { fetchHeroesData };
}

function useItemsApi(
  itemsCache: Record<string, OpenDotaItem> | null,
  setItemsCache: React.Dispatch<React.SetStateAction<Record<string, OpenDotaItem> | null>>,
  setItemsError: React.Dispatch<React.SetStateAction<string | null>>,
) {
  const itemsCacheRef = useRef<Record<string, OpenDotaItem> | null>(null);
  itemsCacheRef.current = itemsCache;

  const handleError = useCallback(
    (errorMsg: string) => {
      setItemsError(errorMsg);
    },
    [setItemsError],
  );

  const handleSuccess = useCallback(
    (items: Record<string, OpenDotaItem>) => {
      setItemsCache(items);
      setItemsError(null);
    },
    [setItemsCache, setItemsError],
  );

  const processResponse = useCallback(
    async (path: string): Promise<Record<string, OpenDotaItem> | { error: string }> => {
      try {
        const items = await requestAndValidate<Record<string, OpenDotaItem>>(path, (d: JsonValue) => {
          return schemas.getApiItems.parse(d) as Record<string, OpenDotaItem>;
        });
        handleSuccess(items);
        return items;
      } catch (err) {
        const errorMsg =
          err && typeof err === 'object' && 'message' in err
            ? String((err as Error).message)
            : 'Failed to fetch items data';
        handleError(errorMsg);
        return { error: errorMsg };
      }
    },
    [handleError, handleSuccess],
  );

  const fetchItemsData = useCallback(
    async (force = false): Promise<Record<string, OpenDotaItem> | { error: string }> => {
      if (!force && itemsCacheRef.current !== null) {
        return itemsCacheRef.current;
      }
      try {
        const path = force ? '/api/items?force=true' : '/api/items';
        return await processResponse(path);
      } catch (error) {
        const errorMsg = 'Failed to fetch items data';
        console.error('Error fetching items data:', error);
        handleError(errorMsg);
        return { error: errorMsg };
      }
    },
    [processResponse, handleError],
  );

  return { fetchItemsData };
}

const useConstantsApiFetching = (
  heroesCache: OpenDotaHero[] | null,
  itemsCache: Record<string, OpenDotaItem> | null,
  setHeroesCache: React.Dispatch<React.SetStateAction<OpenDotaHero[] | null>>,
  setItemsCache: React.Dispatch<React.SetStateAction<Record<string, OpenDotaItem> | null>>,
  setHeroesError: React.Dispatch<React.SetStateAction<string | null>>,
  setItemsError: React.Dispatch<React.SetStateAction<string | null>>,
) => {
  const { fetchHeroesData } = useHeroesApi(heroesCache, setHeroesCache, setHeroesError);
  const { fetchItemsData } = useItemsApi(itemsCache, setItemsCache, setItemsError);
  return { fetchHeroesData, fetchItemsData };
};

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

export const ConstantsDataFetchingProvider: React.FC<ConstantsDataFetchingProviderProps> = ({ children }) => {
  const {
    heroesCache,
    setHeroesCache,
    itemsCache,
    setItemsCache,
    heroesError,
    setHeroesError,
    itemsError,
    setItemsError,
  } = useConstantsDataState();

  const { clearHeroesCache, clearItemsCache, clearAllCache, isHeroesCached, isItemsCached } = useCacheManagement(
    setHeroesCache,
    setItemsCache,
  );

  const { clearHeroesError, clearItemsError, clearAllErrors, getHeroesError, getItemsError } = useErrorManagement(
    setHeroesError,
    setItemsError,
  );

  const { fetchHeroesData, fetchItemsData } = useConstantsApiFetching(
    heroesCache,
    itemsCache,
    setHeroesCache,
    setItemsCache,
    setHeroesError,
    setItemsError,
  );

  const contextValue: ConstantsDataFetchingContextValue = useMemo(
    () => ({
      // Core data fetching
      fetchHeroesData,
      fetchItemsData,

      // Cache management
      clearHeroesCache,
      clearItemsCache,
      clearAllCache,

      // Error management
      clearHeroesError,
      clearItemsError,
      clearAllErrors,

      // Status queries
      isHeroesCached: () => isHeroesCached(heroesCache),
      isItemsCached: () => isItemsCached(itemsCache),
      getHeroesError: () => getHeroesError(heroesError),
      getItemsError: () => getItemsError(itemsError),
    }),
    [
      fetchHeroesData,
      fetchItemsData,
      clearHeroesCache,
      clearItemsCache,
      clearAllCache,
      clearHeroesError,
      clearItemsError,
      clearAllErrors,
      isHeroesCached,
      isItemsCached,
      heroesCache,
      itemsCache,
      heroesError,
      itemsError,
      getHeroesError,
      getItemsError,
    ],
  );

  return <ConstantsDataFetchingContext.Provider value={contextValue}>{children}</ConstantsDataFetchingContext.Provider>;
};

// ============================================================================
// CUSTOM HOOK
// ============================================================================

export const useConstantsDataFetching = (): ConstantsDataFetchingContextValue => {
  const context = useContext(ConstantsDataFetchingContext);

  if (context === undefined) {
    throw new Error('useConstantsDataFetching must be used within a ConstantsDataFetchingProvider');
  }

  return context;
};
