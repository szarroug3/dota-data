// ============================================================================
// useMatchData: UI-Focused Match Data Hook
//
// Provides a high-level, UI-friendly interface for match data, actions, and state.
// Aggregates context, loading, error, and convenience actions for components.
// ============================================================================

import { useCallback } from 'react';

import { useMatchContext } from '@/contexts/match-context';
import type { MatchContextValue } from '@/types/contexts/match-context-value';
import type { UseMatchDataReturn } from '@/types/hooks/use-match-data';

// ============================================================================
// Internal: Match Data Selector
// ============================================================================
function useMatchDataSelector(context: MatchContextValue) {
  const {
    matches,
    filteredMatches,
    selectedMatchId,
    selectedMatch,
    hiddenMatchIds,
    filters,
    heroStatsGrid,
    preferences
  } = context;

  return {
    matches,
    filteredMatches,
    selectedMatchId,
    selectedMatch,
    hiddenMatchIds,
    filters,
    heroStatsGrid,
    preferences
  };
}

// ============================================================================
// Internal: Match Loading & Error States
// ============================================================================
function useMatchStates(context: MatchContextValue) {
  return {
    isLoadingMatches: context.isLoadingMatches,
    isLoadingMatchDetails: context.isLoadingMatchDetails,
    isLoadingHeroStats: context.isLoadingHeroStats,
    matchesError: context.matchesError,
    matchDetailsError: context.matchDetailsError,
    heroStatsError: context.heroStatsError
  };
}

// ============================================================================
// Internal: Match Actions
// ============================================================================
function useMatchActions(context: MatchContextValue) {
  const {
    setFilters,
    selectMatch,
    hideMatch,
    showMatch,
    refreshMatches,
    refreshMatchDetails,
    refreshHeroStats,
    updatePreferences,
    clearErrors
  } = context;

  const setFiltersHandler = useCallback((filters: Parameters<typeof setFilters>[0]) => {
    setFilters(filters);
  }, [setFilters]);

  const selectMatchHandler = useCallback((matchId: string) => {
    selectMatch(matchId);
  }, [selectMatch]);

  const hideMatchHandler = useCallback((matchId: string) => {
    hideMatch(matchId);
  }, [hideMatch]);

  const showMatchHandler = useCallback((matchId: string) => {
    showMatch(matchId);
  }, [showMatch]);

  const refreshMatchesHandler = useCallback(async () => {
    await refreshMatches();
  }, [refreshMatches]);

  const refreshMatchDetailsHandler = useCallback(async (matchId: string) => {
    await refreshMatchDetails(matchId);
  }, [refreshMatchDetails]);

  const refreshHeroStatsHandler = useCallback(async () => {
    await refreshHeroStats();
  }, [refreshHeroStats]);

  const updatePreferencesHandler = useCallback((preferences: Parameters<typeof updatePreferences>[0]) => {
    updatePreferences(preferences);
  }, [updatePreferences]);

  const clearErrorsHandler = useCallback(() => {
    clearErrors();
  }, [clearErrors]);

  return {
    setFilters: setFiltersHandler,
    selectMatch: selectMatchHandler,
    hideMatch: hideMatchHandler,
    showMatch: showMatchHandler,
    refreshMatches: refreshMatchesHandler,
    refreshMatchDetails: refreshMatchDetailsHandler,
    refreshHeroStats: refreshHeroStatsHandler,
    updatePreferences: updatePreferencesHandler,
    clearErrors: clearErrorsHandler
  };
}



// ============================================================================
// Exported Hook: useMatchData
// ============================================================================

export function useMatchData(): UseMatchDataReturn {
  const context = useMatchContext();
  
  // Data selectors
  const {
    matches,
    filteredMatches,
    selectedMatchId,
    selectedMatch,
    hiddenMatchIds,
    filters,
    heroStatsGrid,
    preferences
  } = useMatchDataSelector(context);

  // Loading and error states
  const {
    isLoadingMatches,
    isLoadingMatchDetails,
    isLoadingHeroStats,
    matchesError,
    matchDetailsError,
    heroStatsError
  } = useMatchStates(context);

  // Actions
  const {
    setFilters,
    selectMatch,
    hideMatch,
    showMatch,
    refreshMatches,
    refreshMatchDetails,
    refreshHeroStats,
    updatePreferences,
    clearErrors
  } = useMatchActions(context);

  // Wrap refresh actions to accept force?: boolean, but only call with supported args
  const refreshMatchesWithForce = useCallback(async (_force?: boolean) => {
    await refreshMatches();
  }, [refreshMatches]);

  const refreshMatchDetailsWithForce = useCallback(async (matchId: string, _force?: boolean) => {
    await refreshMatchDetails(matchId);
  }, [refreshMatchDetails]);

  return {
    matches,
    filteredMatches,
    selectedMatchId,
    selectedMatch,
    hiddenMatchIds,
    filters,
    heroStatsGrid,
    preferences,
    isLoadingMatches,
    isLoadingMatchDetails,
    isLoadingHeroStats,
    matchesError,
    matchDetailsError,
    heroStatsError,
    setFilters,
    selectMatch,
    hideMatch,
    showMatch,
    refreshMatches: refreshMatchesWithForce,
    refreshMatchDetails: refreshMatchDetailsWithForce,
    refreshHeroStats,
    updatePreferences,
    clearErrors
  };
} 