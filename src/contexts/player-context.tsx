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
import type { Match } from '@/types/contexts/match-context-value';
import type { Player } from '@/types/contexts/player-context-value';
import type { OpenDotaPlayerComprehensive } from '@/types/external-apis';

// ============================================================================
// DEFAULTS & HELPERS
// ============================================================================

const defaultPlayerFilters: PlayerFilters = {
  dateRange: { start: null, end: null },
  heroes: [],
  roles: [],
  result: 'all',
  performance: {
    minKDA: null,
    minGPM: null,
    minXPM: null
  }
};

// Helper to extract player info from OpenDotaPlayerComprehensive
function extractPlayerFromOpenDota(
  playerId: string,
  data: OpenDotaPlayerComprehensive
): Player {
  return {
    id: playerId,
    name: data.profile.profile.personaname || `Player ${playerId}`,
    accountId: data.profile.profile.account_id || 0,
    teamId: '', // Will be set by team context
    role: 'Unknown',
    // OpenDotaPlayerComprehensive does not have total_count or win fields; fallback to 0
    totalMatches: 0, // TODO: Replace with actual value if available in API response
    winRate: 0,      // TODO: Replace with actual value if available in API response
    lastUpdated: new Date().toISOString()
  };
}

// Interface for player data in match
interface MatchPlayerData {
  playerId?: string;
  account_id?: number;
  playerName?: string;
  role?: string;
}

// Helper for filtering - break down into smaller functions to reduce complexity
function checkDateRange(player: Player, filters: PlayerFilters): boolean {
  if (filters.dateRange.start && new Date(player.lastUpdated || '').getTime() < new Date(filters.dateRange.start || '').getTime()) {
    return false;
  }
  if (filters.dateRange.end && new Date(player.lastUpdated || '').getTime() > new Date(filters.dateRange.end || '').getTime()) {
    return false;
  }
  return true;
}

function checkHeroesAndRoles(player: Player, filters: PlayerFilters): boolean {
  if (filters.heroes.length > 0 && !filters.heroes.includes(player.role || '')) {
    return false;
  }
  if (filters.roles.length > 0 && !filters.roles.includes(player.role || '')) {
    return false;
  }
  return true;
}

function checkResultAndPerformance(player: Player, filters: PlayerFilters): boolean {
  if (filters.result !== 'all' && player.winRate < (filters.result === 'win' ? 0.5 : 0.5)) {
    return false;
  }
  if (filters.performance.minKDA !== null && player.winRate < (filters.performance.minKDA / 1000)) {
    return false;
  }
  if (filters.performance.minGPM !== null && player.winRate < (filters.performance.minGPM / 1000)) {
    return false;
  }
  if (filters.performance.minXPM !== null && player.winRate < (filters.performance.minXPM / 1000)) {
    return false;
  }
  return true;
}

function playerMatchesFilters(player: Player, filters: PlayerFilters): boolean {
  return checkDateRange(player, filters) && 
         checkHeroesAndRoles(player, filters) && 
         checkResultAndPerformance(player, filters);
}

// ============================================================================
// TYPES
// ============================================================================

export interface PlayerContextValue {
  // State
  players: Player[];
  filteredPlayers: Player[];
  selectedPlayerId: string | null;
  selectedPlayer: Player | null;
  
  // Filters
  filters: PlayerFilters;
  
  // Loading states
  isLoadingPlayers: boolean;
  isLoadingPlayerData: boolean;
  
  // Error states
  playersError: string | null;
  playerDataError: string | null;
  
  // Actions
  setSelectedPlayer: (playerId: string) => void;
  setFilters: (filters: PlayerFilters) => void;
  addPlayer: (playerId: string) => Promise<void>;
  removePlayer: (playerId: string) => Promise<void>;
  refreshPlayer: (playerId: string) => Promise<void>;
  addMatch: (match: Match) => void; // New: add match data to player context
  clearErrors: () => void;
}

interface PlayerFilters {
  dateRange: { start: string | null; end: string | null };
  heroes: string[];
  roles: string[];
  result: 'all' | 'win' | 'lose';
  performance: {
    minKDA: number | null;
    minGPM: number | null;
    minXPM: number | null;
  };
}

interface PlayerContextProviderProps {
  children: React.ReactNode;
}

// ============================================================================
// CONTEXT CREATION
// ============================================================================

const PlayerContext = createContext<PlayerContextValue | undefined>(undefined);

