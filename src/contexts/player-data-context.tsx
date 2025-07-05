import { PlayerStats } from '@/lib/types/data-service';
import React, { createContext, useCallback, useContext, useState } from 'react';

interface PlayerDataContextType {
  // Cached player data by player ID
  playerDataByPlayer: Record<string, PlayerStats>;
  // Loading states by player ID
  loadingByPlayer: Record<string, boolean>;
  // Error states by player ID
  errorByPlayer: Record<string, string | null>;
  // Trigger fetching for a specific player
  fetchPlayerData: (playerId: string, playerName: string, role: string) => void;
  // Get player data for a player (from cache or trigger fetch)
  getPlayerData: (playerId: string) => PlayerStats | null;
  // Check if player data is loading
  isPlayerLoading: (playerId: string) => boolean;
  // Get error for a player
  getPlayerError: (playerId: string) => string | null;
  // Update player data in cache
  updatePlayerData: (playerId: string, playerData: PlayerStats) => void;
  // Remove player data from cache
  removePlayerData: (playerId: string) => void;
}

const PlayerDataContext = createContext<PlayerDataContextType | null>(null);

// Helper function to fetch player data
async function _fetchPlayerData(playerId: string, playerName: string, role: string): Promise<PlayerStats> {
  const response = await fetch(`/api/players/${playerId}/stats?name=${encodeURIComponent(playerName)}&role=${encodeURIComponent(role)}`);
  if (response.status === 200) {
    return await response.json();
  }
  throw new Error(`HTTP ${response.status} for player ${playerId}`);
}

export function usePlayerData() {
  const context = useContext(PlayerDataContext);
  if (!context) {
    throw new Error('usePlayerData must be used within a PlayerDataProvider');
  }
  return context;
}

export function PlayerDataProvider({ children }: { children: React.ReactNode }) {
  const [playerDataByPlayer, setPlayerDataByPlayer] = useState<Record<string, PlayerStats>>({});
  const [loadingByPlayer, setLoadingByPlayer] = useState<Record<string, boolean>>({});
  const [errorByPlayer, setErrorByPlayer] = useState<Record<string, string | null>>({});

  const fetchPlayerData = useCallback(async (playerId: string, playerName: string, role: string) => {
    // Don't fetch if already loading
    if (loadingByPlayer[playerId]) {
      return;
    }

    // Set loading state
    setLoadingByPlayer(prev => ({ ...prev, [playerId]: true }));
    setErrorByPlayer(prev => ({ ...prev, [playerId]: null }));

    try {
      const playerData = await _fetchPlayerData(playerId, playerName, role);
      
      setPlayerDataByPlayer(prev => ({ ...prev, [playerId]: playerData }));
      setLoadingByPlayer(prev => ({ ...prev, [playerId]: false }));
    } catch (err) {
      console.error(`[PlayerDataContext] Error fetching player data for player ${playerId}:`, err);
      setErrorByPlayer(prev => ({ 
        ...prev, 
        [playerId]: err instanceof Error ? err.message : 'Failed to fetch player data' 
      }));
      setLoadingByPlayer(prev => ({ ...prev, [playerId]: false }));
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

  const updatePlayerData = useCallback((playerId: string, playerData: PlayerStats) => {
    setPlayerDataByPlayer(prev => ({ ...prev, [playerId]: playerData }));
  }, []);

  const removePlayerData = useCallback((playerId: string) => {
    setPlayerDataByPlayer(prev => {
      const newData = { ...prev };
      delete newData[playerId];
      return newData;
    });
    setLoadingByPlayer(prev => {
      const newLoading = { ...prev };
      delete newLoading[playerId];
      return newLoading;
    });
    setErrorByPlayer(prev => {
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