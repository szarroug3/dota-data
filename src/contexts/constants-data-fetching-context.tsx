"use client";

/**
 * Constants Data Fetching Context
 * 
 * Responsible for fetching constants data (heroes, items) from APIs and external sources.
 * Provides raw API responses to the constants data management context.
 * Separates data fetching concerns from data management.
 */

import React, { createContext, useCallback, useContext, useState } from 'react';

import type { ApiErrorResponse } from '@/types/api';
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
    setItemsError
  };
};

const useCacheManagement = (
  setHeroesCache: React.Dispatch<React.SetStateAction<OpenDotaHero[] | null>>,
  setItemsCache: React.Dispatch<React.SetStateAction<Record<string, OpenDotaItem> | null>>
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
    isItemsCached
  };
};

const useErrorManagement = (
  setHeroesError: React.Dispatch<React.SetStateAction<string | null>>,
  setItemsError: React.Dispatch<React.SetStateAction<string | null>>
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
    getItemsError
  };
};

const useConstantsApiFetching = (
  heroesCache: OpenDotaHero[] | null,
  itemsCache: Record<string, OpenDotaItem> | null,
  setHeroesCache: React.Dispatch<React.SetStateAction<OpenDotaHero[] | null>>,
  setItemsCache: React.Dispatch<React.SetStateAction<Record<string, OpenDotaItem> | null>>,
  setHeroesError: React.Dispatch<React.SetStateAction<string | null>>,
  setItemsError: React.Dispatch<React.SetStateAction<string | null>>
) => {
  const handleHeroesError = useCallback((errorMsg: string) => {
    setHeroesError(errorMsg);
  }, [setHeroesError]);

  const handleItemsError = useCallback((errorMsg: string) => {
    setItemsError(errorMsg);
  }, [setItemsError]);

  const handleHeroesSuccess = useCallback((heroes: OpenDotaHero[]) => {
    setHeroesCache(heroes);
    setHeroesError(null);
  }, [setHeroesCache, setHeroesError]);

  const handleItemsSuccess = useCallback((items: Record<string, OpenDotaItem>) => {
    setItemsCache(items);
    setItemsError(null);
  }, [setItemsCache, setItemsError]);

  const processHeroesResponse = useCallback(async (response: Response): Promise<OpenDotaHero[] | { error: string }> => {
    if (!response.ok) {
      let errorMsg = 'Failed to fetch heroes data';
      
      try {
        const errorData = await response.json() as ApiErrorResponse;
        errorMsg = errorData.error || errorMsg;
      } catch {
        errorMsg = response.statusText || errorMsg;
      }
      
      handleHeroesError(errorMsg);
      return { error: errorMsg };
    }

    const heroes = await response.json() as OpenDotaHero[];
    handleHeroesSuccess(heroes);
    return heroes;
  }, [handleHeroesError, handleHeroesSuccess]);

  const processItemsResponse = useCallback(async (response: Response): Promise<Record<string, OpenDotaItem> | { error: string }> => {
    if (!response.ok) {
      let errorMsg = 'Failed to fetch items data';
      
      try {
        const errorData = await response.json() as ApiErrorResponse;
        errorMsg = errorData.error || errorMsg;
      } catch {
        errorMsg = response.statusText || errorMsg;
      }
      
      handleItemsError(errorMsg);
      return { error: errorMsg };
    }

    const items = await response.json() as Record<string, OpenDotaItem>;
    handleItemsSuccess(items);
    return items;
  }, [handleItemsError, handleItemsSuccess]);

  const fetchHeroesData = useCallback(async (force = false): Promise<OpenDotaHero[] | { error: string }> => {
    // Check cache first (unless force=true)
    if (!force && heroesCache !== null) {
      return heroesCache;
    }

    try {
      const url = force ? '/api/heroes?force=true' : '/api/heroes';
      const response = await fetch(url);
      return await processHeroesResponse(response);
    } catch (error) {
      const errorMsg = 'Failed to fetch heroes data';
      console.error('Error fetching heroes data:', error);
      handleHeroesError(errorMsg);
      return { error: errorMsg };
    }
  }, [heroesCache, processHeroesResponse, handleHeroesError]);

  const fetchItemsData = useCallback(async (force = false): Promise<Record<string, OpenDotaItem> | { error: string }> => {
    // Check cache first (unless force=true)
    if (!force && itemsCache !== null) {
      return itemsCache;
    }

    try {
      const url = force ? '/api/items?force=true' : '/api/items';
      const response = await fetch(url);
      return await processItemsResponse(response);
    } catch (error) {
      const errorMsg = 'Failed to fetch items data';
      console.error('Error fetching items data:', error);
      handleItemsError(errorMsg);
      return { error: errorMsg };
    }
  }, [itemsCache, processItemsResponse, handleItemsError]);

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
    setItemsError
  } = useConstantsDataState();

  const {
    clearHeroesCache,
    clearItemsCache,
    clearAllCache,
    isHeroesCached,
    isItemsCached
  } = useCacheManagement(setHeroesCache, setItemsCache);

  const {
    clearHeroesError,
    clearItemsError,
    clearAllErrors,
    getHeroesError,
    getItemsError
  } = useErrorManagement(setHeroesError, setItemsError);

  const {
    fetchHeroesData,
    fetchItemsData
  } = useConstantsApiFetching(
    heroesCache,
    itemsCache,
    setHeroesCache,
    setItemsCache,
    setHeroesError,
    setItemsError
  );

  const contextValue: ConstantsDataFetchingContextValue = {
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
    getItemsError: () => getItemsError(itemsError)
  };

  return (
    <ConstantsDataFetchingContext.Provider value={contextValue}>
      {children}
    </ConstantsDataFetchingContext.Provider>
  );
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