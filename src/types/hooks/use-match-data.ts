/**
 * Match data hook types
 * 
 * Defines the structure for the useMatchData custom hook
 */

import { HeroStatsGrid, Match, MatchDetails, MatchFilters } from '@/types/contexts/match-context-value';

// ============================================================================
// MATCH DATA HOOK RETURN
// ============================================================================

/**
 * Match data hook return interface
 */
export interface UseMatchDataReturn {
  // Match data
  matches: Match[];
  filteredMatches: Match[];
  selectedMatchId: string | null;
  selectedMatch: MatchDetails | null;
  hiddenMatchIds: string[];
  
  // Filters and state
  filters: MatchFilters;
  heroStatsGrid: HeroStatsGrid;
  
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
  refreshMatches: () => Promise<void>;
  parseMatch: (matchId: string) => Promise<void>;
  clearErrors: () => void;
}

/**
 * Match data hook options interface
 */
export interface UseMatchDataOptions {
  autoRefresh?: boolean;
  refreshInterval?: number; // in seconds
  includeDetails?: boolean;
  includeHeroStats?: boolean;
  forceRefresh?: boolean;
  teamId?: string;
}

// ============================================================================
// MATCH DATA HOOK PARAMS
// ============================================================================

/**
 * Match data hook parameters
 */
export interface UseMatchDataParams {
  teamId?: string;
  matchId?: string;
  options?: UseMatchDataOptions;
}

/**
 * Match data fetch parameters
 */
export interface MatchDataFetchParams {
  teamId?: string;
  matchId?: string;
  force?: boolean;
  includeDetails?: boolean;
  includeHeroStats?: boolean;
}

// ============================================================================
// MATCH DATA HOOK STATE
// ============================================================================

/**
 * Match data hook state interface
 */
export interface MatchDataHookState {
  matches: Match[];
  selectedMatchId: string | null;
  selectedMatch: MatchDetails | null;
  hiddenMatchIds: string[];
  filters: MatchFilters;
  isLoading: boolean;
  error: string | null;
  lastUpdated: string | null;
}

/**
 * Match data hook actions interface
 */
export interface MatchDataHookActions {
  setFilters: (filters: MatchFilters) => void;
  selectMatch: (matchId: string) => void;
  hideMatch: (matchId: string) => void;
  showMatch: (matchId: string) => void;
  refreshMatches: () => Promise<void>;
  parseMatch: (matchId: string) => Promise<void>;
  clearErrors: () => void;
}

// ============================================================================
// MATCH DATA HOOK EVENTS
// ============================================================================

/**
 * Match data hook event handlers
 */
export interface MatchDataHookEventHandlers {
  onMatchSelected?: (matchId: string) => void;
  onMatchHidden?: (matchId: string) => void;
  onMatchShown?: (matchId: string) => void;
  onFiltersChanged?: (filters: MatchFilters) => void;
  onMatchParsed?: (matchId: string) => void;
  onError?: (error: string) => void;
}

/**
 * Match data hook callbacks
 */
export interface MatchDataHookCallbacks {
  onSuccess?: (data: Match[]) => void;
  onError?: (error: string) => void;
  onLoading?: (isLoading: boolean) => void;
}

// ============================================================================
// MATCH DATA HOOK UTILITIES
// ============================================================================

/**
 * Match data hook utility functions
 */
export interface MatchDataHookUtils {
  isMatchSelected: (matchId: string) => boolean;
  isMatchHidden: (matchId: string) => boolean;
  getMatchById: (matchId: string) => Match | null;
  getMatchDetails: (matchId: string) => MatchDetails | null;
  hasMatchData: (matchId: string) => boolean;
  isMatchLoading: (matchId: string) => boolean;
  getMatchError: (matchId: string) => string | null;
  filterMatches: (matches: Match[], filters: MatchFilters) => Match[];
}

/**
 * Match data hook validation
 */
export interface MatchDataHookValidation {
  isValidMatchId: (matchId: string) => boolean;
  isValidTeamId: (teamId: string) => boolean;
  validateMatchData: (data: Match) => boolean;
  validateMatchDetails: (data: MatchDetails) => boolean;
  validateFilters: (filters: MatchFilters) => boolean;
}

// ============================================================================
// MATCH DATA HOOK CONFIGURATION
// ============================================================================

/**
 * Match data hook configuration
 */
export interface MatchDataHookConfig {
  autoRefresh: boolean;
  refreshInterval: number; // in seconds
  includeDetails: boolean;
  includeHeroStats: boolean;
  cacheEnabled: boolean;
  cacheTTL: number; // in seconds
  retryAttempts: number;
  retryDelay: number; // in milliseconds
  maxMatches: number;
}

/**
 * Match data hook cache interface
 */
export interface MatchDataHookCache {
  matches: Map<string, Match>;
  matchDetails: Map<string, MatchDetails>;
  heroStats: Map<string, HeroStatsGrid>;
  timestamps: Map<string, number>;
  ttl: number; // in seconds
}

// ============================================================================
// MATCH DATA HOOK FILTERING
// ============================================================================

/**
 * Match filtering utilities
 */
export interface MatchDataHookFiltering {
  applyFilters: (matches: Match[], filters: MatchFilters) => Match[];
  clearFilters: () => void;
  updateFilters: (updates: Partial<MatchFilters>) => void;
  getFilteredCount: () => number;
  getTotalCount: () => number;
}

/**
 * Match sorting utilities
 */
export interface MatchDataHookSorting {
  sortMatches: (matches: Match[], sortBy: string, sortDirection: 'asc' | 'desc') => Match[];
  getSortOptions: () => Array<{ value: string; label: string }>;
} 