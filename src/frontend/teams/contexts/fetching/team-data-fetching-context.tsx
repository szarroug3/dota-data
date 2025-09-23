'use client';

/**
 * Team Data Fetching Context (Frontend - Teams Fetching Context)
 *
 * Mirrors the existing implementation while living under the new frontend structure.
 * Responsible for calling backend API routes and caching raw responses.
 */

import React, { createContext, useCallback, useContext, useRef, useState } from 'react';

import { getLeague, type SteamLeague } from '@/frontend/leagues/api/leagues';
import {
  CACHE_VERSION,
  CacheTtl,
  clearCacheByPrefix,
  clearCacheItem,
  getCacheItem,
  getCacheKey,
  setCacheItem,
} from '@/frontend/lib/cache';
import { fetchWithMemoryAndStorage, type InFlightMap } from '@/frontend/lib/fetch-cache';
import { getTeam } from '@/frontend/teams/api/teams';
import type { SteamTeam } from '@/types/external-apis/steam';

// ============================================================================
// TYPES
// ============================================================================

export interface TeamDataFetchingContextValue {
  // Core data fetching (handles cache logic internally)
  fetchTeamData: (teamId: number, force?: boolean) => Promise<SteamTeam | { error: string }>;
  fetchLeagueData: (leagueId: number, force?: boolean) => Promise<SteamLeague | { error: string }>;

  // Derived data helpers
  findTeamMatchesInLeague: (
    leagueId: number,
    teamId: number,
  ) => Array<{ matchId: number; side: 'radiant' | 'dire' | null }>;

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
// STATE HOOK
// ============================================================================

const useTeamDataState = () => {
  const [teamCache, setTeamCache] = useState<Map<number, SteamTeam>>(new Map());
  const [leagueCache, setLeagueCache] = useState<Map<number, SteamLeague>>(new Map());
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
    setLeagueErrors,
  };
};

// ============================================================================
// CACHE MANAGEMENT
// ============================================================================

const useCacheManagement = (
  teamCache: Map<number, SteamTeam>,
  leagueCache: Map<number, SteamLeague>,
  setTeamCache: React.Dispatch<React.SetStateAction<Map<number, SteamTeam>>>,
  setLeagueCache: React.Dispatch<React.SetStateAction<Map<number, SteamLeague>>>,
) => {
  const clearTeamCache = useCallback(
    (teamId?: number) => {
      if (teamId) {
        setTeamCache((prev) => {
          const newCache = new Map(prev);
          newCache.delete(teamId);
          return newCache;
        });
        const key = getCacheKey(`team:${teamId}`, CACHE_VERSION);
        clearCacheItem(key);
      } else {
        setTeamCache(new Map());
        clearCacheByPrefix(`team:`);
      }
    },
    [setTeamCache],
  );

  const clearLeagueCache = useCallback(
    (leagueId?: number) => {
      if (leagueId) {
        setLeagueCache((prev) => {
          const newCache = new Map(prev);
          newCache.delete(leagueId);
          return newCache;
        });
        const key = getCacheKey(`league:${leagueId}`, CACHE_VERSION);
        clearCacheItem(key);
      } else {
        setLeagueCache(new Map());
        clearCacheByPrefix(`league:`);
      }
    },
    [setLeagueCache],
  );

  const clearAllCache = useCallback(() => {
    setTeamCache(new Map());
    setLeagueCache(new Map());
  }, [setTeamCache, setLeagueCache]);

  const isTeamCached = useCallback(
    (teamId: number) => {
      return teamCache.has(teamId);
    },
    [teamCache],
  );

  const isLeagueCached = useCallback(
    (leagueId: number) => {
      return leagueCache.has(leagueId);
    },
    [leagueCache],
  );

  return {
    clearTeamCache,
    clearLeagueCache,
    clearAllCache,
    isTeamCached,
    isLeagueCached,
  };
};

// ============================================================================
// ERROR MANAGEMENT
// ============================================================================

