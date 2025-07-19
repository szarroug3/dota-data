"use client";

/**
 * Hero Data Fetching Context
 * 
 * Responsible for fetching hero data from APIs and external sources.
 * Provides raw API responses to the hero data management context.
 * Separates data fetching concerns from data management.
 */

import React, { createContext, useCallback, useContext, useState } from 'react';

import type { ApiErrorResponse } from '@/types/api';
import type { OpenDotaHero } from '@/types/external-apis';

// ============================================================================
// TYPES
// ============================================================================

interface HeroDataFetchingContextValue {
  // Core data fetching (handles cache logic internally)
  fetchHeroesData: (force?: boolean) => Promise<OpenDotaHero[] | { error: string }>;
  
  // Cache management (for explicit control)
  clearHeroesCache: () => void;
  clearAllCache: () => void;
  
  // Error management
  clearHeroesError: () => void;
  clearAllErrors: () => void;
  
  // Status queries (for debugging/monitoring)
  isHeroesCached: () => boolean;
  getHeroesError: () => string | null;
}

interface HeroDataFetchingProviderProps {
  children: React.ReactNode;
}

// ============================================================================
// CONTEXT CREATION
// ============================================================================

const HeroDataFetchingContext = createContext<HeroDataFetchingContextValue | undefined>(undefined);

// ============================================================================
// CUSTOM HOOKS
// ============================================================================

const useHeroDataState = () => {
  const [heroesCache, setHeroesCache] = useState<OpenDotaHero[] | null>(null);
  const [heroesError, setHeroesError] = useState<string | null>(null);

  return {
    heroesCache,
    setHeroesCache,
    heroesError,
    setHeroesError
  };
};

const useCacheManagement = (
  setHeroesCache: React.Dispatch<React.SetStateAction<OpenDotaHero[] | null>>
) => {
  const clearHeroesCache = useCallback(() => {
    setHeroesCache(null);
  }, [setHeroesCache]);

  const clearAllCache = useCallback(() => {
    setHeroesCache(null);
  }, [setHeroesCache]);

  const isHeroesCached = useCallback((heroesCache: OpenDotaHero[] | null) => {
    return heroesCache !== null;
  }, []);

  return {
    clearHeroesCache,
    clearAllCache,
    isHeroesCached
  };
};

const useErrorManagement = (
  setHeroesError: React.Dispatch<React.SetStateAction<string | null>>
) => {
  const clearHeroesError = useCallback(() => {
    setHeroesError(null);
  }, [setHeroesError]);

  const clearAllErrors = useCallback(() => {
    setHeroesError(null);
  }, [setHeroesError]);

  const getHeroesError = useCallback((heroesError: string | null) => {
    return heroesError;
  }, []);

  return {
    clearHeroesError,
    clearAllErrors,
    getHeroesError
  };
};

const useHeroApiFetching = (
  heroesCache: OpenDotaHero[] | null,
  setHeroesCache: React.Dispatch<React.SetStateAction<OpenDotaHero[] | null>>,
  setHeroesError: React.Dispatch<React.SetStateAction<string | null>>
) => {
  const handleHeroesError = useCallback((errorMsg: string) => {
    setHeroesError(errorMsg);
  }, [setHeroesError]);

  const handleHeroesSuccess = useCallback((heroes: OpenDotaHero[]) => {
    setHeroesCache(heroes);
    setHeroesError(null);
  }, [setHeroesCache, setHeroesError]);

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

  return { fetchHeroesData };
};

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

export const HeroDataFetchingProvider: React.FC<HeroDataFetchingProviderProps> = ({ children }) => {
  const {
    heroesCache,
    setHeroesCache,
    heroesError,
    setHeroesError
  } = useHeroDataState();

  const {
    clearHeroesCache,
    clearAllCache,
    isHeroesCached
  } = useCacheManagement(setHeroesCache);

  const {
    clearHeroesError,
    clearAllErrors,
    getHeroesError
  } = useErrorManagement(setHeroesError);

  const {
    fetchHeroesData
  } = useHeroApiFetching(heroesCache, setHeroesCache, setHeroesError);

  const contextValue: HeroDataFetchingContextValue = {
    // Core data fetching
    fetchHeroesData,
    
    // Cache management
    clearHeroesCache,
    clearAllCache,
    
    // Error management
    clearHeroesError,
    clearAllErrors,
    
    // Status queries
    isHeroesCached: () => isHeroesCached(heroesCache),
    getHeroesError: () => getHeroesError(heroesError)
  };

  return (
    <HeroDataFetchingContext.Provider value={contextValue}>
      {children}
    </HeroDataFetchingContext.Provider>
  );
};

// ============================================================================
// CUSTOM HOOK
// ============================================================================

export const useHeroDataFetching = (): HeroDataFetchingContextValue => {
  const context = useContext(HeroDataFetchingContext);
  
  if (context === undefined) {
    throw new Error('useHeroDataFetching must be used within a HeroDataFetchingProvider');
  }
  
  return context;
}; 