"use client";

/**
 * Player Context
 * 
 * Manages player data and provides actions for player operations.
 * Handles player data filtering, sorting, and aggregation.
 * Uses player data fetching context for data retrieval.
 */

import React, { createContext, useCallback, useContext, useState } from 'react';

import { usePlayerDataFetching } from '@/contexts/player-data-fetching-context';
import type { Player, PlayerContextProviderProps, PlayerContextValue } from '@/types/contexts/player-context-value';
import type { OpenDotaPlayerComprehensive } from '@/types/external-apis';

// ============================================================================
// CONTEXT CREATION
// ============================================================================

const PlayerContext = createContext<PlayerContextValue | undefined>(undefined);

// ============================================================================
// CUSTOM HOOKS (STATE & LOGIC)
// ============================================================================

function usePlayerState() {
  const [players, setPlayers] = useState<Map<string, Player>>(new Map());
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return {
    players, setPlayers,
    selectedPlayerId, setSelectedPlayerId,
    isLoading, setIsLoading,
    error, setError
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
  state: ReturnType<typeof usePlayerState>,
  processing: ReturnType<typeof usePlayerProcessing>,
  playerDataFetching: ReturnType<typeof usePlayerDataFetching>
) {
  // Consolidated player operation with force parameter
  const processPlayer = useCallback(async (playerId: string, force = false): Promise<Player | null> => {
    // Check if player already exists (skip if exists and not forcing)
    if (!force && state.players.has(playerId)) {
      return state.players.get(playerId) || null;
    }
    
    state.setIsLoading(true);
    state.setError(null);
    
    try {
      // Fetch player data with force parameter
      const playerData = await playerDataFetching.fetchPlayerData(playerId, force);
      
      if ('error' in playerData) {
        throw new Error(playerData.error);
      }
      
      // Process player data
      const processedPlayer = processing.processPlayerData(playerData);
      
      // Add/update to state
      state.setPlayers(prev => new Map(prev).set(playerId, processedPlayer));
      
      return processedPlayer;
      
    } catch (err) {
      state.setError(err instanceof Error ? err.message : 'Failed to process player');
      return null;
    } finally {
      state.setIsLoading(false);
    }
  }, [state, processing, playerDataFetching]);

  // Add player (force = false)
  const addPlayer = useCallback(async (playerId: string): Promise<Player | null> => {
    return await processPlayer(playerId, false);
  }, [processPlayer]);

  // Refresh player (force = true)
  const refreshPlayer = useCallback(async (playerId: string): Promise<Player | null> => {
    return await processPlayer(playerId, true);
  }, [processPlayer]);

  return {
    addPlayer,
    refreshPlayer
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
    selectedPlayer: state.selectedPlayerId ? state.players.get(state.selectedPlayerId) || null : null,
    setSelectedPlayerId: state.setSelectedPlayerId,
    isLoading: state.isLoading,
    error: state.error,
    
    // Core operations
    addPlayer: actions.addPlayer,
    refreshPlayer: actions.refreshPlayer,
    
    // Data access
    getPlayer: (playerId: string) => state.players.get(playerId),
    getPlayers: (playerIds: string[]) => playerIds.map(id => state.players.get(id)).filter((player): player is Player => player !== undefined)
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