"use client";

/**
 * Match Context
 *
 * Manages match state, filtering, selection, preferences, and business logic.
 * Uses MatchDataFetchingContext for all data fetching (no API calls here).
 * Provides a clean, type-safe interface for match data and actions.
 */

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

import type {
  HeroStatsGrid,
  Match,
  MatchContextProviderProps,
  MatchContextValue,
  MatchDetails,
  MatchFilters,
  MatchPreferences
} from '@/types/contexts/match-context-value';

// ============================================================================
// CONTEXT CREATION
// ============================================================================

const MatchContext = createContext<MatchContextValue | undefined>(undefined);

// ============================================================================
// DEFAULTS & HELPERS
// ============================================================================

const defaultFilters: MatchFilters = {
  dateRange: { start: null, end: null },
  result: 'all',
  opponent: '',
  heroes: [],
  players: [],
  duration: { min: null, max: null }
};

const defaultPreferences: MatchPreferences = {
  defaultView: 'list',
  showHiddenMatches: false,
  refreshInterval: 300,
  showAdvancedStats: false,
  autoRefresh: false
};

// ============================================================================
// CUSTOM HOOKS (STATE & LOGIC)
// ============================================================================

function useMatchState() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [filteredMatches, setFilteredMatches] = useState<Match[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<MatchDetails | null>(null);
  const [hiddenMatchIds, setHiddenMatchIds] = useState<string[]>([]);
  const [filters, setFilters] = useState<MatchFilters>(defaultFilters);
  const [heroStatsGrid, setHeroStatsGrid] = useState<HeroStatsGrid>({});
  const [preferences, setPreferences] = useState<MatchPreferences>(defaultPreferences);
  const [isLoadingMatches, setIsLoadingMatches] = useState(false);
  const [isLoadingMatchDetails, setIsLoadingMatchDetails] = useState(false);
  const [isLoadingHeroStats, setIsLoadingHeroStats] = useState(false);
  const [matchesError, setMatchesError] = useState<string | null>(null);
  const [matchDetailsError, setMatchDetailsError] = useState<string | null>(null);
  const [heroStatsError, setHeroStatsError] = useState<string | null>(null);
  return {
    matches, setMatches,
    filteredMatches, setFilteredMatches,
    selectedMatchId, setSelectedMatchId,
    selectedMatch, setSelectedMatch,
    hiddenMatchIds, setHiddenMatchIds,
    filters, setFilters,
    heroStatsGrid, setHeroStatsGrid,
    preferences, setPreferences,
    isLoadingMatches, setIsLoadingMatches,
    isLoadingMatchDetails, setIsLoadingMatchDetails,
    isLoadingHeroStats, setIsLoadingHeroStats,
    matchesError, setMatchesError,
    matchDetailsError, setMatchDetailsError,
    heroStatsError, setHeroStatsError
  };
}

function useMatchFiltering(matches: Match[], filters: MatchFilters, hiddenMatchIds: string[]) {
  // Filtering logic (date, result, opponent, heroes, players, duration)
  return useMemo(() => {
    let result = matches;
    if (filters.dateRange.start || filters.dateRange.end) {
      result = result.filter(m => {
        const date = new Date(m.date).getTime();
        const start = filters.dateRange.start ? new Date(filters.dateRange.start).getTime() : -Infinity;
        const end = filters.dateRange.end ? new Date(filters.dateRange.end).getTime() : Infinity;
        return date >= start && date <= end;
      });
    }
    if (filters.result !== 'all') {
      result = result.filter(m => m.result === filters.result);
    }
    if (filters.opponent) {
      result = result.filter(m => m.opponent.toLowerCase().includes(filters.opponent.toLowerCase()));
    }
    if (filters.heroes.length > 0) {
      result = result.filter(m => m.heroes.some(h => filters.heroes.includes(h)));
    }
    if (filters.players.length > 0) {
      result = result.filter(m => m.players.some(p => filters.players.includes(p.id)));
    }
    if (filters.duration.min !== null) {
      result = result.filter(m => m.duration >= (filters.duration.min ?? 0));
    }
    if (filters.duration.max !== null) {
      result = result.filter(m => m.duration <= (filters.duration.max ?? Infinity));
    }
    // Hide matches
    result = result.filter(m => !hiddenMatchIds.includes(m.id));
    return result;
  }, [matches, filters, hiddenMatchIds]);
}

