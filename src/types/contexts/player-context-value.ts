/**
 * Player context value types
 * 
 * Defines the structure for player-related state and data management
 * in the frontend application.
 */

import { Player } from './team-types';

// Re-export Player type for use in other files
export type { Player };

// ============================================================================
// PLAYER DATA TYPES
// ============================================================================

/**
 * Player data interface
 */
export interface PlayerData {
  player: Player;
  matches: PlayerMatch[];
  heroes: PlayerHero[];
  stats: PlayerStats;
  trends: PlayerTrends;
}

/**
 * Player match interface
 */
export interface PlayerMatch {
  matchId: string;
  date: string;
  heroId: string;
  heroName: string;
  result: 'win' | 'loss';
  kills: number;
  deaths: number;
  assists: number;
  lastHits: number;
  denies: number;
  netWorth: number;
  gpm: number;
  xpm: number;
  items: string[];
  role: string;
  team: 'radiant' | 'dire';
}

/**
 * Player hero interface
 */
export interface PlayerHero {
  heroId: string;
  heroName: string;
  gamesPlayed: number;
  wins: number;
  losses: number;
  winRate: number;
  averageKDA: number;
  averageGPM: number;
  averageXPM: number;
  bestPerformance: PlayerMatch | null;
  worstPerformance: PlayerMatch | null;
}

/**
 * Player stats interface
 */
export interface PlayerStats {
  totalMatches: number;
  totalWins: number;
  totalLosses: number;
  overallWinRate: number;
  averageKDA: number;
  averageGPM: number;
  averageXPM: number;
  mostPlayedHero: PlayerHero | null;
  bestHero: PlayerHero | null;
  preferredRole: string;
  averageMatchDuration: number;
}

/**
 * Player trends interface
 */
export interface PlayerTrends {
  recentPerformance: PerformancePeriod[];
  heroProgression: HeroProgression[];
  roleEvolution: RoleEvolution[];
}

/**
 * Performance period interface
 */
export interface PerformancePeriod {
  period: string;
  matches: number;
  wins: number;
  winRate: number;
  averageKDA: number;
  averageGPM: number;
  averageXPM: number;
}

/**
 * Hero progression interface
 */
export interface HeroProgression {
  heroId: string;
  heroName: string;
  progression: {
    period: string;
    gamesPlayed: number;
    winRate: number;
    averageKDA: number;
  }[];
}

/**
 * Role evolution interface
 */
export interface RoleEvolution {
  role: string;
  evolution: {
    period: string;
    gamesPlayed: number;
    winRate: number;
    averagePerformance: number;
  }[];
}

/**
 * Player filters interface
 */
export interface PlayerFilters {
  dateRange: {
    start: string | null;
    end: string | null;
  };
  heroes: string[];
  roles: string[];
  result: 'all' | 'win' | 'lose';
  performance: {
    minKDA: number | null;
    minGPM: number | null;
    minXPM: number | null;
  };
}

// ============================================================================
// PLAYER CONTEXT STATE
// ============================================================================

/**
 * Player context value interface
 */
export interface PlayerContextValue {
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
 * Player context provider props
 */
export interface PlayerContextProviderProps {
  children: React.ReactNode;
}

// ============================================================================
// PLAYER DATA TYPES
// ============================================================================

/**
 * Player selection state
 */
export interface PlayerSelectionState {
  selectedPlayerId: string | null;
  selectedPlayerIds: string[];
}

/**
 * Player filtering state
 */
export interface PlayerFilteringState {
  filters: PlayerFilters;
  sortBy: 'name' | 'matches' | 'winRate' | 'role';
  sortDirection: 'asc' | 'desc';
}

/**
 * Player data loading state
 */
export interface PlayerDataLoadingState {
  isLoading: boolean;
  isRefreshing: boolean;
  lastUpdated: string | null;
  error: string | null;
}

/**
 * Player preferences and settings
 */
export interface PlayerPreferences {
  defaultView: 'overview' | 'matches' | 'heroes' | 'trends';
  showAdvancedStats: boolean;
  autoRefresh: boolean;
  refreshInterval: number; // in seconds
  showPerformanceGraphs: boolean;
} 