"use client";

/**
 * Team Data Fetching Context
 * 
 * Responsible for fetching team data from APIs and external sources.
 * Provides raw API responses to the team data management context.
 * Separates data fetching concerns from data management.
 */

import React, { createContext, useCallback, useContext, useRef, useState } from 'react';

import type { ApiErrorResponse } from '@/types/api';
import type { DotabuffLeague, DotabuffTeam } from '@/types/external-apis';

// ============================================================================
// TYPES
// ============================================================================

export interface TeamDataFetchingContextValue {
  // Core data fetching (handles cache logic internally)
  fetchTeamData: (teamId: number, force?: boolean) => Promise<DotabuffTeam | { error: string }>;
  fetchLeagueData: (leagueId: number, force?: boolean) => Promise<DotabuffLeague | { error: string }>;
  
  // Cache management (for explicit control)
  clearTeamCache: (teamId?: number) => void;
  clearLeagueCache: (leagueId?: number) => void;
  clearAllCache: () => void;
  
  // Error management
  clearTeamError: (teamId: number) => void;
  clearLeagueError: (leagueId: number) => void;
  clearAllErrors: () => void;
  
  // Status queries (for debugging/monitoring)
  isTeamCached: (teamId: number) => boolean;
  isLeagueCached: (leagueId: number) => boolean;
  getTeamError: (teamId: number) => string | null;
  getLeagueError: (leagueId: number) => string | null;
}

interface TeamDataFetchingProviderProps {
  children: React.ReactNode;
}

// ============================================================================
// CONTEXT CREATION
// ============================================================================

const TeamDataFetchingContext = createContext<TeamDataFetchingContextValue | undefined>(undefined);

// ============================================================================
// CUSTOM HOOKS
// ============================================================================

const useTeamDataState = () => {
  const [teamCache, setTeamCache] = useState<Map<number, DotabuffTeam>>(new Map());
  const [leagueCache, setLeagueCache] = useState<Map<number, DotabuffLeague>>(new Map());
  const [teamErrors, setTeamErrors] = useState<Map<number, string>>(new Map());
  const [leagueErrors, setLeagueErrors] = useState<Map<number, string>>(new Map());

  return {
    teamCache,
    setTeamCache,
    leagueCache,
    setLeagueCache,
    teamErrors,
    setTeamErrors,
    leagueErrors,
    setLeagueErrors
  };
};

const useCacheManagement = (
  teamCache: Map<number, DotabuffTeam>,
  leagueCache: Map<number, DotabuffLeague>,
  setTeamCache: React.Dispatch<React.SetStateAction<Map<number, DotabuffTeam>>>,
  setLeagueCache: React.Dispatch<React.SetStateAction<Map<number, DotabuffLeague>>>
) => {
  const clearTeamCache = useCallback((teamId?: number) => {
    if (teamId) {
      setTeamCache(prev => {
        const newCache = new Map(prev);
        newCache.delete(teamId);
        return newCache;
      });
    } else {
      setTeamCache(new Map());
    }
  }, [setTeamCache]);

  const clearLeagueCache = useCallback((leagueId?: number) => {
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
    setTeamCache(new Map());
    setLeagueCache(new Map());
  }, [setTeamCache, setLeagueCache]);

  const isTeamCached = useCallback((teamId: number) => {
    return teamCache.has(teamId);
  }, [teamCache]);

  const isLeagueCached = useCallback((leagueId: number) => {
    return leagueCache.has(leagueId);
  }, [leagueCache]);

  return {
    clearTeamCache,
    clearLeagueCache,
    clearAllCache,
    isTeamCached,
    isLeagueCached
  };
};

