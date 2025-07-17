/**
 * Match context value types
 * 
 * Defines the structure for match-related state and data management
 * in the frontend application.
 */

import { Match } from './team-types';

// Re-export Match type for use in other files
export type { Match };

// ============================================================================
// MATCH DATA TYPES
// ============================================================================

/**
 * Match filters interface
 */
export interface MatchFilters {
  dateRange: {
    start: string | null;
    end: string | null;
  };
  result: 'all' | 'win' | 'loss';
  opponent: string;
  heroes: string[];
  players: string[];
  duration: {
    min: number | null;
    max: number | null;
  };
}

/**
 * Match details interface
 */
export interface MatchDetails extends Match {
  // Extended match data
  radiantTeam: string;
  direTeam: string;
  radiantScore: number;
  direScore: number;
  duration: number; // in seconds
  gameMode: string;
  lobbyType: string;
  
  // Player details
  radiantPlayers: MatchPlayer[];
  direPlayers: MatchPlayer[];
  
  // Draft information
  radiantPicks: string[];
  radiantBans: string[];
  direPicks: string[];
  direBans: string[];
  
  // Match events
  events: MatchEvent[];
  
  // Analysis data
  analysis: MatchAnalysis;
}

/**
 * Match player interface
 */
export interface MatchPlayer {
  playerId: string;
  playerName: string;
  heroId: string;
  heroName: string;
  level: number;
  kills: number;
  deaths: number;
  assists: number;
  lastHits: number;
  denies: number;
  netWorth: number;
  items: string[];
  role: string;
}

/**
 * Match event interface
 */
export interface MatchEvent {
  timestamp: number;
  type: 'kill' | 'death' | 'assist' | 'tower' | 'roshan' | 'ward' | 'item';
  playerId?: string;
  heroId?: string;
  position?: { x: number; y: number };
  details?: Record<string, string | number | boolean | null>;
}

/**
 * Match analysis interface
 */
export interface MatchAnalysis {
  keyMoments: MatchMoment[];
  teamFights: TeamFight[];
  objectives: Objective[];
  performance: PerformanceMetrics;
}

/**
 * Match moment interface
 */
export interface MatchMoment {
  timestamp: number;
  type: 'teamfight' | 'objective' | 'gank' | 'push';
  description: string;
  impact: 'high' | 'medium' | 'low';
  participants: string[];
}

/**
 * Team fight interface
 */
export interface TeamFight {
  startTime: number;
  endTime: number;
  location: { x: number; y: number };
  radiantDeaths: number;
  direDeaths: number;
  winner: 'radiant' | 'dire' | 'draw';
}

/**
 * Objective interface
 */
export interface Objective {
  type: 'tower' | 'roshan' | 'barracks' | 'ancient';
  timestamp: number;
  team: 'radiant' | 'dire';
  location: { x: number; y: number };
}

/**
 * Performance metrics interface
 */
export interface PerformanceMetrics {
  radiantAdvantage: number[];
  direAdvantage: number[];
  goldGraph: { time: number; radiant: number; dire: number }[];
  xpGraph: { time: number; radiant: number; dire: number }[];
}

/**
 * Hero stats grid interface
 */
export interface HeroStatsGrid {
  [heroId: string]: {
    gamesPlayed: number;
    wins: number;
    winRate: number;
    averageKDA: number;
    averageGPM: number;
    averageXPM: number;
  };
}

// ============================================================================
// MATCH CONTEXT STATE
// ============================================================================

/**
 * Match context value interface
 */
export interface MatchContextValue {
  // Match data
  matches: Match[];
  filteredMatches: Match[];
  selectedMatchId: string | null;
  selectedMatch: MatchDetails | null;
  hiddenMatchIds: string[];
  
  // Filters and state
  filters: MatchFilters;
  heroStatsGrid: HeroStatsGrid;
  preferences: MatchPreferences;
  
  // Loading states
  isLoadingMatches: boolean;
  isLoadingMatchDetails: boolean;
  isLoadingHeroStats: boolean;
  
  // Error states
  matchesError: string | null;
  matchDetailsError: string | null;
  heroStatsError: string | null;
  
  // Actions
  setFilters: (filters: MatchFilters) => void;
  selectMatch: (matchId: string) => void;
  hideMatch: (matchId: string) => void;
  showMatch: (matchId: string) => void;
  addMatches: (matches: Match[]) => void;
  refreshMatches: () => Promise<void>;
  refreshMatchDetails: (matchId: string) => Promise<void>;
  refreshHeroStats: () => Promise<void>;
  clearErrors: () => void;
  updatePreferences: (preferences: Partial<MatchPreferences>) => void;
}

/**
 * Match context provider props
 */
export interface MatchContextProviderProps {
  children: React.ReactNode;
}

// ============================================================================
// MATCH DATA TYPES
// ============================================================================

/**
 * Match selection state
 */
export interface MatchSelectionState {
  selectedMatchId: string | null;
  selectedMatchIds: string[];
}

/**
 * Match filtering state
 */
export interface MatchFilteringState {
  filters: MatchFilters;
  hiddenMatchIds: string[];
  sortBy: 'date' | 'result' | 'duration' | 'opponent';
  sortDirection: 'asc' | 'desc';
}

/**
 * Match data loading state
 */
export interface MatchDataLoadingState {
  isLoading: boolean;
  isRefreshing: boolean;
  isParsing: boolean;
  lastUpdated: string | null;
  error: string | null;
}

/**
 * Match preferences and settings
 */
export interface MatchPreferences {
  defaultView: 'list' | 'grid' | 'timeline';
  showHiddenMatches: boolean;
  autoRefresh: boolean;
  refreshInterval: number; // in seconds
  showAdvancedStats: boolean;
} 