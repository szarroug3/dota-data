/**
 * Player Data Fetching Context
 * 
 * Responsible for fetching player data from APIs and external sources.
 * Provides raw API responses to the player data management context.
 * Separates data fetching concerns from data management.
 */

import React, { createContext, useCallback, useContext, useState } from 'react';

import type { ApiErrorResponse } from '@/types/api';
import type { OpenDotaPlayerComprehensive } from '@/types/external-apis';

// ============================================================================
// TYPES
// ============================================================================

interface PlayerDataFetchingContextValue {
  // Core data fetching (handles cache logic internally)
  fetchPlayerData: (playerId: string, force?: boolean) => Promise<OpenDotaPlayerComprehensive | { error: string }>;
  
  // Cache management (for explicit control)
  clearPlayerCache: (playerId?: string) => void;
  clearAllCache: () => void;
  
  // Error management
  clearPlayerError: (playerId: string) => void;
  clearAllErrors: () => void;
  
  // Status queries (for debugging/monitoring)
  isPlayerCached: (playerId: string) => boolean;
  getPlayerError: (playerId: string) => string | null;
}

interface PlayerDataFetchingProviderProps {
  children: React.ReactNode;
}

// ============================================================================
// CONTEXT CREATION
// ============================================================================

const PlayerDataFetchingContext = createContext<PlayerDataFetchingContextValue | undefined>(undefined);

// ============================================================================
// CUSTOM HOOKS
// ============================================================================

const usePlayerDataState = () => {
  const [playerCache, setPlayerCache] = useState<Map<string, OpenDotaPlayerComprehensive>>(new Map());
  const [playerErrors, setPlayerErrors] = useState<Map<string, string>>(new Map());

  return {
    playerCache,
    setPlayerCache,
    playerErrors,
    setPlayerErrors
  };
};

const useCacheManagement = (
  playerCache: Map<string, OpenDotaPlayerComprehensive>,
  setPlayerCache: React.Dispatch<React.SetStateAction<Map<string, OpenDotaPlayerComprehensive>>>
) => {
  const clearPlayerCache = useCallback((playerId?: string) => {
    if (playerId) {
      setPlayerCache(prev => {
        const newCache = new Map(prev);
        newCache.delete(playerId);
        return newCache;
      });
    } else {
      setPlayerCache(new Map());
    }
  }, [setPlayerCache]);

  const clearAllCache = useCallback(() => {
    setPlayerCache(new Map());
  }, [setPlayerCache]);

  const isPlayerCached = useCallback((playerId: string) => {
    return playerCache.has(playerId);
  }, [playerCache]);

  return {
    clearPlayerCache,
    clearAllCache,
    isPlayerCached
  };
};

const useErrorManagement = (
  playerErrors: Map<string, string>,
  setPlayerErrors: React.Dispatch<React.SetStateAction<Map<string, string>>>
) => {
  const clearPlayerError = useCallback((playerId: string) => {
    setPlayerErrors(prev => {
      const newErrors = new Map(prev);
      newErrors.delete(playerId);
      return newErrors;
    });
  }, [setPlayerErrors]);

  const clearAllErrors = useCallback(() => {
    setPlayerErrors(new Map());
  }, [setPlayerErrors]);

  const getPlayerError = useCallback((playerId: string) => {
    return playerErrors.get(playerId) || null;
  }, [playerErrors]);

  return {
    clearPlayerError,
    clearAllErrors,
    getPlayerError
  };
};

const usePlayerApiFetching = (
  playerCache: Map<string, OpenDotaPlayerComprehensive>,
  setPlayerCache: React.Dispatch<React.SetStateAction<Map<string, OpenDotaPlayerComprehensive>>>,
  setPlayerErrors: React.Dispatch<React.SetStateAction<Map<string, string>>>
) => {
  const handlePlayerError = useCallback((playerId: string, errorMsg: string) => {
    setPlayerErrors(prev => new Map(prev).set(playerId, errorMsg));
  }, [setPlayerErrors]);

  const handlePlayerSuccess = useCallback((playerId: string, player: OpenDotaPlayerComprehensive) => {
    setPlayerCache(prevCache => new Map(prevCache).set(playerId, player));
    setPlayerErrors(prev => {
      const newErrors = new Map(prev);
      newErrors.delete(playerId);
      return newErrors;
    });
  }, [setPlayerCache, setPlayerErrors]);

  const processPlayerResponse = useCallback(async (response: Response, playerId: string): Promise<OpenDotaPlayerComprehensive | { error: string }> => {
    if (!response.ok) {
      let errorMsg = 'Failed to fetch player data';
      
      try {
        const errorData = await response.json() as ApiErrorResponse;
        errorMsg = errorData.error || errorMsg;
      } catch {
        errorMsg = response.statusText || errorMsg;
      }
      
      handlePlayerError(playerId, errorMsg);
      return { error: errorMsg };
    }

    const player = await response.json() as OpenDotaPlayerComprehensive;
    console.log('Player data fetched:', player);
    handlePlayerSuccess(playerId, player);
    return player;
  }, [handlePlayerError, handlePlayerSuccess]);

  const fetchPlayerData = useCallback(async (playerId: string, force = false): Promise<OpenDotaPlayerComprehensive | { error: string }> => {
    // Check cache first (unless force=true)
    if (!force && playerCache.has(playerId)) {
      const cachedPlayer = playerCache.get(playerId);
      if (cachedPlayer) {
        console.log('Returning cached player data for:', playerId);
        return cachedPlayer;
      }
    }

    try {
      console.log('Fetching player data from API:', playerId);
      const url = force ? `/api/players/${playerId}?force=true` : `/api/players/${playerId}`;
      const response = await fetch(url);
      return await processPlayerResponse(response, playerId);
    } catch (error) {
      const errorMsg = 'Failed to fetch player data';
      console.error('Error fetching player data:', error);
      handlePlayerError(playerId, errorMsg);
      return { error: errorMsg };
    }
  }, [playerCache, processPlayerResponse, handlePlayerError]);

  return { fetchPlayerData };
};

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

export const PlayerDataFetchingProvider: React.FC<PlayerDataFetchingProviderProps> = ({ children }) => {
  const {
    playerCache,
    setPlayerCache,
    playerErrors,
    setPlayerErrors
  } = usePlayerDataState();

  const {
    clearPlayerCache,
    clearAllCache,
    isPlayerCached
  } = useCacheManagement(playerCache, setPlayerCache);

  const {
    clearPlayerError,
    clearAllErrors,
    getPlayerError
  } = useErrorManagement(playerErrors, setPlayerErrors);

  const {
    fetchPlayerData
  } = usePlayerApiFetching(playerCache, setPlayerCache, setPlayerErrors);

  const contextValue: PlayerDataFetchingContextValue = {
    // Core data fetching
    fetchPlayerData,
    
    // Cache management
    clearPlayerCache,
    clearAllCache,
    
    // Error management
    clearPlayerError,
    clearAllErrors,
    
    // Status queries
    isPlayerCached,
    getPlayerError
  };

  return (
    <PlayerDataFetchingContext.Provider value={contextValue}>
      {children}
    </PlayerDataFetchingContext.Provider>
  );
};

// ============================================================================
// CUSTOM HOOK
// ============================================================================

export const usePlayerDataFetching = (): PlayerDataFetchingContextValue => {
  const context = useContext(PlayerDataFetchingContext);
  
  if (context === undefined) {
    throw new Error('usePlayerDataFetching must be used within a PlayerDataFetchingProvider');
  }
  
  return context;
}; 