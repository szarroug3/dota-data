/**
 * Player context value types
 * 
 * Defines the structure for player-related state and data management
 * in the frontend application.
 */

// ============================================================================
// PLAYER DATA STRUCTURES
// ============================================================================

export interface Player {
  // Global player information
  accountId: number;
  name: string;
  rank: PlayerRank;
  
  // Global hero usage statistics
  topHeroes: HeroStats[];
  recentHeroes: HeroStats[];
}

export interface PlayerRank {
  tier: RankTier;
  division: RankDivision | null; // 1 | 2 | 3 | 4 | 5 (null for immortal)
  immortalRank: number | null; // Ranking within immortal bracket (1 = top, 2 = second, etc.)
  mmr: number;
}

export type RankTier = 
  | 'herald'
  | 'guardian'
  | 'crusader'
  | 'archon'
  | 'legend'
  | 'ancient'
  | 'divine'
  | 'immortal';

export type RankDivision = 1 | 2 | 3 | 4 | 5;

export interface HeroStats {
  heroId: string;
  heroName: string;
  gamesPlayed: number;
  winRate: number;
  averageKDA: number;
  averageGPM: number;
  averageXPM: number;
}

export type PlayerRole = 
  | 'carry'
  | 'mid'
  | 'offlane'
  | 'support'
  | 'hard_support'
  | 'jungle'
  | 'roaming'
  | 'unknown';

// ============================================================================
// PLAYER CONTEXT STATE
// ============================================================================

export interface PlayerContextValue {
  // State
  players: Player[];
  
  // Loading states
  isLoadingPlayers: boolean;
  isLoadingPlayerData: boolean;
  
  // Error states
  playersError: string | null;
  playerDataError: string | null;
  
  // Actions
  addPlayer: (playerId: string) => Promise<void>;
  removePlayer: (playerId: string) => Promise<void>;
  refreshPlayer: (playerId: string) => Promise<void>;
  clearErrors: () => void;
  
  // Player-specific functions
  getPlayerTopHeroes: (accountId: number) => HeroStats[];
  getPlayerRecentHeroes: (accountId: number) => HeroStats[];
  getPlayerRank: (accountId: number) => PlayerRank | undefined;
}

export interface PlayerContextProviderProps {
  children: React.ReactNode;
}

// ============================================================================
// ADDITIONAL TYPES FOR COMPONENTS
// ============================================================================

/**
 * Player filters for filtering player lists
 */
export interface PlayerFilters {
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  heroes: string[];
  roles: string[];
  result: 'all' | 'radiant' | 'dire';
  performance: {
    minKDA: number | null;
    maxKDA: number | null;
    minGPM: number | null;
    maxGPM: number | null;
    minXPM: number | null;
    maxXPM: number | null;
  };
} 