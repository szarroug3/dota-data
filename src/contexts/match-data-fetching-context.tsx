"use client";

/**
 * Match Data Fetching Context
 * 
 * Responsible for fetching match data from APIs and external sources.
 * Provides raw API responses to the match data management context.
 * Separates data fetching concerns from data management.
 */

import React, { createContext, useCallback, useContext, useState } from 'react';

import type { ApiErrorResponse } from '@/types/api';
import type { OpenDotaMatch } from '@/types/external-apis';

// ============================================================================
// TYPES
// ============================================================================

interface MatchDataFetchingContextValue {
  // Core data fetching (handles cache logic internally)
  fetchMatchData: (matchId: string, force?: boolean) => Promise<OpenDotaMatch | { error: string }>;
  
  // Cache management (for explicit control)
  clearMatchCache: (matchId?: string) => void;
  clearAllCache: () => void;
  
  // Error management
  clearMatchError: (matchId: string) => void;
  clearAllErrors: () => void;
  
  // Status queries (for debugging/monitoring)
  isMatchCached: (matchId: string) => boolean;
  getMatchError: (matchId: string) => string | null;
}

interface MatchDataFetchingProviderProps {
  children: React.ReactNode;
}

// ============================================================================
// CONTEXT CREATION
// ============================================================================

const MatchDataFetchingContext = createContext<MatchDataFetchingContextValue | undefined>(undefined);

// ============================================================================
// CUSTOM HOOKS
// ============================================================================

const useMatchDataState = () => {
  const [matchCache, setMatchCache] = useState<Map<string, OpenDotaMatch>>(new Map());
  const [matchErrors, setMatchErrors] = useState<Map<string, string>>(new Map());

  return {
    matchCache,
    setMatchCache,
    matchErrors,
    setMatchErrors
  };
};

const useCacheManagement = (
  matchCache: Map<string, OpenDotaMatch>,
  setMatchCache: React.Dispatch<React.SetStateAction<Map<string, OpenDotaMatch>>>
) => {
  const clearMatchCache = useCallback((matchId?: string) => {
    if (matchId) {
      setMatchCache(prev => {
        const newCache = new Map(prev);
        newCache.delete(matchId);
        return newCache;
      });
    } else {
      setMatchCache(new Map());
    }
  }, [setMatchCache]);

  const clearAllCache = useCallback(() => {
    setMatchCache(new Map());
  }, [setMatchCache]);

  const isMatchCached = useCallback((matchId: string) => {
    return matchCache.has(matchId);
  }, [matchCache]);

  return {
    clearMatchCache,
    clearAllCache,
    isMatchCached
  };
};

const useErrorManagement = (
  matchErrors: Map<string, string>,
  setMatchErrors: React.Dispatch<React.SetStateAction<Map<string, string>>>
) => {
  const clearMatchError = useCallback((matchId: string) => {
    setMatchErrors(prev => {
      const newErrors = new Map(prev);
      newErrors.delete(matchId);
      return newErrors;
    });
  }, [setMatchErrors]);

  const clearAllErrors = useCallback(() => {
    setMatchErrors(new Map());
  }, [setMatchErrors]);

  const getMatchError = useCallback((matchId: string) => {
    return matchErrors.get(matchId) || null;
  }, [matchErrors]);

  return {
    clearMatchError,
    clearAllErrors,
    getMatchError
  };
};

const useMatchApiFetching = (
  matchCache: Map<string, OpenDotaMatch>,
  setMatchCache: React.Dispatch<React.SetStateAction<Map<string, OpenDotaMatch>>>,
  setMatchErrors: React.Dispatch<React.SetStateAction<Map<string, string>>>
) => {
  const handleMatchError = useCallback((matchId: string, errorMsg: string) => {
    setMatchErrors(prev => new Map(prev).set(matchId, errorMsg));
  }, [setMatchErrors]);

  const handleMatchSuccess = useCallback((matchId: string, match: OpenDotaMatch) => {
    setMatchCache(prevCache => new Map(prevCache).set(matchId, match));
    setMatchErrors(prev => {
      const newErrors = new Map(prev);
      newErrors.delete(matchId);
      return newErrors;
    });
  }, [setMatchCache, setMatchErrors]);

  const processMatchResponse = useCallback(async (response: Response, matchId: string): Promise<OpenDotaMatch | { error: string }> => {
    if (!response.ok) {
      let errorMsg = 'Failed to fetch match data';
      
      try {
        const errorData = await response.json() as ApiErrorResponse;
        errorMsg = errorData.error || errorMsg;
      } catch {
        errorMsg = response.statusText || errorMsg;
      }
      
      handleMatchError(matchId, errorMsg);
      return { error: errorMsg };
    }

    const match = await response.json() as OpenDotaMatch;
    handleMatchSuccess(matchId, match);
    return match;
  }, [handleMatchError, handleMatchSuccess]);

  const fetchMatchData = useCallback(async (matchId: string, force = false): Promise<OpenDotaMatch | { error: string }> => {
    // Check cache first (unless force=true)
    if (!force && matchCache.has(matchId)) {
      const cachedMatch = matchCache.get(matchId);
      if (cachedMatch) {
        return cachedMatch;
      }
    }

    try {
      const url = force ? `/api/matches/${matchId}?force=true` : `/api/matches/${matchId}`;
      const response = await fetch(url);
      return await processMatchResponse(response, matchId);
    } catch (error) {
      const errorMsg = 'Failed to fetch match data';
      console.error('Error fetching match data:', error);
      handleMatchError(matchId, errorMsg);
      return { error: errorMsg };
    }
  }, [matchCache, processMatchResponse, handleMatchError]);

  return { fetchMatchData };
};

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

export const MatchDataFetchingProvider: React.FC<MatchDataFetchingProviderProps> = ({ children }) => {
  const {
    matchCache,
    setMatchCache,
    matchErrors,
    setMatchErrors
  } = useMatchDataState();

  const {
    clearMatchCache,
    clearAllCache,
    isMatchCached
  } = useCacheManagement(matchCache, setMatchCache);

  const {
    clearMatchError,
    clearAllErrors,
    getMatchError
  } = useErrorManagement(matchErrors, setMatchErrors);

  const {
    fetchMatchData
  } = useMatchApiFetching(matchCache, setMatchCache, setMatchErrors);

  const contextValue: MatchDataFetchingContextValue = {
    // Core data fetching
    fetchMatchData,
    
    // Cache management
    clearMatchCache,
    clearAllCache,
    
    // Error management
    clearMatchError,
    clearAllErrors,
    
    // Status queries
    isMatchCached,
    getMatchError
  };

  return (
    <MatchDataFetchingContext.Provider value={contextValue}>
      {children}
    </MatchDataFetchingContext.Provider>
  );
};

// ============================================================================
// CUSTOM HOOK
// ============================================================================

export const useMatchDataFetching = (): MatchDataFetchingContextValue => {
  const context = useContext(MatchDataFetchingContext);
  
  if (context === undefined) {
    throw new Error('useMatchDataFetching must be used within a MatchDataFetchingProvider');
  }
  
  return context;
}; 