function buildMatchDetails(selectedMatch: Match): MatchDetails {
  return {
    ...selectedMatch,
    radiantTeam: selectedMatch.teamSide === 'radiant' ? 'Active Team' : selectedMatch.opponent,
    direTeam: selectedMatch.teamSide === 'dire' ? 'Active Team' : selectedMatch.opponent,
    radiantScore: selectedMatch.teamSide === 'radiant' ? (selectedMatch.result === 'win' ? 1 : 0) : (selectedMatch.result === 'win' ? 0 : 1),
    direScore: selectedMatch.teamSide === 'dire' ? (selectedMatch.result === 'win' ? 1 : 0) : (selectedMatch.result === 'win' ? 0 : 1),
    gameMode: 'Captains Mode',
    lobbyType: 'Tournament',
    radiantPlayers: selectedMatch.players
      .filter((_, index) => index < 5)
      .map((player, index) => ({
        playerId: player.id,
        playerName: player.name,
        heroId: selectedMatch.heroes[index] || '',
        heroName: selectedMatch.heroes[index] || 'Unknown Hero',
        level: 25,
        kills: 0,
        deaths: 0,
        assists: 0,
        lastHits: 0,
        denies: 0,
        netWorth: 0,
        items: [],
        role: player.role || 'Unknown'
      })),
    direPlayers: selectedMatch.players
      .filter((_, index) => index >= 5)
      .map((player, index) => ({
        playerId: player.id,
        playerName: player.name,
        heroId: selectedMatch.heroes[index + 5] || '',
        heroName: selectedMatch.heroes[index + 5] || 'Unknown Hero',
        level: 25,
        kills: 0,
        deaths: 0,
        assists: 0,
        lastHits: 0,
        denies: 0,
        netWorth: 0,
        items: [],
        role: player.role || 'Unknown'
      })),
    radiantPicks: selectedMatch.heroes.slice(0, 5),
    radiantBans: [],
    direPicks: selectedMatch.heroes.slice(5, 10),
    direBans: [],
    events: [],
    analysis: {
      keyMoments: [],
      teamFights: [],
      objectives: [],
      performance: {
        radiantAdvantage: [],
        direAdvantage: [],
        goldGraph: [],
        xpGraph: []
      }
    }
  };
}

function useMatchActions(state: ReturnType<typeof useMatchState>) {
  // Set filters
  const setFilters = useCallback((filters: MatchFilters) => {
    state.setFilters(filters);
  }, [state]);

  // Select match
  const selectMatch = useCallback((matchId: string) => {
    state.setSelectedMatchId(matchId);
    const selectedMatch = state.matches.find(m => m.id === matchId);
    if (selectedMatch) {
      state.setSelectedMatch(buildMatchDetails(selectedMatch));
    } else {
      state.setSelectedMatch(null);
    }
  }, [state]);

  // Hide/show match
  const hideMatch = useCallback((matchId: string) => {
    state.setHiddenMatchIds(prev => [...prev, matchId]);
  }, [state]);
  const showMatch = useCallback((matchId: string) => {
    state.setHiddenMatchIds(prev => prev.filter(id => id !== matchId));
  }, [state]);

  // Preferences
  const updatePreferences = useCallback((preferences: Partial<MatchPreferences>) => {
    state.setPreferences(prev => ({ ...prev, ...preferences }));
  }, [state]);

  // Error handling
  const clearErrors = useCallback(() => {
    state.setMatchesError(null);
    state.setMatchDetailsError(null);
    state.setHeroStatsError(null);
  }, [state]);

  // Refresh actions
  const refreshMatches = useCallback(async () => {
    state.setIsLoadingMatches(true);
    try {
      // No-op
    } finally {
      state.setIsLoadingMatches(false);
    }
  }, [state]);
  const refreshMatchDetails = useCallback(async (_matchId: string) => {
    state.setIsLoadingMatchDetails(true);
    try {
      // No-op
    } finally {
      state.setIsLoadingMatchDetails(false);
    }
  }, [state]);
  const refreshHeroStats = useCallback(async () => {
    state.setIsLoadingHeroStats(true);
    try {
      // No-op
    } finally {
      state.setIsLoadingHeroStats(false);
    }
  }, [state]);

  // Add matches to context
  const addMatches = useCallback((newMatches: Match[]) => {
    state.setMatches(prev => [...prev, ...newMatches]);
  }, [state]);

  return {
    setFilters,
    selectMatch,
    hideMatch,
    showMatch,
    addMatches,
    refreshMatches,
    refreshMatchDetails,
    refreshHeroStats,
    clearErrors,
    updatePreferences
  };
}

// ============================================================================
// PROVIDER IMPLEMENTATION
// ============================================================================

export const MatchProvider: React.FC<MatchContextProviderProps> = ({ children }) => {
  const state = useMatchState();
  // Filtering
  const filteredMatches = useMatchFiltering(state.matches, state.filters, state.hiddenMatchIds);
  // Actions
  const actions = useMatchActions(state);

  // Context value
  const contextValue: MatchContextValue = {
    matches: state.matches,
    filteredMatches,
    selectedMatchId: state.selectedMatchId,
    selectedMatch: state.selectedMatch, // This can be set by orchestrator or effect
    hiddenMatchIds: state.hiddenMatchIds,
    filters: state.filters,
    heroStatsGrid: state.heroStatsGrid,
    preferences: state.preferences,
    isLoadingMatches: state.isLoadingMatches,
    isLoadingMatchDetails: state.isLoadingMatchDetails,
    isLoadingHeroStats: state.isLoadingHeroStats,
    matchesError: state.matchesError,
    matchDetailsError: state.matchDetailsError,
    heroStatsError: state.heroStatsError,
    setFilters: actions.setFilters,
    selectMatch: actions.selectMatch,
    hideMatch: actions.hideMatch,
    showMatch: actions.showMatch,
    addMatches: actions.addMatches,
    refreshMatches: actions.refreshMatches,
    refreshMatchDetails: actions.refreshMatchDetails,
    refreshHeroStats: actions.refreshHeroStats,
    clearErrors: actions.clearErrors,
    updatePreferences: actions.updatePreferences
  };

  return (
    <MatchContext.Provider value={contextValue}>
      {children}
    </MatchContext.Provider>
  );
};

// ============================================================================
// HOOK
// ============================================================================

export const useMatchContext = (): MatchContextValue => {
  const context = useContext(MatchContext);
  if (context === undefined) {
    throw new Error('useMatchContext must be used within a MatchProvider');
  }
  return context;
}; 