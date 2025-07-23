"use client";

/**
 * Player Context
 * 
 * Manages player data and provides actions for player operations.
 * Handles player data filtering, sorting, and aggregation.
 * Uses player data fetching context for data retrieval.
 */

import React, { createContext, useCallback, useContext, useState } from 'react';

import type { PlayerDataFetchingContextValue } from '@/contexts/player-data-fetching-context';
import { usePlayerDataFetching } from '@/contexts/player-data-fetching-context';
import type {
  Player,
  PlayerContextProviderProps,
  PlayerContextValue,
  PlayerProcessing,
  PlayerState
} from '@/types/contexts/player-context-value';
import type { OpenDotaPlayerComprehensive } from '@/types/external-apis';
import { createInitialPlayerData, updatePlayerError } from '@/utils/player-helpers';

// ============================================================================
// OPERATION TRACKING
// ============================================================================

/**
 * Track ongoing operations per player ID
 */
const ongoingPlayerOperations = new Map<number, AbortController>();

/**
 * Get or create abort controller for a player operation
 */
function getPlayerAbortController(playerId: number): AbortController {
  // Abort any existing operation for this player
  const existingController = ongoingPlayerOperations.get(playerId);
  if (existingController) {
    existingController.abort();
  }
  
  // Create new abort controller
  const controller = new AbortController();
  ongoingPlayerOperations.set(playerId, controller);
  return controller;
}

/**
 * Clean up abort controller for a player
 */
function cleanupPlayerAbortController(playerId: number): void {
  const controller = ongoingPlayerOperations.get(playerId);
  if (controller) {
    controller.abort();
    ongoingPlayerOperations.delete(playerId);
  }
}

/**
 * Check if a player has ongoing operations
 */
function hasOngoingPlayerOperation(playerId: number): boolean {
  return ongoingPlayerOperations.has(playerId);
}

// ============================================================================
// CONTEXT CREATION
// ============================================================================

const PlayerContext = createContext<PlayerContextValue | undefined>(undefined);

// ============================================================================
// HELPER FUNCTIONS FOR PLAYER OPERATIONS
// ============================================================================

/**
 * Check if operation was aborted and handle silently
 */
function handlePlayerAbortCheck(abortController: AbortController, fallbackPlayer: Player | null): Player | null {
  if (abortController.signal.aborted) {
    // Silently handle abort - this is expected when operations are replaced
    return fallbackPlayer;
  }
  return null;
}

/**
 * Handle error vs abort distinction for player operations
 */
function handlePlayerOperationError(
  error: Error | string | object,
  abortController: AbortController,
  playerId: number,
  state: PlayerState
): Player | null {
  // Only handle actual errors, not aborts
  if (!abortController.signal.aborted) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to process player';
    updatePlayerError(playerId, errorMessage, state);
  }
  // Return optimistic player for aborted operations
  return state.players.get(playerId) || null;
}

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
  const fetchAbortResult = handlePlayerAbortCheck(abortController, optimisticPlayer);
  if (fetchAbortResult) return fetchAbortResult;
  
  if ('error' in playerData) {
    updatePlayerError(playerId, playerData.error, state);
    return null;
  }
  
  // Process player data
  const processedPlayer = processing.processPlayerData(playerData);
  
  // Update state with fetched data
  updateStateWithProcessedPlayer(playerId, processedPlayer, state);
  
  return processedPlayer;
}

// ============================================================================
// CUSTOM HOOKS (STATE & LOGIC)
// ============================================================================

function usePlayerState() {
  const [players, setPlayers] = useState<Map<number, Player>>(new Map());
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  return {
    players, setPlayers,
    selectedPlayerId, setSelectedPlayerId,
    isLoading, setIsLoading
  };
}

function usePlayerProcessing() {
  // For now, we'll store the raw data without processing
  // This will be processed later when we know what data we need
  const processPlayerData = useCallback((playerData: OpenDotaPlayerComprehensive): OpenDotaPlayerComprehensive => {
    return playerData;
  }, []);

  return {
    processPlayerData
  };
}

function usePlayerActions(
  state: PlayerState,
  processing: PlayerProcessing,
  playerDataFetching: PlayerDataFetchingContextValue
) {
  // Destructure state values to avoid recreating the callback on every state change
  const { players, setPlayers, setIsLoading } = state;
  
  // Consolidated player operation with force parameter
  const processPlayer = useCallback(async (playerId: number, force = false): Promise<Player | null> => {
    // Check if player already exists (skip if exists and not forcing)
    if (!force && players.has(playerId)) {
      return players.get(playerId) || null;
    }

    // Check if there's already an ongoing operation for this player
    if (hasOngoingPlayerOperation(playerId)) {
      console.warn(`Operation already in progress for player ${playerId}`);
      return players.get(playerId) || null;
    }

    // Get abort controller for this operation
    const abortController = getPlayerAbortController(playerId);

    try {
      setIsLoading(true);
      
      // Create optimistic player data and add to state
      const optimisticPlayer = createAndAddOptimisticPlayer(playerId, state);

      // Check if operation was aborted
      const abortResult = handlePlayerAbortCheck(abortController, optimisticPlayer);
      if (abortResult) return abortResult;
      
      // Fetch and process player data
      return await fetchAndProcessPlayer(
        playerId,
        force,
        abortController,
        optimisticPlayer,
        playerDataFetching,
        processing,
        state
      );
      
    } catch (err) {
      return handlePlayerOperationError(err as Error | string | object, abortController, playerId, state);
    } finally {
      setIsLoading(false);
      // Clean up abort controller
      cleanupPlayerAbortController(playerId);
    }
  }, [players, setIsLoading, processing, playerDataFetching, state]);

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
    cleanupPlayerAbortController(playerId);
    
    setPlayers(prev => {
      const newPlayers = new Map(prev);
      newPlayers.delete(playerId);
      return newPlayers;
    });
    
    // Clear selected player if it was the removed player
    if (state.selectedPlayerId === playerId) {
      state.setSelectedPlayerId(null);
    }
  }, [state, setPlayers]);

  return {
    addPlayer,
    refreshPlayer,
    removePlayer
  };
}

// ============================================================================
// PROVIDER IMPLEMENTATION
// ============================================================================

export const PlayerProvider: React.FC<PlayerContextProviderProps> = ({ children }) => {
  const state = usePlayerState();
  const processing = usePlayerProcessing();
  const playerDataFetching = usePlayerDataFetching();
  
  const actions = usePlayerActions(state, processing, playerDataFetching);

  const contextValue: PlayerContextValue = {
    // State
    players: state.players,
    selectedPlayerId: state.selectedPlayerId,
    setSelectedPlayerId: state.setSelectedPlayerId,
    isLoading: state.isLoading,
    
    // Core operations
    addPlayer: actions.addPlayer,
    refreshPlayer: actions.refreshPlayer,
    removePlayer: actions.removePlayer,
    
    // Data access
    getPlayer: (playerId: number) => state.players.get(playerId),
    getPlayers: (playerIds: number[]) => playerIds.map(id => state.players.get(id)).filter((player): player is Player => player !== undefined)
  };

  return (
    <PlayerContext.Provider value={contextValue}>
      {children}
    </PlayerContext.Provider>
  );
};

// ============================================================================
// HOOK
// ============================================================================

export const usePlayerContext = (): PlayerContextValue => {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error('usePlayerContext must be used within a PlayerProvider');
  }
  return context;
}; 