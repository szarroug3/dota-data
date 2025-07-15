/**
 * Team Data Fetching Context
 * 
 * Responsible for fetching team data from APIs and external sources.
 * Provides raw API responses to the team data management context.
 * Separates data fetching concerns from data management.
 */

import React, { createContext, useCallback, useContext, useState } from 'react';

import type { DotabuffLeague, DotabuffTeam } from '@/types/external-apis';

// ============================================================================
// TYPES
// ============================================================================

interface TeamDataFetchingContextValue {
  // Error states - per ID for granular error tracking
  teamErrors: Map<string, string>;
  leagueErrors: Map<string, string>;
  
  // Individual data fetching actions
  fetchTeamData: (teamId: string, force?: boolean) => Promise<DotabuffTeam | { error: string }>;
  fetchLeagueData: (leagueId: string, force?: boolean) => Promise<DotabuffLeague | { error: string }>;
  
  // Cache management
  clearCache: () => void;
  isTeamCached: (teamId: string) => boolean;
  isLeagueCached: (leagueId: string) => boolean;
  isCached: (teamId: string, leagueId: string) => boolean; // For backward compatibility
  
  // Error management - per ID
  clearTeamError: (teamId: string) => void;
  clearLeagueError: (leagueId: string) => void;
  clearAllErrors: () => void;
  getTeamError: (teamId: string) => string | null;
  getLeagueError: (leagueId: string) => string | null;
}

interface TeamDataFetchingProviderProps {
  children: React.ReactNode;
}

// ============================================================================
// CONTEXT CREATION
// ============================================================================

const TeamDataFetchingContext = createContext<TeamDataFetchingContextValue | undefined>(undefined);

// ============================================================================
// PROVIDER IMPLEMENTATION
// ============================================================================

