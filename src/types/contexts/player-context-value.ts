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
export type Player = OpenDotaPlayerComprehensive;

// ============================================================================
// PLAYER CONTEXT STATE
// ============================================================================

export interface PlayerContextValue {
  // State
  players: Map<string, Player>; // Key: playerId (account_id as string)
  selectedPlayerId: string | null;
  selectedPlayer: Player | null;
  setSelectedPlayerId: (playerId: string | null) => void;
  isLoading: boolean;
  error: string | null;
  
  // Core operations
  addPlayer: (playerId: string) => Promise<Player | null>;
  refreshPlayer: (playerId: string) => Promise<Player | null>;
  
  // Data access
  getPlayer: (playerId: string) => Player | undefined;
  getPlayers: (playerIds: string[]) => Player[];
}

export interface PlayerContextProviderProps {
  children: React.ReactNode;
} 