/**
 * Team context value types
 * 
 * Defines the structure for team-related state and data management
 * in the frontend application.
 */

// ============================================================================
// CORE DATA TYPES
// ============================================================================

/**
 * Team interface
 */
export interface Team {
  id: string;
  name: string;
  leagueId: string;
  leagueName?: string;
  isActive: boolean;
  isLoading: boolean;
  error?: string;
}

/**
 * League interface
 */
export interface League {
  id: string;
  name: string;
}

/**
 * Match interface with team context
 */
export interface Match {
  id: string;
  teamId: string;
  leagueId: string;
  opponent: string;
  result: 'win' | 'loss';
  date: string;
  duration: number;
  teamSide: 'radiant' | 'dire';
  players: Player[];
  heroes: string[];
}

/**
 * Player interface
 */
export interface Player {
  id: string;
  name: string;
  accountId: number;
  teamId: string;
  role?: string;
  totalMatches: number;
  winRate: number;
  lastUpdated: string;
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
  averageMatchDuration: number;
  totalPlayers: number;
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

// ============================================================================
// TEAM CONTEXT STATE
// ============================================================================

/**
 * Team context value interface
 */
export interface TeamContextValue {
  // State
  teamDataList: TeamData[];
  activeTeam: { teamId: string; leagueId: string } | null;
  isLoading: boolean;
  error: string | null;
  
  // Core team operations
  addTeam: (teamId: string, leagueId: string) => Promise<void>;
  removeTeam: (teamId: string, leagueId: string) => void;
  setActiveTeam: (teamId: string | null, leagueId?: string) => Promise<void>;
  refreshTeam: (teamId: string, leagueId: string) => Promise<void>;
  
  // League-specific operations
  getTeamMatchesForLeague: (teamId: string, leagueId: string) => Match[];
  getTeamPlayersForLeague: (teamId: string, leagueId: string) => Player[];
  
  // Utilities
  teamExists: (teamId: string, leagueId: string) => boolean;
  clearError: () => void;
}

/**
 * Team context provider props
 */
export interface TeamContextProviderProps {
  children: React.ReactNode;
}

// ============================================================================
// UTILITY TYPES
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