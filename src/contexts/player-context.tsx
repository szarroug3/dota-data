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
import { usePlayerOperations } from '@/hooks/use-player-operations';
import type {
  Player,
  PlayerContextProviderProps,
  PlayerContextValue
} from '@/types/contexts/player-context-value';
import type { OpenDotaPlayerComprehensive } from '@/types/external-apis';

// ============================================================================
// CONTEXT CREATION
// ============================================================================

const PlayerContext = createContext<PlayerContextValue | undefined>(undefined);

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

// ============================================================================
// PROVIDER IMPLEMENTATION
// ============================================================================

export const PlayerProvider: React.FC<PlayerContextProviderProps> = ({ children }) => {
  const state = usePlayerState();
  const processing = usePlayerProcessing();
  const playerDataFetching = usePlayerDataFetching();
  
  const actions = usePlayerOperations(state, processing, playerDataFetching);

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