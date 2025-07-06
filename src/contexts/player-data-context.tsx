import { fetchPlayerData, fetchPlayerHeroes, fetchPlayerMatches, fetchPlayerTotals, fetchPlayerWL } from '@/lib/fetch-data';
import * as React from 'react';
import { createContext, useCallback, useContext, useState } from 'react';
import { PlayerStats } from '../lib/types/data-service';
import { PlayerDataContextType } from '../types/contexts';

// ============================================================================
// CONTEXT
// ============================================================================

const PlayerDataContext = createContext<PlayerDataContextType | null>(null);

export function PlayerDataProvider({ children }: { children: React.ReactNode }) {
  const [playerDataByPlayer, setPlayerDataByPlayer] = useState<Record<string, PlayerStats>>({});
  const [loadingByPlayer, setLoadingByPlayer] = useState<Record<string, boolean>>({});
  const [errorByPlayer, setErrorByPlayer] = useState<Record<string, string | null>>({});

  const fetchPlayerDataWithDetails = useCallback(async (playerId: string, _playerName: string, _role: string): Promise<void> => {
    // Don't fetch if already loading
    if (loadingByPlayer[playerId]) {
      return;
    }

    // Set loading state
    setLoadingByPlayer((prev: Record<string, boolean>) => ({ ...prev, [playerId]: true }));
    setErrorByPlayer((prev: Record<string, string | null>) => ({ ...prev, [playerId]: null }));

    try {
      // Fetch player data using the new standardized API
      const playerData = await fetchPlayerData(playerId);
      
      setPlayerDataByPlayer((prev: Record<string, PlayerStats>) => ({ ...prev, [playerId]: playerData }));
      setLoadingByPlayer((prev: Record<string, boolean>) => ({ ...prev, [playerId]: false }));

      // Start background fetching of additional player data
      Promise.allSettled([
        fetchPlayerMatches(playerId),
        fetchPlayerHeroes(playerId),
        fetchPlayerTotals(playerId),
        fetchPlayerWL(playerId)
      ]).then((results) => {
        // Update player data with additional details as they come in
        const updatedData = { ...playerData };
        
        results.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            const data = result.value;
            switch (index) {
              case 0: // matches
                updatedData.recentMatches = data;
                break;
              case 1: // heroes
                updatedData.heroes = data;
                break;
              case 2: // totals
                updatedData.totals = data;
                break;
              case 3: // wl
                updatedData.winLoss = data;
                break;
            }
          }
        });

        setPlayerDataByPlayer((prev: Record<string, PlayerStats>) => ({ 
          ...prev, 
          [playerId]: updatedData 
        }));
      });

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
    return playerDataByPlayer[playerId] || null;
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
    fetchPlayerData: fetchPlayerDataWithDetails,
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