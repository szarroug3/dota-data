/**
 * Match data hook types
 * 
 * Provides type definitions for the useMatchData hook.
 */

import type { HeroStatsGrid, Match, MatchDetails, MatchFilters, MatchPreferences } from '@/types/contexts/match-context-value';

// ============================================================================
// HOOK RETURN VALUE
// ============================================================================

/**
 * Return value for useMatchData hook
 */
export interface UseMatchDataReturn {
  // Match data
  matches: Match[];
  filteredMatches: Match[];
  selectedMatchId: string | null;
  selectedMatch: MatchDetails | null;
  hiddenMatchIds: string[];
  
  // Filters and preferences
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
  refreshMatches: () => Promise<void>;
  refreshMatchDetails: (matchId: string) => Promise<void>;
  refreshHeroStats: () => Promise<void>;
  updatePreferences: (preferences: Partial<MatchPreferences>) => void;
  clearErrors: () => void;
} 