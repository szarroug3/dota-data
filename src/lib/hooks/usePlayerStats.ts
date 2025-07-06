import { usePlayerData } from '@/contexts/player-data-context';
import { PlayerStats } from '@/lib/types/data-service';
import { useCallback, useEffect } from 'react';

export function usePlayerStats(playerId: string | null, playerName: string, role: string) {
  const { 
    getPlayerData, 
    fetchPlayerData, 
    isPlayerLoading, 
    getPlayerError,
    updatePlayerData 
  } = usePlayerData();

  // Get player data
  const playerData = playerId ? getPlayerData(playerId) : null;
  const loading = playerId ? isPlayerLoading(playerId) : false;
  const error = playerId ? getPlayerError(playerId) : null;

  // Trigger fetch when playerId changes
  useEffect(() => {
    if (playerId && playerName && role && !playerData && !loading) {
      fetchPlayerData(playerId, playerName, role);
    }
  }, [playerId, playerName, role, playerData, loading, fetchPlayerData]);

  // Function to trigger refetch
  const refetch = useCallback(() => {
    if (playerId && playerName && role) {
      fetchPlayerData(playerId, playerName, role);
    }
  }, [playerId, playerName, role, fetchPlayerData]);

  // Update player data
  const updateData = useCallback((data: PlayerStats) => {
    if (playerId) {
      updatePlayerData(playerId, data);
    }
  }, [playerId, updatePlayerData]);

  return {
    data: playerData,
    loading,
    error,
    refetch,
    updateData,
  };
} 