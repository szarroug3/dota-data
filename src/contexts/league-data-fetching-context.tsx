"use client";

/**
 * League Data Fetching Context
 * 
 * Responsible for fetching league data from Steam API and external sources.
 * Provides raw API responses to the league data management context.
 * Separates data fetching concerns from data management.
 */

import React, { createContext, useCallback, useContext, useState } from 'react';

import type { ApiErrorResponse } from '@/types/api';
import type { SteamLeague } from '@/types/external-apis';

// ============================================================================
// TYPES
// ============================================================================

interface LeagueDataFetchingContextValue {
  // Core data fetching (handles cache logic internally)
  fetchLeagueData: (leagueId: string, force?: boolean) => Promise<SteamLeague | { error: string }>;
  
  // Cache management (for explicit control)
  clearLeagueCache: (leagueId?: string) => void;
  clearAllCache: () => void;
  
  // Error management
  clearLeagueError: (leagueId: string) => void;
  clearAllErrors: () => void;
  
  // Status queries (for debugging/monitoring)
  isLeagueCached: (leagueId: string) => boolean;
  getLeagueError: (leagueId: string) => string | null;
}

interface LeagueDataFetchingProviderProps {
  children: React.ReactNode;
}

// ============================================================================
// CONTEXT CREATION
// ============================================================================

const LeagueDataFetchingContext = createContext<LeagueDataFetchingContextValue | undefined>(undefined);

// ============================================================================
// CUSTOM HOOKS
// ============================================================================

const useLeagueDataState = () => {
  const [leagueCache, setLeagueCache] = useState<Map<string, SteamLeague>>(new Map());
  const [leagueErrors, setLeagueErrors] = useState<Map<string, string>>(new Map());

  return {
    leagueCache,
    setLeagueCache,
    leagueErrors,
    setLeagueErrors
  };
};

const useCacheManagement = (
  leagueCache: Map<string, SteamLeague>,
  setLeagueCache: React.Dispatch<React.SetStateAction<Map<string, SteamLeague>>>
) => {
  const clearLeagueCache = useCallback((leagueId?: string) => {
    if (leagueId) {
      setLeagueCache(prev => {
        const newCache = new Map(prev);
        newCache.delete(leagueId);
        return newCache;
      });
    } else {
      setLeagueCache(new Map());
    }
  }, [setLeagueCache]);

  const clearAllCache = useCallback(() => {
    setLeagueCache(new Map());
  }, [setLeagueCache]);

  const isLeagueCached = useCallback((leagueId: string) => {
    return leagueCache.has(leagueId);
  }, [leagueCache]);

  return {
    clearLeagueCache,
    clearAllCache,
    isLeagueCached
  };
};

const useErrorManagement = (
  leagueErrors: Map<string, string>,
  setLeagueErrors: React.Dispatch<React.SetStateAction<Map<string, string>>>
) => {
  const clearLeagueError = useCallback((leagueId: string) => {
    setLeagueErrors(prev => {
      const newErrors = new Map(prev);
      newErrors.delete(leagueId);
      return newErrors;
    });
  }, [setLeagueErrors]);

  const clearAllErrors = useCallback(() => {
    setLeagueErrors(new Map());
  }, [setLeagueErrors]);

  const getLeagueError = useCallback((leagueId: string) => {
    return leagueErrors.get(leagueId) || null;
  }, [leagueErrors]);

  return {
    clearLeagueError,
    clearAllErrors,
    getLeagueError
  };
};

const useLeagueApiFetching = (
  leagueCache: Map<string, SteamLeague>,
  setLeagueCache: React.Dispatch<React.SetStateAction<Map<string, SteamLeague>>>,
  setLeagueErrors: React.Dispatch<React.SetStateAction<Map<string, string>>>
) => {
  const handleLeagueError = useCallback((leagueId: string, errorMsg: string) => {
    setLeagueErrors(prev => new Map(prev).set(leagueId, errorMsg));
  }, [setLeagueErrors]);

  const handleLeagueSuccess = useCallback((leagueId: string, league: SteamLeague) => {
    setLeagueCache(prevCache => new Map(prevCache).set(leagueId, league));
    setLeagueErrors(prev => {
      const newErrors = new Map(prev);
      newErrors.delete(leagueId);
      return newErrors;
    });
  }, [setLeagueCache, setLeagueErrors]);

  const processLeagueResponse = useCallback(async (response: Response, leagueId: string): Promise<SteamLeague | { error: string }> => {
    if (!response.ok) {
      let errorMsg = 'Failed to fetch league data';
      
      try {
        const errorData = await response.json() as ApiErrorResponse;
        errorMsg = errorData.error || errorMsg;
      } catch {
        errorMsg = response.statusText || errorMsg;
      }
      
      handleLeagueError(leagueId, errorMsg);
      return { error: errorMsg };
    }

    try {
      const league = await response.json() as SteamLeague;
      handleLeagueSuccess(leagueId, league);
      return league;
    } catch (error) {
      const errorMsg = 'Failed to parse league data';
      handleLeagueError(leagueId, errorMsg);
      return { error: errorMsg };
    }
  }, [handleLeagueError, handleLeagueSuccess]);

  const fetchLeagueData = useCallback(async (leagueId: string, force = false): Promise<SteamLeague | { error: string }> => {
    // Check cache first (unless force is true)
    if (!force && leagueCache.has(leagueId)) {
      return leagueCache.get(leagueId)!;
    }

    try {
      const response = await fetch(`/api/leagues/${leagueId}${force ? '?force=true' : ''}`);
      return await processLeagueResponse(response, leagueId);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Network error';
      handleLeagueError(leagueId, errorMsg);
      return { error: errorMsg };
    }
  }, [leagueCache, processLeagueResponse, handleLeagueError]);

  return {
    fetchLeagueData
  };
};

const useApiFetching = (
  leagueCache: Map<string, SteamLeague>,
  setLeagueCache: React.Dispatch<React.SetStateAction<Map<string, SteamLeague>>>,
  setLeagueErrors: React.Dispatch<React.SetStateAction<Map<string, string>>>
) => {
  const { fetchLeagueData } = useLeagueApiFetching(leagueCache, setLeagueCache, setLeagueErrors);

  return {
    fetchLeagueData
  };
};

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

export const LeagueDataFetchingProvider: React.FC<LeagueDataFetchingProviderProps> = ({ children }) => {
  const { leagueCache, setLeagueCache, leagueErrors, setLeagueErrors } = useLeagueDataState();
  const { clearLeagueCache, clearAllCache, isLeagueCached } = useCacheManagement(leagueCache, setLeagueCache);
  const { clearLeagueError, clearAllErrors, getLeagueError } = useErrorManagement(leagueErrors, setLeagueErrors);
  const { fetchLeagueData } = useApiFetching(leagueCache, setLeagueCache, setLeagueErrors);

  const contextValue: LeagueDataFetchingContextValue = {
    fetchLeagueData,
    clearLeagueCache,
    clearAllCache,
    clearLeagueError,
    clearAllErrors,
    isLeagueCached,
    getLeagueError
  };

  return (
    <LeagueDataFetchingContext.Provider value={contextValue}>
      {children}
    </LeagueDataFetchingContext.Provider>
  );
};

// ============================================================================
// CUSTOM HOOK
// ============================================================================

export const useLeagueDataFetching = (): LeagueDataFetchingContextValue => {
  const context = useContext(LeagueDataFetchingContext);
  if (!context) {
    throw new Error('useLeagueDataFetching must be used within a LeagueDataFetchingProvider');
  }
  return context;
}; 