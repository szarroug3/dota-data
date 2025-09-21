'use client';

/**
 * Player Context (Frontend - Players State Context)
 */

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

import { useConfigContext } from '@/frontend/contexts/config-context';
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
  const { getGlobalManualPlayers, setGlobalManualPlayers } = useConfigContext();

  const actions = usePlayerOperations(state, processing, playerDataFetching);

  // Hydrate global manual (non-team) players on mount
  useEffect(() => {
    try {
      const stored = getGlobalManualPlayers?.() ?? [];
      if (Array.isArray(stored) && stored.length > 0) {
        stored.forEach((pid) => actions.addPlayer(pid));
      }
    } catch (e) {
      console.warn('Failed to hydrate global manual players:', e);
    }
  }, [actions, getGlobalManualPlayers]);

  const addPlayerAndPersist = useCallback(
    async (playerId: number) => {
      const result = await actions.addPlayer(playerId);
      try {
        const current = getGlobalManualPlayers?.() ?? [];
        if (!current.includes(playerId)) {
          setGlobalManualPlayers?.([...current, playerId]);
        }
      } catch (e) {
        console.warn('Failed to persist global manual players:', e);
      }
      return result;
    },
    [actions, getGlobalManualPlayers, setGlobalManualPlayers],
  );

  const removePlayerAndPersist = useCallback(
    (playerId: number) => {
      try {
        actions.removePlayer(playerId);
      } finally {
        try {
          const current = getGlobalManualPlayers?.() ?? [];
          if (current.includes(playerId)) {
            setGlobalManualPlayers?.(current.filter((id) => id !== playerId));
          }
        } catch (e) {
          console.warn('Failed to update persisted global manual players on remove:', e);
        }
      }
    },
    [actions, getGlobalManualPlayers, setGlobalManualPlayers],
  );

  const contextValue: PlayerContextValue = {
    players: state.players,
    selectedPlayerId: state.selectedPlayerId,
    setSelectedPlayerId: state.setSelectedPlayerId,
    isLoading: state.isLoading,
    addPlayer: addPlayerAndPersist,
    refreshPlayer: actions.refreshPlayer,
    removePlayer: removePlayerAndPersist,
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
