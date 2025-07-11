/**
 * Player Data Hook
 *
 * Custom hook for managing player data, selection, filtering, and actions.
 * Provides a clean interface for components to interact with player data
 * without directly accessing the context.
 */

import { useCallback, useEffect, useMemo } from 'react';

import { usePlayerContext } from '@/contexts/player-context';
import type { PlayerFilters, UsePlayerDataParams, UsePlayerDataReturn } from '@/types/hooks/use-player-data';

function usePlayerDataEffects(
  autoRefresh: boolean,
  refreshInterval: number,
  selectedPlayerId: string | null,
  playerId: string | undefined,
  forceRefresh: boolean,
  setSelectedPlayer: (id: string) => void,
  refreshPlayer: (id: string) => Promise<void>
) {
  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh || !selectedPlayerId) return;
    const interval = setInterval(() => {
      refreshPlayer(selectedPlayerId);
    }, refreshInterval * 1000);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, selectedPlayerId, refreshPlayer]);

  // Auto-select player if playerId is provided
  useEffect(() => {
    if (playerId && playerId !== selectedPlayerId) {
      setSelectedPlayer(playerId);
    }
  }, [playerId, selectedPlayerId, setSelectedPlayer]);

  // Force refresh on mount if requested
  useEffect(() => {
    if (forceRefresh && selectedPlayerId) {
      refreshPlayer(selectedPlayerId);
    }
  }, [forceRefresh, selectedPlayerId, refreshPlayer]);
}

function usePlayerDataActions(
  setSelectedPlayer: (id: string) => void,
  setFilters: (filters: PlayerFilters) => void,
  addPlayer: (id: string) => Promise<void>,
  removePlayer: (id: string) => Promise<void>,
  refreshPlayer: (id: string) => Promise<void>,
  clearErrors: () => void
) {
  const handleSetSelectedPlayer = useCallback((id: string) => {
    try {
      setSelectedPlayer(id);
    } catch (error) {
      console.error('Error setting selected player:', error);
    }
  }, [setSelectedPlayer]);

  const handleSetFilters = useCallback((newFilters: PlayerFilters) => {
    try {
      setFilters(newFilters);
    } catch (error) {
      console.error('Error setting filters:', error);
    }
  }, [setFilters]);

  const handleAddPlayer = useCallback(async (id: string) => {
    try {
      await addPlayer(id);
    } catch (error) {
      console.error('Error adding player:', error);
      throw error;
    }
  }, [addPlayer]);

  const handleRemovePlayer = useCallback(async (id: string) => {
    try {
      await removePlayer(id);
    } catch (error) {
      console.error('Error removing player:', error);
      throw error;
    }
  }, [removePlayer]);

  const handleRefreshPlayer = useCallback(async (id: string) => {
    try {
      await refreshPlayer(id);
    } catch (error) {
      console.error('Error refreshing player:', error);
      throw error;
    }
  }, [refreshPlayer]);

  const handleClearErrors = useCallback(() => {
    try {
      clearErrors();
    } catch (error) {
      console.error('Error clearing errors:', error);
    }
  }, [clearErrors]);

  return {
    handleSetSelectedPlayer,
    handleSetFilters,
    handleAddPlayer,
    handleRemovePlayer,
    handleRefreshPlayer,
    handleClearErrors
  };
}

export const usePlayerData = (params?: UsePlayerDataParams): UsePlayerDataReturn => {
  const { playerId, options = {} } = params || {};
  const {
    autoRefresh = false,
    refreshInterval = 30,
    forceRefresh = false
  } = options;

  const context = usePlayerContext();
  if (!context) {
    throw new Error('usePlayerData must be used within a PlayerProvider');
  }

  const {
    players,
    filteredPlayers,
    selectedPlayerId,
    selectedPlayer,
    playerStats,
    filters,
    isLoadingPlayers,
    isLoadingPlayerData,
    isLoadingPlayerStats,
    playersError,
    playerDataError,
    playerStatsError,
    setSelectedPlayer,
    setFilters,
    addPlayer,
    removePlayer,
    refreshPlayer,
    clearErrors
  } = context;

  usePlayerDataEffects(
    autoRefresh,
    refreshInterval,
    selectedPlayerId,
    playerId,
    forceRefresh,
    setSelectedPlayer,
    refreshPlayer
  );

  const {
    handleSetSelectedPlayer,
    handleSetFilters,
    handleAddPlayer,
    handleRemovePlayer,
    handleRefreshPlayer,
    handleClearErrors
  } = usePlayerDataActions(
    setSelectedPlayer,
    setFilters,
    addPlayer,
    removePlayer,
    refreshPlayer,
    clearErrors
  );

  return useMemo((): UsePlayerDataReturn => ({
    players,
    filteredPlayers,
    selectedPlayerId,
    selectedPlayer,
    playerStats,
    filters,
    isLoadingPlayers,
    isLoading: isLoadingPlayers, // Add alias for compatibility
    isLoadingPlayerData,
    isLoadingPlayerStats,
    playersError,
    playerDataError,
    playerStatsError,
    setSelectedPlayer: handleSetSelectedPlayer,
    setFilters: handleSetFilters,
    addPlayer: handleAddPlayer,
    removePlayer: handleRemovePlayer,
    refreshPlayer: handleRefreshPlayer,
    clearErrors: handleClearErrors
  }), [
    players,
    filteredPlayers,
    selectedPlayerId,
    selectedPlayer,
    playerStats,
    filters,
    isLoadingPlayers,
    isLoadingPlayerData,
    isLoadingPlayerStats,
    playersError,
    playerDataError,
    playerStatsError,
    handleSetSelectedPlayer,
    handleSetFilters,
    handleAddPlayer,
    handleRemovePlayer,
    handleRefreshPlayer,
    handleClearErrors
  ]);
}; 