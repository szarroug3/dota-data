/**
 * Player data hook types
 * 
 * Defines the structure for the usePlayerData custom hook
 */

import { Player, PlayerData, PlayerFilters, PlayerStats } from '@/types/contexts/player-context-value';

// Re-export PlayerFilters for use in the hook
export type { PlayerFilters };

// ============================================================================
// PLAYER DATA HOOK RETURN
// ============================================================================

/**
 * Player data hook return interface
 */
export interface UsePlayerDataReturn {
  // Player data
  players: Player[];
  filteredPlayers: Player[];
  selectedPlayerId: string | null;
  selectedPlayer: PlayerData | null;
  playerStats: PlayerStats | null;
  
  // Filters and state
  filters: PlayerFilters;
  
  // Loading states
  isLoadingPlayers: boolean;
  isLoading: boolean; // Add alias for compatibility
  isLoadingPlayerData: boolean;
  isLoadingPlayerStats: boolean;
  
  // Error states
  playersError: string | null;
  playerDataError: string | null;
  playerStatsError: string | null;
  
  // Actions
  setSelectedPlayer: (playerId: string) => void;
  setFilters: (filters: PlayerFilters) => void;
  addPlayer: (playerId: string) => Promise<void>;
  removePlayer: (playerId: string) => Promise<void>;
  refreshPlayer: (playerId: string) => Promise<void>;
  clearErrors: () => void;
}

/**
 * Player data hook options interface
 */
export interface UsePlayerDataOptions {
  autoRefresh?: boolean;
  refreshInterval?: number; // in seconds
  includeStats?: boolean;
  includeMatches?: boolean;
  includeHeroes?: boolean;
  forceRefresh?: boolean;
}

// ============================================================================
// PLAYER DATA HOOK PARAMS
// ============================================================================

/**
 * Player data hook parameters
 */
export interface UsePlayerDataParams {
  playerId?: string;
  options?: UsePlayerDataOptions;
}

/**
 * Player data fetch parameters
 */
export interface PlayerDataFetchParams {
  playerId: string;
  force?: boolean;
  includeStats?: boolean;
  includeMatches?: boolean;
  includeHeroes?: boolean;
}

// ============================================================================
// PLAYER DATA HOOK STATE
// ============================================================================

/**
 * Player data hook state interface
 */
export interface PlayerDataHookState {
  players: Player[];
  filteredPlayers: Player[];
  selectedPlayerId: string | null;
  selectedPlayer: PlayerData | null;
  playerStats: PlayerStats | null;
  filters: PlayerFilters;
  isLoading: boolean;
  error: string | null;
  lastUpdated: string | null;
}

/**
 * Player data hook actions interface
 */
export interface PlayerDataHookActions {
  setSelectedPlayer: (playerId: string) => void;
  setFilters: (filters: PlayerFilters) => void;
  addPlayer: (playerId: string) => Promise<void>;
  removePlayer: (playerId: string) => Promise<void>;
  refreshPlayer: (playerId: string) => Promise<void>;
  clearErrors: () => void;
}

// ============================================================================
// PLAYER DATA HOOK EVENTS
// ============================================================================

/**
 * Player data hook event handlers
 */
export interface PlayerDataHookEventHandlers {
  onPlayerAdded?: (player: Player) => void;
  onPlayerRemoved?: (playerId: string) => void;
  onPlayerUpdated?: (player: Player) => void;
  onSelectedPlayerChanged?: (playerId: string | null) => void;
  onError?: (error: string) => void;
}

/**
 * Player data hook callbacks
 */
export interface PlayerDataHookCallbacks {
  onSuccess?: (data: PlayerData) => void;
  onError?: (error: string) => void;
  onLoading?: (isLoading: boolean) => void;
}

// ============================================================================
// PLAYER DATA HOOK UTILITIES
// ============================================================================

/**
 * Player data hook utility functions
 */
export interface PlayerDataHookUtils {
  isPlayerSelected: (playerId: string) => boolean;
  getPlayerById: (playerId: string) => Player | null;
  getPlayerStats: (playerId: string) => PlayerStats | null;
  hasPlayerData: (playerId: string) => boolean;
  isPlayerLoading: (playerId: string) => boolean;
  getPlayerError: (playerId: string) => string | null;
}

/**
 * Player data hook validation
 */
export interface PlayerDataHookValidation {
  isValidPlayerId: (playerId: string) => boolean;
  validatePlayerData: (data: PlayerData) => boolean;
  validatePlayerStats: (stats: PlayerStats) => boolean;
}

// ============================================================================
// PLAYER DATA HOOK CONFIGURATION
// ============================================================================

/**
 * Player data hook configuration
 */
export interface PlayerDataHookConfig {
  autoRefresh: boolean;
  refreshInterval: number; // in seconds
  includeStats: boolean;
  includeMatches: boolean;
  includeHeroes: boolean;
  cacheEnabled: boolean;
  cacheTTL: number; // in seconds
  retryAttempts: number;
  retryDelay: number; // in milliseconds
}

/**
 * Player data hook cache interface
 */
export interface PlayerDataHookCache {
  players: Map<string, Player>;
  playerData: Map<string, PlayerData>;
  playerStats: Map<string, PlayerStats>;
  timestamps: Map<string, number>;
  ttl: number; // in seconds
} 