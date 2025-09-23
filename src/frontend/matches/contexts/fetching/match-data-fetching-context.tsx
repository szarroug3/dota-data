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
import { fetchWithMemoryAndStorage, type InFlightMap } from '@/frontend/lib/fetch-cache';
import { getMatch } from '@/frontend/matches/api/matches';
import type { OpenDotaMatch } from '@/types/external-apis';

export interface MatchDataFetchingContextValue {
  fetchMatchData: (matchId: number, force?: boolean) => Promise<OpenDotaMatch | { error: string }>;
  clearMatchCache: (matchId?: number) => void;
  clearAllCache: () => void;
  isMatchCached: (matchId: number) => boolean;
}

interface MatchDataFetchingProviderProps {
  children: React.ReactNode;
}

const MatchDataFetchingContext = createContext<MatchDataFetchingContextValue | undefined>(undefined);

const useMatchDataState = () => {
  const [matchCache, setMatchCache] = useState<Map<number, OpenDotaMatch>>(new Map());
  return { matchCache, setMatchCache };
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

const useMatchApiFetching = (
  matchCache: Map<number, OpenDotaMatch>,
  setMatchCache: React.Dispatch<React.SetStateAction<Map<number, OpenDotaMatch>>>,
) => {
  const matchCacheRef = useRef<Map<number, OpenDotaMatch>>(new Map());
  matchCacheRef.current = matchCache;
  const inFlightRef = useRef<InFlightMap<number, OpenDotaMatch>>(new Map());

  const handleMatchSuccess = useCallback(
    (matchId: number, match: OpenDotaMatch) => {
      setMatchCache((prevCache) => new Map(prevCache).set(matchId, match));
    },
    [setMatchCache],
  );

  const fetchMatchData = useCallback(
    async (matchId: number, force = false): Promise<OpenDotaMatch | { error: string }> => {
      try {
        const result = await fetchWithMemoryAndStorage<number, OpenDotaMatch>({
          id: matchId,
          force,
          inMemoryMap: matchCacheRef.current,
          setInMemory: (updater) => setMatchCache((prev) => updater(prev)),
          inFlight: inFlightRef.current,
          getPersisted: (id) =>
            getCacheItem<OpenDotaMatch>(getCacheKey(`match:${id}`, CACHE_VERSION), {
              version: CACHE_VERSION,
              ttlMs: CacheTtl.matches,
            }),
          setPersisted: (id, value) =>
            setCacheItem(getCacheKey(`match:${id}`, CACHE_VERSION), value, {
              version: CACHE_VERSION,
              ttlMs: CacheTtl.matches,
            }),
          loader: async (id, f) => {
            const m = await getMatch(id, f);
            handleMatchSuccess(id, m);
            return m;
          },
        });
        return result;
      } catch (error) {
        console.error('Failed to fetch match data', error);
        const errorMsg = 'Failed to fetch match data';
        return { error: errorMsg };
      }
    },
    [setMatchCache, handleMatchSuccess],
  );

  return { fetchMatchData };
};

export const MatchDataFetchingProvider: React.FC<MatchDataFetchingProviderProps> = ({ children }) => {
  const { matchCache, setMatchCache } = useMatchDataState();
  const { clearMatchCache, clearAllCache, isMatchCached } = useCacheManagement(matchCache, setMatchCache);
  const { fetchMatchData } = useMatchApiFetching(matchCache, setMatchCache);

  const contextValue: MatchDataFetchingContextValue = {
    fetchMatchData,
    clearMatchCache,
    clearAllCache,
    isMatchCached,
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
