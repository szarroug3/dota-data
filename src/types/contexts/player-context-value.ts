/**
 * Player context value types
 * 
 * Defines the structure for player-related state and data management
 * in the frontend application.
 */

import type { OpenDotaPlayerComprehensive } from '@/types/external-apis';

// ============================================================================
// PLAYER DATA STRUCTURES
// ============================================================================

// For now, we'll store the raw OpenDotaPlayerComprehensive data
// This will be processed later when we know what data we need
export type Player = OpenDotaPlayerComprehensive & {
  error?: string;
  isLoading?: boolean;
};

// ============================================================================
// PLAYER CONTEXT STATE
// ============================================================================

export interface PlayerContextValue {
  // State
  players: Map<number, Player>; // Key: playerId (account_id as number)
  selectedPlayerId: number | null;
  setSelectedPlayerId: (playerId: number | null) => void;
  isLoading: boolean;
  
  // Core operations
  addPlayer: (playerId: number) => Promise<Player | null>;
  refreshPlayer: (playerId: number) => Promise<Player | null>;
  removePlayer: (playerId: number) => void;
  
  // Data access
  getPlayer: (playerId: number) => Player | undefined;
  getPlayers: (playerIds: number[]) => Player[];
}

export interface PlayerContextProviderProps {
  children: React.ReactNode;
}

// ============================================================================
// HOOK RETURN TYPES
// ============================================================================

export interface PlayerState {
  players: Map<number, Player>;
  setPlayers: React.Dispatch<React.SetStateAction<Map<number, Player>>>;
  selectedPlayerId: number | null;
  setSelectedPlayerId: (playerId: number | null) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export interface PlayerProcessing {
  processPlayerData: (playerData: OpenDotaPlayerComprehensive) => OpenDotaPlayerComprehensive;
}

export interface PlayerActions {
  // State
  players: Map<number, Player>;
  selectedPlayerId: number | null;
  isLoading: boolean;
  
  // Core operations
  addPlayer: (playerId: number) => Promise<Player | null>;
  refreshPlayer: (playerId: number) => Promise<Player | null>;
  removePlayer: (playerId: number) => void;
  
  // Data access
  setSelectedPlayerId: (playerId: number | null) => void;
  getPlayer: (playerId: number) => Player | undefined;
  getPlayers: (playerIds: number[]) => Player[];
} 