const useErrorManagement = (
  teamErrors: Map<number, string>,
  leagueErrors: Map<number, string>,
  setTeamErrors: React.Dispatch<React.SetStateAction<Map<number, string>>>,
  setLeagueErrors: React.Dispatch<React.SetStateAction<Map<number, string>>>,
) => {
  const clearTeamError = useCallback(
    (teamId: number) => {
      setTeamErrors((prev) => {
        const newErrors = new Map(prev);
        newErrors.delete(teamId);
        return newErrors;
      });
    },
    [setTeamErrors],
  );

  const clearLeagueError = useCallback(
    (leagueId: number) => {
      setLeagueErrors((prev) => {
        const newErrors = new Map(prev);
        newErrors.delete(leagueId);
        return newErrors;
      });
    },
    [setLeagueErrors],
  );

  const clearAllErrors = useCallback(() => {
    setTeamErrors(new Map());
    setLeagueErrors(new Map());
  }, [setTeamErrors, setLeagueErrors]);

  const getTeamError = useCallback(
    (teamId: number) => {
      return teamErrors.get(teamId) || null;
    },
    [teamErrors],
  );

  const getLeagueError = useCallback(
    (leagueId: number) => {
      return leagueErrors.get(leagueId) || null;
    },
    [leagueErrors],
  );

  return {
    clearTeamError,
    clearLeagueError,
    clearAllErrors,
    getTeamError,
    getLeagueError,
  };
};

// ============================================================================
// API FETCHING HELPERS
// ============================================================================

const useTeamApiFetching = (
  teamCache: Map<number, SteamTeam>,
  setTeamCache: React.Dispatch<React.SetStateAction<Map<number, SteamTeam>>>,
  setTeamErrors: React.Dispatch<React.SetStateAction<Map<number, string>>>,
) => {
  const teamCacheRef = useRef<Map<number, SteamTeam>>(new Map());
  teamCacheRef.current = teamCache;
  const inFlightRef = useRef<InFlightMap<number, SteamTeam>>(new Map());

  const handleTeamError = useCallback(
    (teamId: number, errorMsg: string) => {
      setTeamErrors((prev) => new Map(prev).set(teamId, errorMsg));
    },
    [setTeamErrors],
  );

  const handleTeamSuccess = useCallback(
    (teamId: number, team: SteamTeam) => {
      setTeamCache((prevCache) => new Map(prevCache).set(teamId, team));
      setTeamErrors((prev) => {
        const newErrors = new Map(prev);
        newErrors.delete(teamId);
        return newErrors;
      });
    },
    [setTeamCache, setTeamErrors],
  );

  const fetchTeamData = useCallback(
    async (teamId: number, force = false): Promise<SteamTeam | { error: string }> => {
      try {
        const result = await fetchWithMemoryAndStorage<number, SteamTeam>({
          id: teamId,
          force,
          inMemoryMap: teamCacheRef.current,
          setInMemory: (updater) => setTeamCache((prev) => updater(prev)),
          inFlight: inFlightRef.current,
          getPersisted: (id) =>
            getCacheItem<SteamTeam>(getCacheKey(`team:${id}`, CACHE_VERSION), {
              version: CACHE_VERSION,
              ttlMs: CacheTtl.teams,
            }),
          setPersisted: (id, value) =>
            setCacheItem(getCacheKey(`team:${id}`, CACHE_VERSION), value, {
              version: CACHE_VERSION,
              ttlMs: CacheTtl.teams,
            }),
          loader: async (id, f) => {
            const team = await getTeam(id, f);
            handleTeamSuccess(id, team);
            return team;
          },
        });
        return result;
      } catch {
        const errorMsg = 'Failed to fetch team data';
        handleTeamError(teamId, errorMsg);
        return { error: errorMsg };
      }
    },
    [handleTeamSuccess, handleTeamError, setTeamCache],
  );

  return { fetchTeamData };
};