// ============================================================================
// CUSTOM HOOKS
// ============================================================================

const usePlayerState = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [filters, setFilters] = useState<PlayerFilters>({ ...defaultPlayerFilters });

  return {
    players,
    setPlayers,
    selectedPlayerId,
    setSelectedPlayerId,
    filters,
    setFilters
  };
};

const usePlayerLoadingState = () => {
  const [isLoadingPlayers, setIsLoadingPlayers] = useState(false);
  // Remove unused setIsLoadingPlayerData

  return {
    isLoadingPlayers,
    setIsLoadingPlayers
  };
};

const usePlayerErrorState = () => {
  const [playersError, setPlayersError] = useState<string | null>(null);
  const [playerDataError, setPlayerDataError] = useState<string | null>(null);

  return {
    playersError,
    setPlayersError,
    playerDataError,
    setPlayerDataError
  };
};

const usePlayerFiltering = (players: Player[], filters: PlayerFilters) => {
  const filteredPlayers = players.filter(player => playerMatchesFilters(player, filters));
  return { filteredPlayers };
};

const usePlayerSelection = (
  players: Player[],
  selectedPlayerId: string | null,
  _setSelectedPlayerId: (playerId: string | null) => void
) => {
  const selectedPlayer = selectedPlayerId 
    ? players.find(player => player.id === selectedPlayerId) || null
    : null;

  // Remove unused setSelectedPlayer variable
  return { selectedPlayer };
};

