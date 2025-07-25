import { useCallback } from 'react';

import type { PlayerDataFetchingContextValue } from '@/contexts/player-data-fetching-context';
import { abortPlayerOperations, createPlayerOperationKey, useAbortController, type AbortControllerManager } from '@/hooks/use-abort-controller';
import type { Player, PlayerProcessing, PlayerState } from '@/types/contexts/player-context-value';
import { handleOperationError, updateMapItemError } from '@/utils/error-handling';
import { createInitialPlayerData } from '@/utils/player-helpers';

// ============================================================================
// HELPER FUNCTIONS FOR PLAYER OPERATIONS
// ============================================================================

/**
 * Create and add optimistic player to state
 */
function createAndAddOptimisticPlayer(playerId: number, state: PlayerState): Player {
  const optimisticPlayer = createInitialPlayerData(playerId);
  
  state.setPlayers(prev => {
    const newPlayers = new Map(prev);
    newPlayers.set(playerId, optimisticPlayer);
    return newPlayers;
  });
  
  return optimisticPlayer;
}

/**
 * Update state with processed player data
 */
function updateStateWithProcessedPlayer(playerId: number, processedPlayer: Player, state: PlayerState): void {
  state.setPlayers(prev => {
    const newPlayers = new Map(prev);
    newPlayers.set(playerId, processedPlayer);
    return newPlayers;
  });
}

/**
 * Fetch and process player data
 */
async function fetchAndProcessPlayer(
  playerId: number,
  force: boolean,
  abortController: AbortController,
  optimisticPlayer: Player,
  playerDataFetching: PlayerDataFetchingContextValue,
  processing: PlayerProcessing,
  state: PlayerState
): Promise<Player | null> {
  // Fetch player data with force parameter
  const playerData = await playerDataFetching.fetchPlayerData(playerId, force);
  
  // Check if operation was aborted during fetch
  if (abortController.signal.aborted) {
    return optimisticPlayer;
  }
  
  if ('error' in playerData) {
    updateMapItemError(state.setPlayers, playerId, playerData.error);
    return null;
  }
  
  // Process player data
  const processedPlayer = processing.processPlayerData(playerData);
  
  // Update state with fetched data
  updateStateWithProcessedPlayer(playerId, processedPlayer, state);
  
  return processedPlayer;
}

/**
 * Handle player operation with proper error handling
 */
async function handlePlayerOperation(
  playerId: number,
  force: boolean,
  operationKey: string,
  abortController: AbortControllerManager,
  playerDataFetching: PlayerDataFetchingContextValue,
  processing: PlayerProcessing,
  state: PlayerState
): Promise<Player | null> {
  // Check if player already exists (skip if exists and not forcing)
  if (!force && state.players.has(playerId)) {
    return state.players.get(playerId) || null;
  }

  // Check if there's already an ongoing operation for this player
  if (abortController.hasOngoingOperation(operationKey)) {
    return state.players.get(playerId) || null;
  }

  // Get abort controller for this operation
  const controller = abortController.getAbortController(operationKey);

  try {
    state.setIsLoading(true);
    
    // Create optimistic player data and add to state
    const optimisticPlayer = createAndAddOptimisticPlayer(playerId, state);

    // Check if operation was aborted
    if (controller.signal.aborted) {
      return optimisticPlayer;
    }
    
    // Fetch and process player data
    return await fetchAndProcessPlayer(
      playerId,
      force,
      controller,
      optimisticPlayer,
      playerDataFetching,
      processing,
      state
    );
    
  } catch (err) {
    const errorMessage = handleOperationError(err as Error | string | object, controller, 'Failed to process player');
    if (errorMessage) {
      updateMapItemError(state.setPlayers, playerId, errorMessage);
    }
    return state.players.get(playerId) || null;
  } finally {
    state.setIsLoading(false);
    // Clean up abort controller
    abortController.cleanupAbortController(operationKey);
  }
}

// ============================================================================
// HOOKS
// ============================================================================

export function usePlayerOperations(
  state: PlayerState,
  processing: PlayerProcessing,
  playerDataFetching: PlayerDataFetchingContextValue
) {
  const abortController = useAbortController();

  // Consolidated player operation with force parameter
  const processPlayer = useCallback(async (playerId: number, force = false): Promise<Player | null> => {
    const operationKey = createPlayerOperationKey(playerId);
    return await handlePlayerOperation(playerId, force, operationKey, abortController, playerDataFetching, processing, state);
  }, [state, processing, playerDataFetching, abortController]);

  // Add player (force = false)
  const addPlayer = useCallback(async (playerId: number): Promise<Player | null> => {
    return await processPlayer(playerId, false);
  }, [processPlayer]);

  // Refresh player (force = true)
  const refreshPlayer = useCallback(async (playerId: number): Promise<Player | null> => {
    return await processPlayer(playerId, true);
  }, [processPlayer]);

  // Remove player
  const removePlayer = useCallback((playerId: number) => {
    // ABORT ONGOING OPERATIONS: Abort any ongoing operations for this player
    abortPlayerOperations(abortController, playerId);
    
    state.setPlayers(prev => {
      const newPlayers = new Map(prev);
      newPlayers.delete(playerId);
      return newPlayers;
    });
    
    // Clear selected player if it was the removed player
    if (state.selectedPlayerId === playerId) {
      state.setSelectedPlayerId(null);
    }
  }, [state, abortController]);

  return {
    addPlayer,
    refreshPlayer,
    removePlayer
  };
} 