// ============================================================================
// usePlayerData: UI-Focused Player Data Hook
//
// Provides a high-level, UI-friendly interface for player data, actions, and state.
// Aggregates context, loading, error, and convenience actions for components.
// ============================================================================

import { useCallback } from 'react';

import type { PlayerContextValue } from '@/contexts/player-context';
import { usePlayerContext } from '@/contexts/player-context';
import type { UsePlayerDataReturn } from '@/types/hooks/use-player-data';

// ============================================================================
// Internal: Player Data Selector
// ============================================================================
function usePlayerDataSelector(context: PlayerContextValue) {
  const {
    players,
    filteredPlayers,
    selectedPlayerId,
    selectedPlayer,
    filters
  } = context;

  return {
    players,
    filteredPlayers,
    selectedPlayerId,
    selectedPlayer,
    filters
  };
}

// ============================================================================
// Internal: Player Loading & Error States
// ============================================================================
function usePlayerStates(context: PlayerContextValue) {
  return {
    isLoadingPlayers: context.isLoadingPlayers,
    isLoadingPlayerData: context.isLoadingPlayerData,
    playersError: context.playersError,
    playerDataError: context.playerDataError
  };
}

// ============================================================================
// Internal: Player Actions
// ============================================================================
function usePlayerActions(context: PlayerContextValue) {
  const {
    setSelectedPlayer,
    setFilters,
    addPlayer,
    removePlayer,
    refreshPlayer,
    clearErrors
  } = context;

  const setSelectedPlayerHandler = useCallback((playerId: string) => {
    setSelectedPlayer(playerId);
  }, [setSelectedPlayer]);

  const setFiltersHandler = useCallback((filters: Parameters<typeof setFilters>[0]) => {
    setFilters(filters);
  }, [setFilters]);

  const addPlayerHandler = useCallback(async (playerId: string) => {
    await addPlayer(playerId);
  }, [addPlayer]);

  const removePlayerHandler = useCallback(async (playerId: string) => {
    await removePlayer(playerId);
  }, [removePlayer]);

  const refreshPlayerHandler = useCallback(async (playerId: string) => {
    await refreshPlayer(playerId);
  }, [refreshPlayer]);

  const clearErrorsHandler = useCallback(() => {
    clearErrors();
  }, [clearErrors]);

  return {
    setSelectedPlayer: setSelectedPlayerHandler,
    setFilters: setFiltersHandler,
    addPlayer: addPlayerHandler,
    removePlayer: removePlayerHandler,
    refreshPlayer: refreshPlayerHandler,
    clearErrors: clearErrorsHandler
  };
}

// ============================================================================
// Exported Hook: usePlayerData
// ============================================================================

export function usePlayerData(): UsePlayerDataReturn {
  const context = usePlayerContext();
  
  // Data selectors
  const {
    players,
    filteredPlayers,
    selectedPlayerId,
    selectedPlayer,
    filters
  } = usePlayerDataSelector(context);

  // Loading and error states
  const {
    isLoadingPlayers,
    isLoadingPlayerData,
    playersError,
    playerDataError
  } = usePlayerStates(context);

  // Actions
  const {
    setSelectedPlayer,
    setFilters,
    addPlayer,
    removePlayer,
    refreshPlayer,
    clearErrors
  } = usePlayerActions(context);

  return {
    players,
    filteredPlayers,
    selectedPlayerId,
    selectedPlayer,
    filters,
    isLoadingPlayers,
    isLoadingPlayerData,
    playersError,
    playerDataError,
    setSelectedPlayer,
    setFilters,
    addPlayer,
    removePlayer,
    refreshPlayer,
    clearErrors
  };
} 