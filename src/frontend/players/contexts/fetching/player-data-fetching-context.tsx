'use client';

/**
 * Player Data Fetching Context (Frontend - Players Fetching Context)
 */

import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

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
import { getPlayer } from '@/frontend/players/api/players';
import type { OpenDotaPlayerComprehensive } from '@/types/external-apis';

export interface PlayerDataFetchingContextValue {
  fetchPlayerData: (playerId: number, force?: boolean) => Promise<OpenDotaPlayerComprehensive | { error: string }>;
  clearPlayerCache: (playerId?: number) => void;
  clearAllCache: () => void;
  clearPlayerError: (playerId: number) => void;
  clearAllErrors: () => void;
  isPlayerCached: (playerId: number) => boolean;
  getPlayerError: (playerId: number) => string | null;
}

interface PlayerDataFetchingProviderProps {
  children: React.ReactNode;
}

const PlayerDataFetchingContext = createContext<PlayerDataFetchingContextValue | undefined>(undefined);

const usePlayerDataState = () => {
  const [playerCache, setPlayerCache] = useState<Map<number, OpenDotaPlayerComprehensive>>(new Map());
  const [playerErrors, setPlayerErrors] = useState<Map<number, string>>(new Map());
  return { playerCache, setPlayerCache, playerErrors, setPlayerErrors };
};

const useCacheManagement = (
  playerCache: Map<number, OpenDotaPlayerComprehensive>,
  setPlayerCache: React.Dispatch<React.SetStateAction<Map<number, OpenDotaPlayerComprehensive>>>,
) => {
  const clearPlayerCache = useCallback(
    (playerId?: number) => {
      if (playerId) {
        setPlayerCache((prev) => {
          const newCache = new Map(prev);
          newCache.delete(playerId);
          return newCache;
        });
        const key = getCacheKey(`player:${playerId}`, CACHE_VERSION);
        clearCacheItem(key);
      } else {
        setPlayerCache(new Map());
        clearCacheByPrefix(`player:`);
      }
    },
    [setPlayerCache],
  );

  const clearAllCache = useCallback(() => {
    setPlayerCache(new Map());
  }, [setPlayerCache]);

  const isPlayerCached = useCallback((playerId: number) => playerCache.has(playerId), [playerCache]);

  return { clearPlayerCache, clearAllCache, isPlayerCached };
};

const useErrorManagement = (
  playerErrors: Map<number, string>,
  setPlayerErrors: React.Dispatch<React.SetStateAction<Map<number, string>>>,
) => {
  const clearPlayerError = useCallback(
    (playerId: number) => {
      setPlayerErrors((prev) => {
        const newErrors = new Map(prev);
        newErrors.delete(playerId);
        return newErrors;
      });
    },
    [setPlayerErrors],
  );

  const clearAllErrors = useCallback(() => {
    setPlayerErrors(new Map());
  }, [setPlayerErrors]);

  const getPlayerError = useCallback((playerId: number) => playerErrors.get(playerId) || null, [playerErrors]);

  return { clearPlayerError, clearAllErrors, getPlayerError };
};

const usePlayerApiFetching = (
  playerCache: Map<number, OpenDotaPlayerComprehensive>,
  setPlayerCache: React.Dispatch<React.SetStateAction<Map<number, OpenDotaPlayerComprehensive>>>,
  setPlayerErrors: React.Dispatch<React.SetStateAction<Map<number, string>>>,
) => {
  const cacheRef = useRef<Map<number, OpenDotaPlayerComprehensive>>(playerCache);
  cacheRef.current = playerCache;
  const inFlightRef = useRef<InFlightMap<number, OpenDotaPlayerComprehensive>>(new Map());

  const handlePlayerSuccess = useCallback(
    (playerId: number, player: OpenDotaPlayerComprehensive) => {
      setPlayerCache((prevCache) => new Map(prevCache).set(playerId, player));
      setPlayerErrors((prev) => {
        const newErrors = new Map(prev);
        newErrors.delete(playerId);
        return newErrors;
      });
    },
    [setPlayerCache, setPlayerErrors],
  );

  const fetchPlayerData = useCallback(
    async (playerId: number, force = false): Promise<OpenDotaPlayerComprehensive | { error: string }> => {
      try {
        const result = await fetchWithMemoryAndStorage<number, OpenDotaPlayerComprehensive>({
          id: playerId,
          force,
          inMemoryMap: cacheRef.current,
          setInMemory: (updater) => setPlayerCache((prev) => updater(prev)),
          inFlight: inFlightRef.current,
          getPersisted: (id) =>
            getCacheItem<OpenDotaPlayerComprehensive>(getCacheKey(`player:${id}`, CACHE_VERSION), {
              version: CACHE_VERSION,
              ttlMs: CacheTtl.players,
            }),
          setPersisted: (id, value) =>
            setCacheItem(getCacheKey(`player:${id}`, CACHE_VERSION), value, {
              version: CACHE_VERSION,
              ttlMs: CacheTtl.players,
            }),
          loader: async (id, f) => {
            const player = await getPlayer(id, f);
            handlePlayerSuccess(id, player);
            return player;
          },
        });
        return result;
      } catch {
        const errorMsg = 'Failed to fetch player data';
        setPlayerErrors((prev) => new Map(prev).set(playerId, errorMsg));
        return { error: errorMsg };
      }
    },
    [handlePlayerSuccess, setPlayerErrors, setPlayerCache],
  );

  return { fetchPlayerData };
};

export const PlayerDataFetchingProvider: React.FC<PlayerDataFetchingProviderProps> = ({ children }) => {
  const { playerCache, setPlayerCache, playerErrors, setPlayerErrors } = usePlayerDataState();
  const { clearPlayerCache, clearAllCache, isPlayerCached } = useCacheManagement(playerCache, setPlayerCache);
  const { clearPlayerError, clearAllErrors, getPlayerError } = useErrorManagement(playerErrors, setPlayerErrors);
  const { fetchPlayerData } = usePlayerApiFetching(playerCache, setPlayerCache, setPlayerErrors);

  const contextValue: PlayerDataFetchingContextValue = useMemo(
    () => ({
      fetchPlayerData,
      clearPlayerCache,
      clearAllCache,
      clearPlayerError,
      clearAllErrors,
      isPlayerCached,
      getPlayerError,
    }),
    [
      fetchPlayerData,
      clearPlayerCache,
      clearAllCache,
      clearPlayerError,
      clearAllErrors,
      isPlayerCached,
      getPlayerError,
    ],
  );

  return <PlayerDataFetchingContext.Provider value={contextValue}>{children}</PlayerDataFetchingContext.Provider>;
};

export const usePlayerDataFetching = (): PlayerDataFetchingContextValue => {
  const context = useContext(PlayerDataFetchingContext);
  if (context === undefined) {
    throw new Error('usePlayerDataFetching must be used within a PlayerDataFetchingProvider');
  }
  return context;
};
