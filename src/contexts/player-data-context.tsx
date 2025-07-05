import * as React from 'react';
import { PlayerStats } from '../lib/types/data-service';
import { createContext, useCallback, useContext, useState } from 'react';
import { 
  PlayerDataContextType
} from '../types/contexts';

// ============================================================================
// API HELPERS
// ============================================================================

async function fetchPlayerDataHelper(playerId: string, playerName: string, role: string): Promise<PlayerStats> {
  const response = await fetch(`/api/players/${playerId}/stats`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ force: false }),
  });
  if (response.status === 200) {
    return await response.json() as Promise<PlayerStats>;
  }
  throw new Error(`HTTP ${response.status} for player ${playerId}`);
}

// ============================================================================
// CONTEXT
// ============================================================================

const PlayerDataContext = createContext<PlayerDataContextType | null>(null);

export function PlayerDataProvider({ children }: { children: React.ReactNode }) {
  const [playerDataByPlayer, setPlayerDataByPlayer] = useState<Record<string, PlayerStats>>({});
  const [loadingByPlayer, setLoadingByPlayer] = useState<Record<string, boolean>>({});
  const [errorByPlayer, setErrorByPlayer] = useState<Record<string, string | null>>({});

  const fetchPlayerData = useCallback(async (playerId: string, playerName: string, role: string): Promise<void> => {
    // Don't fetch if already loading
    if (loadingByPlayer[playerId]) {
      return;
    }

    // Set loading state
    setLoadingByPlayer((prev: Record<string, boolean>) => ({ ...prev, [playerId]: true }));
    setErrorByPlayer((prev: Record<string, string | null>) => ({ ...prev, [playerId]: null }));

    try {
      const playerData = await fetchPlayerDataHelper(playerId, playerName, role);
      
      setPlayerDataByPlayer((prev: Record<string, PlayerStats>) => ({ ...prev, [playerId]: playerData }));
      setLoadingByPlayer((prev: Record<string, boolean>) => ({ ...prev, [playerId]: false }));
    } catch (err) {
      console.error(`[PlayerDataContext] Error fetching player data for player ${playerId}:`, err);
      setErrorByPlayer((prev: Record<string, string | null>) => ({ 
        ...prev, 
        [playerId]: err instanceof Error ? err.message : 'Failed to fetch player data' 
      }));
      setLoadingByPlayer((prev: Record<string, boolean>) => ({ ...prev, [playerId]: false }));
    }
  }, [loadingByPlayer]);

  const getPlayerData = useCallback((playerId: string): PlayerStats | null => {
    // Return cached data if available
    if (playerDataByPlayer[playerId]) {
      return playerDataByPlayer[playerId];
    }

    // Don't auto-trigger fetch for player data since we need playerName and role
    return null;
  }, [playerDataByPlayer]);

  const isPlayerLoading = useCallback((playerId: string): boolean => {
    return loadingByPlayer[playerId] || false;
  }, [loadingByPlayer]);

  const getPlayerError = useCallback((playerId: string): string | null => {
    return errorByPlayer[playerId] || null;
  }, [errorByPlayer]);

  const updatePlayerData = useCallback((playerId: string, playerData: PlayerStats): void => {
    setPlayerDataByPlayer((prev: Record<string, PlayerStats>) => ({ ...prev, [playerId]: playerData }));
  }, []);

  const removePlayerData = useCallback((playerId: string): void => {
    setPlayerDataByPlayer((prev: Record<string, PlayerStats>) => {
      const newData = { ...prev };
      delete newData[playerId];
      return newData;
    });
    setLoadingByPlayer((prev: Record<string, boolean>) => {
      const newLoading = { ...prev };
      delete newLoading[playerId];
      return newLoading;
    });
    setErrorByPlayer((prev: Record<string, string | null>) => {
      const newError = { ...prev };
      delete newError[playerId];
      return newError;
    });
  }, []);

  const value: PlayerDataContextType = {
    playerDataByPlayer,
    loadingByPlayer,
    errorByPlayer,
    fetchPlayerData,
    getPlayerData,
    isPlayerLoading,
    getPlayerError,
    updatePlayerData,
    removePlayerData,
  };

  return (
    <PlayerDataContext.Provider value={value}>
      {children}
    </PlayerDataContext.Provider>
  );
}

export function usePlayerData() {
  const context = useContext(PlayerDataContext);
  if (!context) {
    throw new Error('usePlayerData must be used within a PlayerDataProvider');
  }
  return context;
} 