const useErrorManagement = (
  teamErrors: Map<number, string>,
  leagueErrors: Map<number, string>,
  setTeamErrors: React.Dispatch<React.SetStateAction<Map<number, string>>>,
  setLeagueErrors: React.Dispatch<React.SetStateAction<Map<number, string>>>
) => {
  const clearTeamError = useCallback((teamId: number) => {
    setTeamErrors(prev => {
      const newErrors = new Map(prev);
      newErrors.delete(teamId);
      return newErrors;
    });
  }, [setTeamErrors]);

  const clearLeagueError = useCallback((leagueId: number) => {
    setLeagueErrors(prev => {
      const newErrors = new Map(prev);
      newErrors.delete(leagueId);
      return newErrors;
    });
  }, [setLeagueErrors]);

  const clearAllErrors = useCallback(() => {
    setTeamErrors(new Map());
    setLeagueErrors(new Map());
  }, [setTeamErrors, setLeagueErrors]);

  const getTeamError = useCallback((teamId: number) => {
    return teamErrors.get(teamId) || null;
  }, [teamErrors]);

  const getLeagueError = useCallback((leagueId: number) => {
    return leagueErrors.get(leagueId) || null;
  }, [leagueErrors]);

  return {
    clearTeamError,
    clearLeagueError,
    clearAllErrors,
    getTeamError,
    getLeagueError
  };
};

const useTeamApiFetching = (
  teamCache: Map<number, DotabuffTeam>,
  setTeamCache: React.Dispatch<React.SetStateAction<Map<number, DotabuffTeam>>>,
  setTeamErrors: React.Dispatch<React.SetStateAction<Map<number, string>>>
) => {
  // Use refs to access current cache values without causing function recreation
  const teamCacheRef = useRef<Map<number, DotabuffTeam>>(new Map());
  
  // Update ref when cache changes
  teamCacheRef.current = teamCache;

  const handleTeamError = useCallback((teamId: number, errorMsg: string) => {
    setTeamErrors(prev => new Map(prev).set(teamId, errorMsg));
  }, [setTeamErrors]);

  const handleTeamSuccess = useCallback((teamId: number, team: DotabuffTeam) => {
    setTeamCache(prevCache => new Map(prevCache).set(teamId, team));
    setTeamErrors(prev => {
      const newErrors = new Map(prev);
      newErrors.delete(teamId);
      return newErrors;
    });
  }, [setTeamCache, setTeamErrors]);

  const processTeamResponse = useCallback(async (response: Response, teamId: number): Promise<DotabuffTeam | { error: string }> => {
    if (!response.ok) {
      let errorMsg = 'Failed to fetch team data';
      
      try {
        const errorData = await response.json() as ApiErrorResponse;
        errorMsg = errorData.error || errorMsg;
      } catch {
        errorMsg = response.statusText || errorMsg;
      }
      
      handleTeamError(teamId, errorMsg);
      return { error: errorMsg };
    }

    const team = await response.json() as DotabuffTeam;
    handleTeamSuccess(teamId, team);
    return team;
  }, [handleTeamError, handleTeamSuccess]);

  const fetchTeamData = useCallback(async (teamId: number, force = false): Promise<DotabuffTeam | { error: string }> => {
    // Check cache first (unless force=true)
    if (!force && teamCacheRef.current.has(teamId)) {
      const cachedTeam = teamCacheRef.current.get(teamId);
      if (cachedTeam) {
        return cachedTeam;
      }
    }

    try {
      const url = force ? `/api/teams/${teamId.toString()}?force=true` : `/api/teams/${teamId.toString()}`;
      const response = await fetch(url);
      return await processTeamResponse(response, teamId);
    } catch (error) {
      const errorMsg = 'Failed to fetch team data';
      console.error('Error fetching team data:', error);
      handleTeamError(teamId, errorMsg);
      return { error: errorMsg };
    }
  }, [processTeamResponse, handleTeamError]);

  return { fetchTeamData };
};