const useLeagueApiFetching = (
  leagueCache: Map<number, SteamLeague>,
  setLeagueCache: React.Dispatch<React.SetStateAction<Map<number, SteamLeague>>>,
  setLeagueErrors: React.Dispatch<React.SetStateAction<Map<number, string>>>,
) => {
  const leagueCacheRef = useRef<Map<number, SteamLeague>>(new Map());
  leagueCacheRef.current = leagueCache;
  const inFlightRef = useRef<InFlightMap<number, SteamLeague>>(new Map());

  const handleLeagueError = useCallback(
    (leagueId: number, errorMsg: string) => {
      setLeagueErrors((prev) => new Map(prev).set(leagueId, errorMsg));
    },
    [setLeagueErrors],
  );

  const handleLeagueSuccess = useCallback(
    (leagueId: number, league: SteamLeague) => {
      setLeagueCache((prevCache) => new Map(prevCache).set(leagueId, league));
      setLeagueErrors((prev) => {
        const newErrors = new Map(prev);
        newErrors.delete(leagueId);
        return newErrors;
      });
    },
    [setLeagueCache, setLeagueErrors],
  );

  const fetchLeagueData = useCallback(
    async (leagueId: number, force = false): Promise<SteamLeague | { error: string }> => {
      try {
        const result = await fetchWithMemoryAndStorage<number, SteamLeague>({
          id: leagueId,
          force,
          inMemoryMap: leagueCacheRef.current,
          setInMemory: (updater) => setLeagueCache((prev) => updater(prev)),
          inFlight: inFlightRef.current,
          getPersisted: (id) =>
            getCacheItem<SteamLeague>(getCacheKey(`league:${id}`, CACHE_VERSION), {
              version: CACHE_VERSION,
              ttlMs: CacheTtl.teams,
            }),
          setPersisted: (id, value) =>
            setCacheItem(getCacheKey(`league:${id}`, CACHE_VERSION), value, {
              version: CACHE_VERSION,
              ttlMs: CacheTtl.teams,
            }),
          loader: async (id, f) => {
            const league = await getLeague(id, f);
            handleLeagueSuccess(id, league);
            return league;
          },
        });
        return result;
      } catch {
        const errorMsg = 'Failed to fetch league data';
        handleLeagueError(leagueId, errorMsg);
        return { error: errorMsg };
      }
    },
    [handleLeagueSuccess, handleLeagueError, setLeagueCache],
  );

  type SteamMatchSlim = { match_id?: number; radiant_team_id?: number; dire_team_id?: number };

  const findTeamMatchesInLeague = useCallback(
    (leagueId: number, teamId: number): Array<{ matchId: number; side: 'radiant' | 'dire' | null }> => {
      // Try in-memory cache first
      let league = leagueCacheRef.current.get(leagueId);
      // If not in memory yet (setState not flushed), fall back to persisted cache
      if (!league) {
        const key = getCacheKey(`league:${leagueId}`, CACHE_VERSION);
        const persisted = getCacheItem<SteamLeague>(key, { version: CACHE_VERSION, ttlMs: CacheTtl.teams });
        if (persisted) {
          league = persisted;
        }
      }
      const matches = league?.steam?.result?.matches || [];
      const results: Array<{ matchId: number; side: 'radiant' | 'dire' | null }> = [];
      matches.forEach((m: SteamMatchSlim) => {
        if (!m || typeof m.match_id !== 'number') return;
        const isRadiant = m.radiant_team_id === teamId;
        const isDire = m.dire_team_id === teamId;
        if (isRadiant || isDire) {
          results.push({ matchId: m.match_id, side: isRadiant ? 'radiant' : 'dire' });
        }
      });
      return results;
    },
    [],
  );

  return { fetchLeagueData, findTeamMatchesInLeague };
};

// ============================================================================
// COMBINED API FETCHING
// ============================================================================

const useApiFetching = (
  teamCache: Map<number, SteamTeam>,
  leagueCache: Map<number, SteamLeague>,
  setTeamCache: React.Dispatch<React.SetStateAction<Map<number, SteamTeam>>>,
  setLeagueCache: React.Dispatch<React.SetStateAction<Map<number, SteamLeague>>>,
  setTeamErrors: React.Dispatch<React.SetStateAction<Map<number, string>>>,
  setLeagueErrors: React.Dispatch<React.SetStateAction<Map<number, string>>>,
) => {
  const { fetchTeamData } = useTeamApiFetching(teamCache, setTeamCache, setTeamErrors);
  const { fetchLeagueData, findTeamMatchesInLeague } = useLeagueApiFetching(
    leagueCache,
    setLeagueCache,
    setLeagueErrors,
  );
  return { fetchTeamData, fetchLeagueData, findTeamMatchesInLeague };
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
    setLeagueErrors,
  } = useTeamDataState();

  const { clearTeamCache, clearLeagueCache, clearAllCache, isTeamCached, isLeagueCached } = useCacheManagement(
    teamCache,
    leagueCache,
    setTeamCache,
    setLeagueCache,
  );

  const { clearTeamError, clearLeagueError, clearAllErrors, getTeamError, getLeagueError } = useErrorManagement(
    teamErrors,
    leagueErrors,
    setTeamErrors,
    setLeagueErrors,
  );

  const { fetchTeamData, fetchLeagueData, findTeamMatchesInLeague } = useApiFetching(
    teamCache,
    leagueCache,
    setTeamCache,
    setLeagueCache,
    setTeamErrors,
    setLeagueErrors,
  );

  const contextValue: TeamDataFetchingContextValue = {
    fetchTeamData,
    fetchLeagueData,
    findTeamMatchesInLeague,
    clearTeamCache,
    clearLeagueCache,
    clearAllCache,
    clearTeamError,
    clearLeagueError,
    clearAllErrors,
    isTeamCached,
    isLeagueCached,
    getTeamError,
    getLeagueError,
  };

  return <TeamDataFetchingContext.Provider value={contextValue}>{children}</TeamDataFetchingContext.Provider>;
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
