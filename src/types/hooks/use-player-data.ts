/**
 * usePlayerData hook types
 * 
 * Defines the return type for the usePlayerData hook,
 * providing a clean interface for player data management.
 */

import type { Player, PlayerFilters } from '@/types/contexts/player-context-value';

/**
 * Return type for the usePlayerData hook
 */
export interface UsePlayerDataReturn {
  // Player data
  players: Player[];
  filteredPlayers: Player[];
  selectedPlayerId: string | null;
  selectedPlayer: Player | null;
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
  clearErrors: () => void;
} 