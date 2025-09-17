'use client';

/**
 * Match Data Fetching Context (Frontend - Matches Fetching Context)
 */

import React, { createContext, useCallback, useContext, useRef, useState } from 'react';

import {
  CACHE_VERSION,
  CacheTtl,
  clearCacheByPrefix,
  clearCacheItem,
  getCacheItem,
  getCacheKey,
  setCacheItem,
} from '@/frontend/lib/cache';
import { getMatch } from '@/frontend/matches/api/matches';
import type { OpenDotaMatch } from '@/types/external-apis';

export interface MatchDataFetchingContextValue {
  fetchMatchData: (matchId: number, force?: boolean) => Promise<OpenDotaMatch | { error: string }>;
  clearMatchCache: (matchId?: number) => void;
  clearAllCache: () => void;
  clearMatchError: (matchId: number) => void;
  clearAllErrors: () => void;
  isMatchCached: (matchId: number) => boolean;
  getMatchError: (matchId: number) => string | null;
}

interface MatchDataFetchingProviderProps {
  children: React.ReactNode;
}

const MatchDataFetchingContext = createContext<MatchDataFetchingContextValue | undefined>(undefined);

const useMatchDataState = () => {
  const [matchCache, setMatchCache] = useState<Map<number, OpenDotaMatch>>(new Map());
  const [matchErrors, setMatchErrors] = useState<Map<number, string>>(new Map());
  return { matchCache, setMatchCache, matchErrors, setMatchErrors };
};

const useCacheManagement = (
  matchCache: Map<number, OpenDotaMatch>,
  setMatchCache: React.Dispatch<React.SetStateAction<Map<number, OpenDotaMatch>>>,
) => {
  const clearMatchCache = useCallback(
    (matchId?: number) => {
      if (matchId) {
        setMatchCache((prev) => {
          const newCache = new Map(prev);
          newCache.delete(matchId);
          return newCache;
        });
        const key = getCacheKey(`match:${matchId}`, CACHE_VERSION);
        clearCacheItem(key);
      } else {
        setMatchCache(new Map());
        clearCacheByPrefix(`match:`);
      }
    },
    [setMatchCache],
  );

  const clearAllCache = useCallback(() => {
    setMatchCache(new Map());
  }, [setMatchCache]);

  const isMatchCached = useCallback((matchId: number) => matchCache.has(matchId), [matchCache]);

  return { clearMatchCache, clearAllCache, isMatchCached };
};

const useErrorManagement = (
  matchErrors: Map<number, string>,
  setMatchErrors: React.Dispatch<React.SetStateAction<Map<number, string>>>,
) => {
  const clearMatchError = useCallback(
    (matchId: number) => {
      setMatchErrors((prev) => {
        const newErrors = new Map(prev);
        newErrors.delete(matchId);
        return newErrors;
      });
    },
    [setMatchErrors],
  );

  const clearAllErrors = useCallback(() => {
    setMatchErrors(new Map());
  }, [setMatchErrors]);

  const getMatchError = useCallback((matchId: number) => matchErrors.get(matchId) || null, [matchErrors]);

  return { clearMatchError, clearAllErrors, getMatchError };
};

const useMatchApiFetching = (
  matchCache: Map<number, OpenDotaMatch>,
  setMatchCache: React.Dispatch<React.SetStateAction<Map<number, OpenDotaMatch>>>,
  setMatchErrors: React.Dispatch<React.SetStateAction<Map<number, string>>>,
) => {
  const matchCacheRef = useRef<Map<number, OpenDotaMatch>>(new Map());
  matchCacheRef.current = matchCache;

  const handleMatchError = useCallback(
    (matchId: number, errorMsg: string) => {
      setMatchErrors((prev) => new Map(prev).set(matchId, errorMsg));
    },
    [setMatchErrors],
  );

  const handleMatchSuccess = useCallback(
    (matchId: number, match: OpenDotaMatch) => {
      setMatchCache((prevCache) => new Map(prevCache).set(matchId, match));
      setMatchErrors((prev) => {
        const newErrors = new Map(prev);
        newErrors.delete(matchId);
        return newErrors;
      });
    },
    [setMatchCache, setMatchErrors],
  );

  const fetchMatchData = useCallback(
    async (matchId: number, force = false): Promise<OpenDotaMatch | { error: string }> => {
      if (!force && matchCacheRef.current.has(matchId)) {
        const cachedMatch = matchCacheRef.current.get(matchId);
        if (cachedMatch) return cachedMatch;
      }
      if (!force) {
        const key = getCacheKey(`match:${matchId}`, CACHE_VERSION);
        const persisted = getCacheItem<OpenDotaMatch>(key, { version: CACHE_VERSION, ttlMs: CacheTtl.matches });
        if (persisted) {
          setMatchCache((prev) => new Map(prev).set(matchId, persisted));
          return persisted;
        }
      }
      try {
        const match = await getMatch(matchId, force);
        handleMatchSuccess(matchId, match);
        const key = getCacheKey(`match:${matchId}`, CACHE_VERSION);
        setCacheItem(key, match, { version: CACHE_VERSION, ttlMs: CacheTtl.matches });
        return match;
      } catch (error) {
        console.error('Failed to fetch match data', error);
        const errorMsg = 'Failed to fetch match data';
        handleMatchError(matchId, errorMsg);
        return { error: errorMsg };
      }
    },
    [setMatchCache, handleMatchSuccess, handleMatchError],
  );

  return { fetchMatchData };
};

export const MatchDataFetchingProvider: React.FC<MatchDataFetchingProviderProps> = ({ children }) => {
  const { matchCache, setMatchCache, matchErrors, setMatchErrors } = useMatchDataState();
  const { clearMatchCache, clearAllCache, isMatchCached } = useCacheManagement(matchCache, setMatchCache);
  const { clearMatchError, clearAllErrors, getMatchError } = useErrorManagement(matchErrors, setMatchErrors);
  const { fetchMatchData } = useMatchApiFetching(matchCache, setMatchCache, setMatchErrors);

  const contextValue: MatchDataFetchingContextValue = {
    fetchMatchData,
    clearMatchCache,
    clearAllCache,
    clearMatchError,
    clearAllErrors,
    isMatchCached,
    getMatchError,
  };

  return <MatchDataFetchingContext.Provider value={contextValue}>{children}</MatchDataFetchingContext.Provider>;
};

export const useMatchDataFetching = (): MatchDataFetchingContextValue => {
  const context = useContext(MatchDataFetchingContext);
  if (context === undefined) {
    throw new Error('useMatchDataFetching must be used within a MatchDataFetchingProvider');
  }
  return context;
};