const useLeagueApiFetching = (
  leagueCache: Map<number, DotabuffLeague>,
  setLeagueCache: React.Dispatch<React.SetStateAction<Map<number, DotabuffLeague>>>,
  setLeagueErrors: React.Dispatch<React.SetStateAction<Map<number, string>>>
) => {
  // Use refs to access current cache values without causing function recreation
  const leagueCacheRef = useRef<Map<number, DotabuffLeague>>(new Map());
  
  // Update ref when cache changes
  leagueCacheRef.current = leagueCache;

  const handleLeagueError = useCallback((leagueId: number, errorMsg: string) => {
    setLeagueErrors(prev => new Map(prev).set(leagueId, errorMsg));
  }, [setLeagueErrors]);

  const handleLeagueSuccess = useCallback((leagueId: number, league: DotabuffLeague) => {
    setLeagueCache(prevCache => new Map(prevCache).set(leagueId, league));
    setLeagueErrors(prev => {
      const newErrors = new Map(prev);
      newErrors.delete(leagueId);
      return newErrors;
    });
  }, [setLeagueCache, setLeagueErrors]);

  const processLeagueResponse = useCallback(async (response: Response, leagueId: number): Promise<DotabuffLeague | { error: string }> => {
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

    const league = await response.json() as DotabuffLeague;
    handleLeagueSuccess(leagueId, league);
    return league;
  }, [handleLeagueError, handleLeagueSuccess]);

  const fetchLeagueData = useCallback(async (leagueId: number, force = false): Promise<DotabuffLeague | { error: string }> => {
    // Check cache first (unless force=true)
    if (!force && leagueCacheRef.current.has(leagueId)) {
      const cachedLeague = leagueCacheRef.current.get(leagueId);
      if (cachedLeague) {
        return cachedLeague;
      }
    }

    try {
      const url = force ? `/api/leagues/${leagueId.toString()}?force=true` : `/api/leagues/${leagueId.toString()}`;
      const response = await fetch(url);
      return await processLeagueResponse(response, leagueId);
    } catch (error) {
      const errorMsg = 'Failed to fetch league data';
      console.error('Error fetching league data:', error);
      handleLeagueError(leagueId, errorMsg);
      return { error: errorMsg };
    }
  }, [processLeagueResponse, handleLeagueError]);

  return { fetchLeagueData };
};

const useApiFetching = (
  teamCache: Map<number, DotabuffTeam>,
  leagueCache: Map<number, DotabuffLeague>,
  setTeamCache: React.Dispatch<React.SetStateAction<Map<number, DotabuffTeam>>>,
  setLeagueCache: React.Dispatch<React.SetStateAction<Map<number, DotabuffLeague>>>,
  setTeamErrors: React.Dispatch<React.SetStateAction<Map<number, string>>>,
  setLeagueErrors: React.Dispatch<React.SetStateAction<Map<number, string>>>
) => {
  const { fetchTeamData } = useTeamApiFetching(teamCache, setTeamCache, setTeamErrors);
  const { fetchLeagueData } = useLeagueApiFetching(leagueCache, setLeagueCache, setLeagueErrors);

  return {
    fetchTeamData,
    fetchLeagueData
  };
};

// ============================================================================
// PROVIDER IMPLEMENTATION
// ============================================================================

export const TeamDataFetchingProvider: React.FC<TeamDataFetchingProviderProps> = ({ children }) => {
  const {
    teamCache,
    setTeamCache,
    leagueCache,
    setLeagueCache,
    teamErrors,
    setTeamErrors,
    leagueErrors,
    setLeagueErrors
  } = useTeamDataState();

  const {
    clearTeamCache,
    clearLeagueCache,
    clearAllCache,
    isTeamCached,
    isLeagueCached
  } = useCacheManagement(teamCache, leagueCache, setTeamCache, setLeagueCache);

  const {
    clearTeamError,
    clearLeagueError,
    clearAllErrors,
    getTeamError,
    getLeagueError
  } = useErrorManagement(teamErrors, leagueErrors, setTeamErrors, setLeagueErrors);

  const {
    fetchTeamData,
    fetchLeagueData
  } = useApiFetching(teamCache, leagueCache, setTeamCache, setLeagueCache, setTeamErrors, setLeagueErrors);

  const contextValue: TeamDataFetchingContextValue = {
    fetchTeamData,
    fetchLeagueData,
    clearTeamCache,
    clearLeagueCache,
    clearAllCache,
    clearTeamError,
    clearLeagueError,
    clearAllErrors,
    isTeamCached,
    isLeagueCached,
    getTeamError,
    getLeagueError
  };

  return (
    <TeamDataFetchingContext.Provider value={contextValue}>
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