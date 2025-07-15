/**
 * Team context value types
 * 
 * Defines the structure for team-related state and data management
 * in the frontend application.
 */

// ============================================================================
// TEAM DATA TYPES
// ============================================================================

/**
 * Team interface
 */
export interface Team {
  id: string;
  name?: string;
  leagueId: string;
  /**
   * League name is optional because not all APIs provide it.
   * If needed, fetch from the leagues API/context.
   */
  leagueName?: string;
  logoUrl?: string;
  isActive: boolean;
  isLoading: boolean;
  error?: string;
  createdAt: string;
  updatedAt: string;
  lastUpdated?: string;
}

/**
 * League interface
 */
export interface League {
  id: string;
  name: string;
  region: string;
  tier: string;
  prizePool: number;
  startDate: string;
  endDate: string;
  lastUpdated: string;
}

/**
 * Team data interface
 */
export interface TeamData {
  team: Team;
  league: League;
  matches: Match[];
  players: Player[];
  summary: TeamSummary;
}

/**
 * Team stats interface
 */
export interface TeamStats {
  totalMatches: number;
  wins: number;
  losses: number;
  winRate: number;
  averageMatchDuration: number;
  mostPlayedHeroes: HeroStats[];
  recentPerformance: PerformanceTrend[];
}

/**
 * Match interface
 */
export interface Match {
  id: string;
  teamId: string;
  opponent: string;
  result: 'win' | 'loss';
  date: string;
  duration: number;
  heroes: string[];
  players: string[];
}

/**
 * Player interface
 */
export interface Player {
  id: string;
  name: string;
  teamId: string;
  role: string;
  totalMatches: number;
  winRate: number;
}

/**
 * Hero stats interface
 */
export interface HeroStats {
  heroId: string;
  heroName: string;
  gamesPlayed: number;
  wins: number;
  winRate: number;
}

/**
 * Performance trend interface
 */
export interface PerformanceTrend {
  period: string;
  wins: number;
  losses: number;
  winRate: number;
}

/**
 * Team summary interface
 */
export interface TeamSummary {
  totalMatches: number;
  totalWins: number;
  totalLosses: number;
  overallWinRate: number;
  lastMatchDate: string | null;
}

// ============================================================================
// TEAM CONTEXT STATE
// ============================================================================

/**
 * Team context value interface
 */
export interface TeamContextValue {
  // Team data
  teamDataList: TeamData[];
  activeTeam: { teamId: string; leagueId: string } | null;
  
  // Actions
  addTeam: (teamId: string, leagueId: string) => Promise<void>;
  removeTeam: (teamId: string, leagueId: string) => Promise<void>;
  refreshTeam: (teamId: string, leagueId: string) => Promise<void>;
  updateTeam: (
    oldTeamId: string,
    oldLeagueId: string,
    newTeamId: string,
    newLeagueId: string
  ) => Promise<void>;
  setActiveTeam: (teamId: string, leagueId: string) => void;
  teamExists: (teamId: string, leagueId: string) => boolean;
  
  // Error handling
  clearGlobalError: () => void;
  getGlobalError: () => string | null;
  isInitialized: () => boolean;
}

/**
 * Team context provider props
 */
export interface TeamContextProviderProps {
  children: React.ReactNode;
}

// ============================================================================
// TEAM DATA TYPES
// ============================================================================

/**
 * Team selection state
 */
export interface TeamSelectionState {
  activeTeamId: string | null;
  selectedTeamIds: string[];
}

/**
 * Team management actions
 */
export interface TeamManagementActions {
  selectTeam: (teamId: string) => void;
  deselectTeam: (teamId: string) => void;
  clearSelection: () => void;
}

/**
 * Team data loading state
 */
export interface TeamDataLoadingState {
  isLoading: boolean;
  isRefreshing: boolean;
  lastUpdated: string | null;
  error: string | null;
}

/**
 * Team preferences and settings
 */
export interface TeamPreferences {
  defaultView: 'overview' | 'matches' | 'players' | 'analysis';
  defaultLeagueId: string;
  autoRefresh: boolean;
  refreshInterval: number; // in milliseconds
  showArchived: boolean;
} 