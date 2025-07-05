import { usePlayerData } from '@/contexts/player-data-context';
import { PlayerStats } from '@/lib/types/data-service';
import { useCallback, useEffect, useState } from 'react';

export function usePlayerStats(playerId: string | null, playerName: string, role: string) {
  const { 
    getPlayerData, 
    fetchPlayerData, 
    isPlayerLoading, 
    getPlayerError,
    updatePlayerData 
  } = usePlayerData();

  const [shouldFetch, setShouldFetch] = useState(false);

  // Get player data
  const playerData = playerId ? getPlayerData(playerId) : null;
  const loading = playerId ? isPlayerLoading(playerId) : false;
  const error = playerId ? getPlayerError(playerId) : null;

  // Trigger fetch when playerId changes or when we need to fetch
  useEffect(() => {
    if (playerId && playerName && role && !playerData && !loading && shouldFetch) {
      fetchPlayerData(playerId, playerName, role);
      setShouldFetch(false);
    }
  }, [playerId, playerName, role, playerData, loading, shouldFetch, fetchPlayerData]);

  // Function to trigger fetch
  const triggerFetch = useCallback(() => {
    if (playerId && playerName && role) {
      setShouldFetch(true);
    }
  }, [playerId, playerName, role]);

  // Update player data
  const updatePlayerDataCallback = useCallback((data: PlayerStats) => {
    if (playerId) {
      updatePlayerData(playerId, data);
    }
  }, [playerId, updatePlayerData]);

  return {
    data: playerData,
    loading,
    error,
    refetch: triggerFetch,
    updateData: updatePlayerDataCallback,
  };
} 