const usePlayerOperations = (
  players: Player[],
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>>,
  setIsLoadingPlayers: (loading: boolean) => void,
  setPlayersError: (error: string | null) => void,
  fetchPlayerData: (playerId: string, force?: boolean) => Promise<OpenDotaPlayerComprehensive | { error: string }>
) => {
  const addPlayer = useCallback(async (playerId: string) => {
    if (players.some((player: Player) => player.id === playerId)) {
      throw new Error('Player already exists');
    }

    setIsLoadingPlayers(true);
    setPlayersError(null);

    try {
      const result = await fetchPlayerData(playerId);
      if ('error' in result) {
        throw new Error(result.error);
      }
      const newPlayer = extractPlayerFromOpenDota(playerId, result as OpenDotaPlayerComprehensive);
      setPlayers((prev: Player[]) => [...prev, newPlayer]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : typeof err === 'string' ? err : 'Failed to add player';
      setPlayersError(errorMessage);
      throw err;
    } finally {
      setIsLoadingPlayers(false);
    }
  }, [players, setIsLoadingPlayers, setPlayersError, fetchPlayerData, setPlayers]);

  const removePlayer = useCallback(async (playerId: string) => {
    setPlayers((prev: Player[]) => prev.filter((player: Player) => player.id !== playerId));
  }, [setPlayers]);

  const refreshPlayer = useCallback(async (playerId: string) => {
    const player = players.find((p: Player) => p.id === playerId);
    if (!player) {
      throw new Error('Player not found');
    }

    setIsLoadingPlayers(true);
    setPlayersError(null);

    try {
      const result = await fetchPlayerData(playerId, true);
      if ('error' in result) {
        throw new Error(result.error);
      }
      const updatedPlayer = {
        ...player,
        ...extractPlayerFromOpenDota(playerId, result as OpenDotaPlayerComprehensive)
      };
      setPlayers((prev: Player[]) => prev.map((p: Player) => p.id === playerId ? updatedPlayer : p));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : typeof err === 'string' ? err : 'Failed to refresh player';
      setPlayersError(errorMessage);
      throw err;
    } finally {
      setIsLoadingPlayers(false);
    }
  }, [players, setIsLoadingPlayers, setPlayersError, fetchPlayerData, setPlayers]);

  const addMatch = useCallback((match: Match) => {
    // Extract player information from the match
    // For now, we'll assume the match has player data in a specific format
    // In a real implementation, we'd need to parse the match data to extract player info
    
    // Example: if match has players array with player IDs
    if (match.players && Array.isArray(match.players)) {
      match.players.forEach((playerData: MatchPlayerData) => {
        const playerId = playerData.playerId || playerData.account_id?.toString();
        if (!playerId) return;

        // Check if player already exists
        const existingPlayer = players.find(p => p.id === playerId);
        
        if (existingPlayer) {
          // Update existing player with new match data
          setPlayers(prev => prev.map(p => {
            if (p.id === playerId) {
              return {
                ...p,
                totalMatches: p.totalMatches + 1,
                winRate: p.totalMatches > 0 ? 
                  ((p.totalMatches * p.winRate + (match.result === 'win' ? 1 : 0)) / (p.totalMatches + 1)) : 
                  (match.result === 'win' ? 1 : 0),
                lastUpdated: new Date().toISOString()
              };
            }
            return p;
          }));
        } else {
          // Create new player entry
          const newPlayer: Player = {
            id: playerId,
            name: playerData.playerName || `Player ${playerId}`,
            accountId: playerData.account_id || parseInt(playerId),
            teamId: match.teamId || '',
            role: playerData.role || 'Unknown',
            totalMatches: 1,
            winRate: match.result === 'win' ? 1 : 0,
            lastUpdated: new Date().toISOString()
          };
          setPlayers(prev => [...prev, newPlayer]);
        }
      });
    }
  }, [players, setPlayers]);

  return { addPlayer, removePlayer, refreshPlayer, addMatch };
};

const usePlayerActions = (
  setFilters: (filters: PlayerFilters) => void,
  setSelectedPlayerId: (playerId: string | null) => void,
  setPlayersError: (error: string | null) => void,
  setPlayerDataError: (error: string | null) => void,
  addPlayer: (playerId: string) => Promise<void>,
  removePlayer: (playerId: string) => Promise<void>,
  refreshPlayer: (playerId: string) => Promise<void>,
  addMatch: (match: Match) => void
) => {
  const setFiltersAction = useCallback((newFilters: PlayerFilters) => {
    setFilters(newFilters);
  }, [setFilters]);

  const setSelectedPlayerAction = useCallback((playerId: string) => {
    setSelectedPlayerId(playerId);
  }, [setSelectedPlayerId]);

  const clearErrors = useCallback(() => {
    setPlayersError(null);
    setPlayerDataError(null);
  }, [setPlayersError, setPlayerDataError]);

  return {
    setFilters: setFiltersAction,
    setSelectedPlayer: setSelectedPlayerAction,
    addPlayer,
    removePlayer,
    refreshPlayer,
    addMatch,
    clearErrors
  };
};

// ============================================================================
// PROVIDER IMPLEMENTATION
// ============================================================================

export const PlayerProvider: React.FC<PlayerContextProviderProps> = ({ children }) => {
  const { fetchPlayerData } = usePlayerDataFetching();

  const {
    players,
    setPlayers,
    selectedPlayerId,
    setSelectedPlayerId,
    filters,
    setFilters
  } = usePlayerState();

  const {
    isLoadingPlayers,
    setIsLoadingPlayers
  } = usePlayerLoadingState();

  const {
    playersError,
    setPlayersError,
    playerDataError,
    setPlayerDataError
  } = usePlayerErrorState();

  const { filteredPlayers } = usePlayerFiltering(players, filters);
  const { selectedPlayer } = usePlayerSelection(players, selectedPlayerId, setSelectedPlayerId);

  const { addPlayer, removePlayer, refreshPlayer, addMatch } = usePlayerOperations(
    players,
    setPlayers,
    setIsLoadingPlayers,
    setPlayersError,
    fetchPlayerData
  );

  const {
    setFilters: setFiltersAction,
    setSelectedPlayer: setSelectedPlayerAction,
    addPlayer: addPlayerAction,
    removePlayer: removePlayerAction,
    refreshPlayer: refreshPlayerAction,
    addMatch: addMatchAction,
    clearErrors
  } = usePlayerActions(
    setFilters,
    setSelectedPlayerId,
    setPlayersError,
    setPlayerDataError,
    addPlayer,
    removePlayer,
    refreshPlayer,
    addMatch
  );

  // ============================================================================
  // CONTEXT VALUE
  // ============================================================================

  const contextValue: PlayerContextValue = {
    players,
    filteredPlayers,
    selectedPlayerId,
    selectedPlayer,
    filters,
    isLoadingPlayers,
    isLoadingPlayerData: false, // Simplified since we removed the separate loading state
    playersError,
    playerDataError,
    setSelectedPlayer: setSelectedPlayerAction,
    setFilters: setFiltersAction,
    addPlayer: addPlayerAction,
    removePlayer: removePlayerAction,
    refreshPlayer: refreshPlayerAction,
    addMatch: addMatchAction,
    clearErrors
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