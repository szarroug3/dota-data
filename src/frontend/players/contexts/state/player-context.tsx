'use client';

/**
 * Player Context (Frontend - Players State Context)
 */

import React, { createContext, useCallback, useContext, useState } from 'react';

import { usePlayerDataFetching } from '@/frontend/players/contexts/fetching/player-data-fetching-context';
import { usePlayerOperations } from '@/hooks/use-player-operations';
import type { Player, PlayerContextProviderProps, PlayerContextValue } from '@/types/contexts/player-context-value';
import type { OpenDotaPlayerComprehensive } from '@/types/external-apis';

const PlayerContext = createContext<PlayerContextValue | undefined>(undefined);

function usePlayerState() {
  const [players, setPlayers] = useState<Map<number, Player>>(new Map());
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  return {
    players,
    setPlayers,
    selectedPlayerId,
    setSelectedPlayerId,
    isLoading,
    setIsLoading,
  };
}

function usePlayerProcessing() {
  const processPlayerData = useCallback((playerData: OpenDotaPlayerComprehensive): OpenDotaPlayerComprehensive => {
    return playerData;
  }, []);

  return { processPlayerData };
}

export const PlayerProvider: React.FC<PlayerContextProviderProps> = ({ children }) => {
  const state = usePlayerState();
  const processing = usePlayerProcessing();
  const playerDataFetching = usePlayerDataFetching();

  const actions = usePlayerOperations(state, processing, playerDataFetching);

  const contextValue: PlayerContextValue = {
    players: state.players,
    selectedPlayerId: state.selectedPlayerId,
    setSelectedPlayerId: state.setSelectedPlayerId,
    isLoading: state.isLoading,
    addPlayer: actions.addPlayer,
    refreshPlayer: actions.refreshPlayer,
    removePlayer: actions.removePlayer,
    getPlayer: (playerId: number) => state.players.get(playerId),
    getPlayers: (playerIds: number[]) =>
      playerIds.map((id) => state.players.get(id)).filter((p): p is Player => p !== undefined),
  };

  return <PlayerContext.Provider value={contextValue}>{children}</PlayerContext.Provider>;
};

export const usePlayerContext = (): PlayerContextValue => {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error('usePlayerContext must be used within a PlayerProvider');
  }
  return context;
};
