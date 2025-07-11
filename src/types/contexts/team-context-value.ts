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
  name: string;
  leagueId: string;
  leagueName: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Team data interface
 */
export interface TeamData {
  team: Team;
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
  teams: Team[];
  activeTeamId: string | null;
  activeTeam: Team | null;
  teamData: TeamData | null;
  teamStats: TeamStats | null;
  
  // Loading states
  isLoadingTeams: boolean;
  isLoadingTeamData: boolean;
  isLoadingTeamStats: boolean;
  
  // Error states
  teamsError: string | null;
  teamDataError: string | null;
  teamStatsError: string | null;
  
  // Actions
  setActiveTeam: (teamId: string) => void;
  addTeam: (teamId: string, leagueId: string) => Promise<void>;
  removeTeam: (teamId: string) => Promise<void>;
  refreshTeam: (teamId: string) => Promise<void>;
  updateTeam: (teamId: string) => Promise<void>;
  clearErrors: () => void;
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
  autoRefresh: boolean;
  refreshInterval: number; // in seconds
  showArchived: boolean;
} 