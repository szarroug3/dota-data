/**
 * Team context value types
 * 
 * Defines the structure for team-related state and data management
 * in the frontend application.
 */



// ============================================================================
// TEAM DATA STRUCTURES
// ============================================================================

export interface TeamData {
  // Basic team information
  team: {
    id: string;
    name: string;
    isActive: boolean;
    isLoading: boolean;
    error?: string;
  };
  
  // League information
  league: {
    id: string;
    name: string;
  };
  
  // Match participation
  matches: TeamMatchParticipation[];
  
  // Player information
  players: TeamPlayer[];
  
  // Performance statistics
  performance: TeamPerformance;
}

export interface TeamMatchParticipation {
  matchId: string;
  side: 'radiant' | 'dire';
  opponentTeamName: string;
}

export interface TeamPlayer {
  accountId: number;
  playerName: string;
  
  // Team-specific role performance
  roles: PlayerRoleCount[];
  
  // Team-specific performance
  totalMatches: number;
  totalWins: number;
  totalLosses: number;
  winRate: number;
  
  // Team-specific averages
  averageKDA: number;
  averageGPM: number;
  averageXPM: number;
  averageLastHits: number;
  averageDenies: number;
}

export interface PlayerRoleCount {
  role: PlayerRole;
  count: number;
  winRate: number;
}

export interface TeamPerformance {
  // Overall statistics
  totalMatches: number;
  totalWins: number;
  totalLosses: number;
  overallWinRate: number;
  
  // Hero usage statistics
  heroUsage: HeroUsageStats;
  
  // Draft statistics
  draftStats: DraftStats;
  
  // Current streak
  currentWinStreak: number;
  currentLoseStreak: number;
  
  // Match statistics
  averageMatchDuration: number;
  averageKills: number;
  averageDeaths: number;
  averageGold: number;
  averageExperience: number;
}

export interface HeroUsageStats {
  picks: HeroStats[];
  bans: HeroStats[];
  picksAgainst: HeroStats[]; // Heroes picked against this team
  bansAgainst: HeroStats[]; // Heroes banned against this team
  picksByPlayer: { [heroId: string]: HeroUsageByPlayer }; // Which player picked which hero how many times
}

export interface HeroStats {
  heroId: string;
  heroName: string;
  count: number;
  wins: number;
  winRate: number;
  averageKDA: number;
  averageGPM: number;
  averageXPM: number;
}

export interface DraftStats {
  // Pick order statistics (which team got to pick first hero in the game)
  firstPickCount: number; // Times this team picked the first hero in the game
  secondPickCount: number; // Times this team picked the second hero in the game
  firstPickWinRate: number;
  secondPickWinRate: number;
  
  // Hero pool statistics
  uniqueHeroesPicked: number;
  uniqueHeroesBanned: number;
  mostPickedHero: string;
  mostBannedHero: string;
}

export interface HeroStats {
  heroId: string;
  heroName: string;
  count: number; // Number of times this hero was picked/banned
  winRate: number;
  averageKDA: number;
  averageGPM: number;
  averageXPM: number;
}

export interface HeroUsageByPlayer {
  [accountId: string]: {
    count: number;
    wins: number;
  };
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
// TEAM CONTEXT STATE
// ============================================================================

export interface TeamMatchFilters {
  // Match filtering
  dateRange: { start: string | null; end: string | null };
  heroes: string[]; // Hero IDs picked by the team
  result: 'all' | 'win' | 'loss';
  side: 'all' | 'radiant' | 'dire';
  pickOrder: 'all' | 'first' | 'second'; // First pick or second pick
}

export interface TeamContextValue {
  // State
  teams: Map<string, TeamData>; // Key: [teamId]-[leagueId]
  activeTeam: { teamId: string; leagueId: string } | null;
  isLoading: boolean;
  error: string | null;
  
  // Core operations
  addTeam: (teamId: string, leagueId: string) => Promise<void>;
  refreshTeam: (teamId: string, leagueId: string) => Promise<void>;
  removeTeam: (teamId: string, leagueId: string) => void;
  setActiveTeam: (teamId: string, leagueId: string) => void;
  
  // Team-specific operations
  addMatchToTeam: (matchId: string, teamSide: 'radiant' | 'dire') => Promise<void>;
  addPlayerToTeam: (playerId: string) => Promise<void>;
  
  // Team list management
  setTeams: (teams: Map<string, TeamData>) => void;
  loadTeamsFromConfig: (teamList: TeamData[]) => Promise<void>;
  
  // Data access
  getTeam: (teamId: string) => TeamData | undefined;
  getActiveTeam: () => TeamData | undefined;
  getAllTeams: () => TeamData[];
  
  // Visibility controls
  hideMatch: (teamId: string, leagueId: string, matchId: string) => void;
  showMatch: (teamId: string, leagueId: string, matchId: string) => void;
  hidePlayer: (teamId: string, leagueId: string, playerId: string) => void;
  showPlayer: (teamId: string, leagueId: string, playerId: string) => void;
}

export interface TeamContextProviderProps {
  children: React.ReactNode;
}
