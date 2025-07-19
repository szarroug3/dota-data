"use client";

/**
 * Team Data Fetching Context
 * 
 * Responsible for fetching team data from APIs and external sources.
 * Provides raw API responses to the team data management context.
 * Separates data fetching concerns from data management.
 */

import React, { createContext, useCallback, useContext, useState } from 'react';

import type { ApiErrorResponse } from '@/types/api';
import type { DotabuffLeague, DotabuffTeam } from '@/types/external-apis';

// ============================================================================
// TYPES
// ============================================================================

interface TeamDataFetchingContextValue {
  // Core data fetching (handles cache logic internally)
  fetchTeamData: (teamId: string, force?: boolean) => Promise<DotabuffTeam | { error: string }>;
  fetchLeagueData: (leagueId: string, force?: boolean) => Promise<DotabuffLeague | { error: string }>;
  
  // Cache management (for explicit control)
  clearTeamCache: (teamId?: string) => void;
  clearLeagueCache: (leagueId?: string) => void;
  clearAllCache: () => void;
  
  // Error management
  clearTeamError: (teamId: string) => void;
  clearLeagueError: (leagueId: string) => void;
  clearAllErrors: () => void;
  
  // Status queries (for debugging/monitoring)
  isTeamCached: (teamId: string) => boolean;
  isLeagueCached: (leagueId: string) => boolean;
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
// CUSTOM HOOKS
// ============================================================================

const useTeamDataState = () => {
  const [teamCache, setTeamCache] = useState<Map<string, DotabuffTeam>>(new Map());
  const [leagueCache, setLeagueCache] = useState<Map<string, DotabuffLeague>>(new Map());
  const [teamErrors, setTeamErrors] = useState<Map<string, string>>(new Map());
  const [leagueErrors, setLeagueErrors] = useState<Map<string, string>>(new Map());

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
  teamCache: Map<string, DotabuffTeam>,
  leagueCache: Map<string, DotabuffLeague>,
  setTeamCache: React.Dispatch<React.SetStateAction<Map<string, DotabuffTeam>>>,
  setLeagueCache: React.Dispatch<React.SetStateAction<Map<string, DotabuffLeague>>>
) => {
  const clearTeamCache = useCallback((teamId?: string) => {
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
    setTeamCache(new Map());
    setLeagueCache(new Map());
  }, [setTeamCache, setLeagueCache]);

  const isTeamCached = useCallback((teamId: string) => {
    return teamCache.has(teamId);
  }, [teamCache]);

  const isLeagueCached = useCallback((leagueId: string) => {
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
  teamErrors: Map<string, string>,
  leagueErrors: Map<string, string>,
  setTeamErrors: React.Dispatch<React.SetStateAction<Map<string, string>>>,
  setLeagueErrors: React.Dispatch<React.SetStateAction<Map<string, string>>>
) => {
  const clearTeamError = useCallback((teamId: string) => {
    setTeamErrors(prev => {
      const newErrors = new Map(prev);
      newErrors.delete(teamId);
      return newErrors;
    });
  }, [setTeamErrors]);

  const clearLeagueError = useCallback((leagueId: string) => {
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

  const getTeamError = useCallback((teamId: string) => {
    return teamErrors.get(teamId) || null;
  }, [teamErrors]);

  const getLeagueError = useCallback((leagueId: string) => {
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
  teamCache: Map<string, DotabuffTeam>,
  setTeamCache: React.Dispatch<React.SetStateAction<Map<string, DotabuffTeam>>>,
  setTeamErrors: React.Dispatch<React.SetStateAction<Map<string, string>>>
) => {
  const handleTeamError = useCallback((teamId: string, errorMsg: string) => {
    setTeamErrors(prev => new Map(prev).set(teamId, errorMsg));
  }, [setTeamErrors]);

  const handleTeamSuccess = useCallback((teamId: string, team: DotabuffTeam) => {
    setTeamCache(prevCache => new Map(prevCache).set(teamId, team));
    setTeamErrors(prev => {
      const newErrors = new Map(prev);
      newErrors.delete(teamId);
      return newErrors;
    });
  }, [setTeamCache, setTeamErrors]);

  const processTeamResponse = useCallback(async (response: Response, teamId: string): Promise<DotabuffTeam | { error: string }> => {
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

  const fetchTeamData = useCallback(async (teamId: string, force = false): Promise<DotabuffTeam | { error: string }> => {
    // Check cache first (unless force=true)
    if (!force && teamCache.has(teamId)) {
      const cachedTeam = teamCache.get(teamId);
      if (cachedTeam) {
        return cachedTeam;
      }
    }

    try {
      const url = force ? `/api/teams/${teamId}?force=true` : `/api/teams/${teamId}`;
      const response = await fetch(url);
      return await processTeamResponse(response, teamId);
    } catch (error) {
      const errorMsg = 'Failed to fetch team data';
      console.error('Error fetching team data:', error);
      handleTeamError(teamId, errorMsg);
      return { error: errorMsg };
    }
  }, [teamCache, processTeamResponse, handleTeamError]);

  return { fetchTeamData };
};

const useLeagueApiFetching = (
  leagueCache: Map<string, DotabuffLeague>,
  setLeagueCache: React.Dispatch<React.SetStateAction<Map<string, DotabuffLeague>>>,
  setLeagueErrors: React.Dispatch<React.SetStateAction<Map<string, string>>>
) => {
  const handleLeagueError = useCallback((leagueId: string, errorMsg: string) => {
    setLeagueErrors(prev => new Map(prev).set(leagueId, errorMsg));
  }, [setLeagueErrors]);

  const handleLeagueSuccess = useCallback((leagueId: string, league: DotabuffLeague) => {
    setLeagueCache(prevCache => new Map(prevCache).set(leagueId, league));
    setLeagueErrors(prev => {
      const newErrors = new Map(prev);
      newErrors.delete(leagueId);
      return newErrors;
    });
  }, [setLeagueCache, setLeagueErrors]);

  const processLeagueResponse = useCallback(async (response: Response, leagueId: string): Promise<DotabuffLeague | { error: string }> => {
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

  const fetchLeagueData = useCallback(async (leagueId: string, force = false): Promise<DotabuffLeague | { error: string }> => {
    // Check cache first (unless force=true)
    if (!force && leagueCache.has(leagueId)) {
      const cachedLeague = leagueCache.get(leagueId);
      if (cachedLeague) {
        return cachedLeague;
      }
    }

    try {
      const url = force ? `/api/leagues/${leagueId}?force=true` : `/api/leagues/${leagueId}`;
      const response = await fetch(url);
      return await processLeagueResponse(response, leagueId);
    } catch (error) {
      const errorMsg = 'Failed to fetch league data';
      console.error('Error fetching league data:', error);
      handleLeagueError(leagueId, errorMsg);
      return { error: errorMsg };
    }
  }, [leagueCache, processLeagueResponse, handleLeagueError]);

  return { fetchLeagueData };
};

const useApiFetching = (
  teamCache: Map<string, DotabuffTeam>,
  leagueCache: Map<string, DotabuffLeague>,
  setTeamCache: React.Dispatch<React.SetStateAction<Map<string, DotabuffTeam>>>,
  setLeagueCache: React.Dispatch<React.SetStateAction<Map<string, DotabuffLeague>>>,
  setTeamErrors: React.Dispatch<React.SetStateAction<Map<string, string>>>,
  setLeagueErrors: React.Dispatch<React.SetStateAction<Map<string, string>>>
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