// eslint-disable-next-line max-lines-per-function
export const TeamDataFetchingProvider: React.FC<TeamDataFetchingProviderProps> = ({ children }) => {
  // ✅ CORRECT: Per-ID error states instead of global error states
  const [teamErrors, setTeamErrors] = useState<Map<string, string>>(new Map());
  const [leagueErrors, setLeagueErrors] = useState<Map<string, string>>(new Map());
  const [teamCache, setTeamCache] = useState<Map<string, DotabuffTeam>>(new Map());
  const [leagueCache, setLeagueCache] = useState<Map<string, DotabuffLeague>>(new Map());

  // ============================================================================
  // CACHE MANAGEMENT
  // ============================================================================

  const isTeamCached = useCallback((teamId: string) => {
    return teamCache.has(teamId);
  }, [teamCache]);

  const isLeagueCached = useCallback((leagueId: string) => {
    return leagueCache.has(leagueId);
  }, [leagueCache]);

  const isCached = useCallback((teamId: string, leagueId: string) => {
    return isTeamCached(teamId) && isLeagueCached(leagueId);
  }, [isTeamCached, isLeagueCached]);

  const clearCache = useCallback(() => {
    setTeamCache(new Map());
    setLeagueCache(new Map());
  }, []);

  // ============================================================================
  // ERROR MANAGEMENT - Per ID
  // ============================================================================

  const clearTeamError = useCallback((teamId: string) => {
    setTeamErrors(prev => {
      const newErrors = new Map(prev);
      newErrors.delete(teamId);
      return newErrors;
    });
  }, []);

  const clearLeagueError = useCallback((leagueId: string) => {
    setLeagueErrors(prev => {
      const newErrors = new Map(prev);
      newErrors.delete(leagueId);
      return newErrors;
    });
  }, []);

  const clearAllErrors = useCallback(() => {
    setTeamErrors(new Map());
    setLeagueErrors(new Map());
  }, []);

  const getTeamError = useCallback((teamId: string) => {
    return teamErrors.get(teamId) || null;
  }, [teamErrors]);

  const getLeagueError = useCallback((leagueId: string) => {
    return leagueErrors.get(leagueId) || null;
  }, [leagueErrors]);

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  const checkTeamCacheAndReturn = useCallback((teamId: string) => {
    if (teamCache.has(teamId)) {
      const cachedTeam = teamCache.get(teamId);
      if (cachedTeam) {
        console.log('Returning cached team data');
        return cachedTeam;
      }
    }
    return null;
  }, [teamCache]);

  const checkLeagueCacheAndReturn = useCallback((leagueId: string) => {
    if (leagueCache.has(leagueId)) {
      const cachedLeague = leagueCache.get(leagueId);
      if (cachedLeague) {
        console.log('Returning cached league data');
        return cachedLeague;
      }
    }
    return null;
  }, [leagueCache]);

  const handleTeamApiError = useCallback((teamId: string, errorMessage: string) => {
    setTeamErrors(prev => new Map(prev).set(teamId, errorMessage));
  }, []);

  const handleLeagueApiError = useCallback((leagueId: string, errorMessage: string) => {
    setLeagueErrors(prev => new Map(prev).set(leagueId, errorMessage));
  }, []);

  // ============================================================================
  // INDIVIDUAL API FETCHING FUNCTIONS
  // ============================================================================

  const fetchTeamData = useCallback(async (teamId: string, force = false): Promise<DotabuffTeam | { error: string }> => {
    try {
      // Clear any existing error for this specific team
      clearTeamError(teamId);

      // Check cache first unless force fetch is requested
      if (!force) {
        const cachedTeam = checkTeamCacheAndReturn(teamId);
        if (cachedTeam) {
          return cachedTeam;
        }
      }

      console.log('Fetching team data from API');
      const response = await fetch(`/api/teams/${teamId}`);

      if (!response.ok) {
        const errorMsg = 'Failed to fetch team data';
        handleTeamApiError(teamId, errorMsg);
        return { error: errorMsg };
      }

      const team = await response.json() as DotabuffTeam;
      console.log('Team data', team);

      // Cache the successful response
      setTeamCache(prevCache => new Map(prevCache).set(teamId, team));

      return team;
    } catch {
      const errorMsg = 'Failed to fetch team data';
      handleTeamApiError(teamId, errorMsg);
      return { error: errorMsg };
    }
  }, [checkTeamCacheAndReturn, handleTeamApiError, clearTeamError]);

  const fetchLeagueData = useCallback(async (leagueId: string, force = false): Promise<DotabuffLeague | { error: string }> => {
    try {
      // Clear any existing error for this specific league
      clearLeagueError(leagueId);

      // Check cache first unless force fetch is requested
      if (!force) {
        const cachedLeague = checkLeagueCacheAndReturn(leagueId);
        if (cachedLeague) {
          return cachedLeague;
        }
      }

      console.log('Fetching league data from API');
      const response = await fetch(`/api/leagues/${leagueId}`);

      if (!response.ok) {
        const errorMsg = 'Failed to fetch league data';
        handleLeagueApiError(leagueId, errorMsg);
        return { error: errorMsg };
      }

      const league = await response.json() as DotabuffLeague;
      console.log('League data', league);

      // Cache the successful response
      setLeagueCache(prevCache => new Map(prevCache).set(leagueId, league));

      return league;
    } catch {
      const errorMsg = 'Failed to fetch league data';
      handleLeagueApiError(leagueId, errorMsg);
      return { error: errorMsg };
    }
  }, [checkLeagueCacheAndReturn, handleLeagueApiError, clearLeagueError]);

  // ============================================================================
  // CONTEXT VALUE
  // ============================================================================

  const createContextValue = useCallback((): TeamDataFetchingContextValue => ({
    teamErrors,
    leagueErrors,
    fetchTeamData,
    fetchLeagueData,
    clearCache,
    isTeamCached,
    isLeagueCached,
    isCached,
    clearTeamError,
    clearLeagueError,
    clearAllErrors,
    getTeamError,
    getLeagueError
  }), [
    teamErrors,
    leagueErrors,
    fetchTeamData,
    fetchLeagueData,
    clearCache,
    isTeamCached,
    isLeagueCached,
    isCached,
    clearTeamError,
    clearLeagueError,
    clearAllErrors,
    getTeamError,
    getLeagueError
  ]);

  return (
    <TeamDataFetchingContext.Provider value={createContextValue()}>
      {children}
    </TeamDataFetchingContext.Provider>
  );
};

// ============================================================================
// HOOK
// ============================================================================

export const useTeamDataFetching = (): TeamDataFetchingContextValue => {
  const context = useContext(TeamDataFetchingContext);
  if (context === undefined) {
    throw new Error('useTeamDataFetching must be used within a TeamDataFetchingProvider');
  }
  return context;
}; 