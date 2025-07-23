"use client";

/**
 * Match Data Fetching Context
 * 
 * Responsible for fetching match data from APIs and external sources.
 * Provides raw API responses to the match data management context.
 * Separates data fetching concerns from data management.
 */

import React, { createContext, useCallback, useContext, useRef, useState } from 'react';

import type { ApiErrorResponse } from '@/types/api';
import type { OpenDotaMatch } from '@/types/external-apis';

// ============================================================================
// TYPES
// ============================================================================

export interface MatchDataFetchingContextValue {
  // Core data fetching (handles cache logic internally)
  fetchMatchData: (matchId: number, force?: boolean) => Promise<OpenDotaMatch | { error: string }>;
  
  // Cache management (for explicit control)
  clearMatchCache: (matchId?: number) => void;
  clearAllCache: () => void;
  
  // Error management
  clearMatchError: (matchId: number) => void;
  clearAllErrors: () => void;
  
  // Status queries (for debugging/monitoring)
  isMatchCached: (matchId: number) => boolean;
  getMatchError: (matchId: number) => string | null;
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
  const [matchCache, setMatchCache] = useState<Map<number, OpenDotaMatch>>(new Map());
  const [matchErrors, setMatchErrors] = useState<Map<number, string>>(new Map());

  return {
    matchCache,
    setMatchCache,
    matchErrors,
    setMatchErrors
  };
};

const useCacheManagement = (
  matchCache: Map<number, OpenDotaMatch>,
  setMatchCache: React.Dispatch<React.SetStateAction<Map<number, OpenDotaMatch>>>
) => {
  const clearMatchCache = useCallback((matchId?: number) => {
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

  const isMatchCached = useCallback((matchId: number) => {
    return matchCache.has(matchId);
  }, [matchCache]);

  return {
    clearMatchCache,
    clearAllCache,
    isMatchCached
  };
};

const useErrorManagement = (
  matchErrors: Map<number, string>,
  setMatchErrors: React.Dispatch<React.SetStateAction<Map<number, string>>>
) => {
  const clearMatchError = useCallback((matchId: number) => {
    setMatchErrors(prev => {
      const newErrors = new Map(prev);
      newErrors.delete(matchId);
      return newErrors;
    });
  }, [setMatchErrors]);

  const clearAllErrors = useCallback(() => {
    setMatchErrors(new Map());
  }, [setMatchErrors]);

  const getMatchError = useCallback((matchId: number) => {
    return matchErrors.get(matchId) || null;
  }, [matchErrors]);

  return {
    clearMatchError,
    clearAllErrors,
    getMatchError
  };
};

const useMatchApiFetching = (
  matchCache: Map<number, OpenDotaMatch>,
  setMatchCache: React.Dispatch<React.SetStateAction<Map<number, OpenDotaMatch>>>,
  setMatchErrors: React.Dispatch<React.SetStateAction<Map<number, string>>>
) => {
  // Use refs to access current cache values without causing function recreation
  const matchCacheRef = useRef<Map<number, OpenDotaMatch>>(new Map());
  
  // Update ref when cache changes
  matchCacheRef.current = matchCache;

  const handleMatchError = useCallback((matchId: number, errorMsg: string) => {
    setMatchErrors(prev => new Map(prev).set(matchId, errorMsg));
  }, [setMatchErrors]);

  const handleMatchSuccess = useCallback((matchId: number, match: OpenDotaMatch) => {
    setMatchCache(prevCache => new Map(prevCache).set(matchId, match));
    setMatchErrors(prev => {
      const newErrors = new Map(prev);
      newErrors.delete(matchId);
      return newErrors;
    });
  }, [setMatchCache, setMatchErrors]);

  const processMatchResponse = useCallback(async (response: Response, matchId: number): Promise<OpenDotaMatch | { error: string }> => {
    if (!response.ok) {
      let errorMsg = 'Failed to fetch match data';
      
      try {
        const errorData = await response.json() as ApiErrorResponse;
        errorMsg = errorData.error || errorMsg;
      } catch {
        errorMsg = response.statusText || errorMsg;
      }
      
      console.error(`Match API: Error response for match ${matchId}:`, errorMsg);
      handleMatchError(matchId, errorMsg);
      return { error: errorMsg };
    }

    try {
      const responseText = await response.text();
      const match = JSON.parse(responseText) as OpenDotaMatch;
      
      handleMatchSuccess(matchId, match);
      return match;
    } catch (parseError) {
      const errorMsg = `Failed to parse match data for ${matchId}: ${parseError instanceof Error ? parseError.message : 'Unknown parse error'}`;
      console.error(`Match API: Parse error for match ${matchId}:`, parseError);
      handleMatchError(matchId, errorMsg);
      return { error: errorMsg };
    }
  }, [handleMatchError, handleMatchSuccess]);

  const fetchMatchData = useCallback(async (matchId: number, force = false): Promise<OpenDotaMatch | { error: string }> => {
    // Check cache first (unless force=true)
    if (!force && matchCacheRef.current.has(matchId)) {
      const cachedMatch = matchCacheRef.current.get(matchId);
      if (cachedMatch) {
        return cachedMatch;
      }
    }

    try {
      const url = force ? `/api/matches/${matchId.toString()}?force=true` : `/api/matches/${matchId.toString()}`;
      const response = await fetch(url);
      
      return await processMatchResponse(response, matchId);
    } catch (error) {
      const errorMsg = 'Failed to fetch match data';
      console.error(`Match API: Network error for match ${matchId}:`, error);
      handleMatchError(matchId, errorMsg);
      return { error: errorMsg };
    }
  }, [processMatchResponse, handleMatchError]);

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