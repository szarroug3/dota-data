/**
 * Match Context Provider
 *
 * Manages match state, data fetching, filtering, and match management actions.
 * Provides centralized match data management for the entire application.
 */

import React, { createContext, useContext, useEffect, useMemo, useReducer } from 'react';

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
// TYPES
// ============================================================================

interface MatchState {
  matches: Match[];
  filteredMatches: Match[];
  selectedMatchId: string | null;
  selectedMatch: MatchDetails | null;
  hiddenMatchIds: string[];
  filters: MatchFilters;
  heroStatsGrid: HeroStatsGrid;
  isLoadingMatches: boolean;
  isLoadingMatchDetails: boolean;
  isLoadingHeroStats: boolean;
  matchesError: string | null;
  matchDetailsError: string | null;
  heroStatsError: string | null;
  preferences: MatchPreferences;
}

type MatchAction =
  | { type: 'SET_MATCHES_LOADING'; payload: boolean }
  | { type: 'SET_MATCHES'; payload: Match[] }
  | { type: 'SET_MATCHES_ERROR'; payload: string | null }
  | { type: 'SET_FILTERS'; payload: MatchFilters }
  | { type: 'SET_FILTERED_MATCHES'; payload: Match[] }
  | { type: 'SET_SELECTED_MATCH_ID'; payload: string | null }
  | { type: 'SET_SELECTED_MATCH'; payload: MatchDetails | null }
  | { type: 'SET_MATCH_DETAILS_LOADING'; payload: boolean }
  | { type: 'SET_MATCH_DETAILS_ERROR'; payload: string | null }
  | { type: 'SET_HIDDEN_MATCH_IDS'; payload: string[] }
  | { type: 'HIDE_MATCH'; payload: string }
  | { type: 'SHOW_MATCH'; payload: string }
  | { type: 'SET_HERO_STATS_LOADING'; payload: boolean }
  | { type: 'SET_HERO_STATS_GRID'; payload: HeroStatsGrid }
  | { type: 'SET_HERO_STATS_ERROR'; payload: string | null }
  | { type: 'CLEAR_ERRORS' }
  | { type: 'SET_PREFERENCES'; payload: Partial<MatchPreferences> };

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const createMockMatch = (id: string): Match => ({
  id,
  teamId: '1',
  opponent: 'Team Beta',
  result: 'win',
  date: '2024-06-01T12:00:00Z',
  duration: 2400,
  heroes: ['1', '2', '3', '4', '5'],
  players: ['p1', 'p2', 'p3', 'p4', 'p5']
});

const createMockMatchDetails = (matchId: string): MatchDetails => ({
  id: matchId,
  teamId: '1',
  opponent: 'Team Beta',
  result: 'win',
  date: '2024-06-01T12:00:00Z',
  duration: 2400,
  heroes: ['1', '2', '3', '4', '5'],
  players: ['p1', 'p2', 'p3', 'p4', 'p5'],
  radiantTeam: 'Team Alpha',
  direTeam: 'Team Beta',
  radiantScore: 30,
  direScore: 20,
  gameMode: 'All Pick',
  lobbyType: 'Ranked',
  radiantPlayers: [],
  direPlayers: [],
  radiantPicks: [],
  radiantBans: [],
  direPicks: [],
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
});

const handleLoadingStates = (state: MatchState, action: MatchAction): MatchState => {
  switch (action.type) {
    case 'SET_MATCHES_LOADING':
      return { ...state, isLoadingMatches: action.payload };
    case 'SET_MATCH_DETAILS_LOADING':
      return { ...state, isLoadingMatchDetails: action.payload };
    case 'SET_HERO_STATS_LOADING':
      return { ...state, isLoadingHeroStats: action.payload };
    default:
      return state;
  }
};

const handleErrorStates = (state: MatchState, action: MatchAction): MatchState => {
  switch (action.type) {
    case 'SET_MATCHES_ERROR':
      return { ...state, matchesError: action.payload, isLoadingMatches: false };
    case 'SET_MATCH_DETAILS_ERROR':
      return { ...state, matchDetailsError: action.payload, isLoadingMatchDetails: false };
    case 'SET_HERO_STATS_ERROR':
      return { ...state, heroStatsError: action.payload, isLoadingHeroStats: false };
    case 'CLEAR_ERRORS':
      return {
        ...state,
        matchesError: null,
        matchDetailsError: null,
        heroStatsError: null
      };
    default:
      return state;
  }
};

const handleDataStates = (state: MatchState, action: MatchAction): MatchState => {
  switch (action.type) {
    case 'SET_MATCHES':
      return { ...state, matches: action.payload, isLoadingMatches: false };
    case 'SET_FILTERED_MATCHES':
      return { ...state, filteredMatches: action.payload };
    case 'SET_SELECTED_MATCH':
      return { ...state, selectedMatch: action.payload };
    case 'SET_HERO_STATS_GRID':
      return { ...state, heroStatsGrid: action.payload, isLoadingHeroStats: false };
    default:
      return state;
  }
};

const handleSelectionStates = (state: MatchState, action: MatchAction): MatchState => {
  switch (action.type) {
    case 'SET_SELECTED_MATCH_ID':
      return { ...state, selectedMatchId: action.payload };
    case 'SET_FILTERS':
      return { ...state, filters: action.payload };
    case 'SET_HIDDEN_MATCH_IDS':
      return { ...state, hiddenMatchIds: action.payload };
    case 'HIDE_MATCH':
      return { ...state, hiddenMatchIds: [...state.hiddenMatchIds, action.payload] };
    case 'SHOW_MATCH':
      return { ...state, hiddenMatchIds: state.hiddenMatchIds.filter(id => id !== action.payload) };
    case 'SET_PREFERENCES':
      return { ...state, preferences: { ...state.preferences, ...action.payload } };
    default:
      return state;
  }
};

// ============================================================================
// REDUCER
// ============================================================================

const matchReducer = (state: MatchState, action: MatchAction): MatchState => {
  // Try loading states first
  const loadingState = handleLoadingStates(state, action);
  if (loadingState !== state) return loadingState;

  // Try error states
  const errorState = handleErrorStates(state, action);
  if (errorState !== state) return errorState;

  // Try data states
  const dataState = handleDataStates(state, action);
  if (dataState !== state) return dataState;

  // Try selection states
  const selectionState = handleSelectionStates(state, action);
  if (selectionState !== state) return selectionState;

  return state;
};

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialState: MatchState = {
  matches: [],
  filteredMatches: [],
  selectedMatchId: null,
  selectedMatch: null,
  hiddenMatchIds: [],
  filters: {
    dateRange: { start: null, end: null },
    result: 'all',
    opponent: '',
    heroes: [],
    players: [],
    duration: { min: null, max: null }
  },
  heroStatsGrid: {},
  isLoadingMatches: false,
  isLoadingMatchDetails: false,
  isLoadingHeroStats: false,
  matchesError: null,
  matchDetailsError: null,
  heroStatsError: null,
  preferences: {
    defaultView: 'list',
    showHiddenMatches: false,
    autoRefresh: true,
    refreshInterval: 300,
    showAdvancedStats: false
  }
};

// ============================================================================
// FETCHER FUNCTIONS
// ============================================================================

const createFetchers = (dispatch: React.Dispatch<MatchAction>) => ({
  fetchMatches: async (): Promise<void> => {
    try {
      dispatch({ type: 'SET_MATCHES_LOADING', payload: true });
      const mockMatches: Match[] = [createMockMatch('m1')];
      dispatch({ type: 'SET_MATCHES', payload: mockMatches });
      dispatch({ type: 'SET_FILTERED_MATCHES', payload: mockMatches });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch matches';
      dispatch({ type: 'SET_MATCHES_ERROR', payload: errorMessage });
    }
  },

  fetchMatchDetails: async (matchId: string): Promise<void> => {
    try {
      dispatch({ type: 'SET_MATCH_DETAILS_LOADING', payload: true });
      const mockMatchDetails = createMockMatchDetails(matchId);
      dispatch({ type: 'SET_SELECTED_MATCH', payload: mockMatchDetails });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch match details';
      dispatch({ type: 'SET_MATCH_DETAILS_ERROR', payload: errorMessage });
    }
  },

  fetchHeroStatsGrid: async (): Promise<void> => {
    try {
      dispatch({ type: 'SET_HERO_STATS_LOADING', payload: true });
      const mockHeroStats: HeroStatsGrid = {};
      dispatch({ type: 'SET_HERO_STATS_GRID', payload: mockHeroStats });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch hero stats';
      dispatch({ type: 'SET_HERO_STATS_ERROR', payload: errorMessage });
    }
  }
});

// ============================================================================
// ACTION FUNCTIONS
// ============================================================================

const createActions = (
  dispatch: React.Dispatch<MatchAction>,
  fetchers: ReturnType<typeof createFetchers>,
  state: MatchState
) => ({
  setFilters: (filters: MatchFilters): void => {
    dispatch({ type: 'SET_FILTERS', payload: filters });
    const filteredMatches = state.matches.filter(m => 
      filters.result === 'all' || m.result === filters.result
    );
    dispatch({ type: 'SET_FILTERED_MATCHES', payload: filteredMatches });
  },

  selectMatch: (matchId: string): void => {
    dispatch({ type: 'SET_SELECTED_MATCH_ID', payload: matchId });
    fetchers.fetchMatchDetails(matchId);
  },

  hideMatch: (matchId: string): void => {
    dispatch({ type: 'HIDE_MATCH', payload: matchId });
  },

  showMatch: (matchId: string): void => {
    dispatch({ type: 'SHOW_MATCH', payload: matchId });
  },

  refreshMatches: async (): Promise<void> => {
    await fetchers.fetchMatches();
  },

  refreshMatchDetails: async (matchId: string): Promise<void> => {
    await fetchers.fetchMatchDetails(matchId);
  },

  refreshHeroStats: async (): Promise<void> => {
    await fetchers.fetchHeroStatsGrid();
  },

  clearErrors: (): void => {
    dispatch({ type: 'CLEAR_ERRORS' });
  },

  updatePreferences: (preferences: Partial<MatchPreferences>): void => {
    dispatch({ type: 'SET_PREFERENCES', payload: preferences });
  }
});

// ============================================================================
// MATCH CONTEXT PROVIDER
// ============================================================================

export const MatchProvider: React.FC<MatchContextProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(matchReducer, initialState);

  // Memoized fetchers to prevent infinite loops
  const fetchers = useMemo(() => createFetchers(dispatch), [dispatch]);

  // Memoized actions
  const actions = useMemo(() => createActions(dispatch, fetchers, state), [dispatch, fetchers, state]);

  // Initial load - only run once
  useEffect(() => {
    fetchers.fetchMatches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array to run only once

  // Context value
  const contextValue: MatchContextValue = {
    matches: state.matches,
    filteredMatches: state.filteredMatches,
    selectedMatchId: state.selectedMatchId,
    selectedMatch: state.selectedMatch,
    hiddenMatchIds: state.hiddenMatchIds,
    filters: state.filters,
    heroStatsGrid: state.heroStatsGrid,
    isLoadingMatches: state.isLoadingMatches,
    isLoadingMatchDetails: state.isLoadingMatchDetails,
    isLoadingHeroStats: state.isLoadingHeroStats,
    matchesError: state.matchesError,
    matchDetailsError: state.matchDetailsError,
    heroStatsError: state.heroStatsError,
    preferences: state.preferences,
    setFilters: actions.setFilters,
    selectMatch: actions.selectMatch,
    hideMatch: actions.hideMatch,
    showMatch: actions.showMatch,
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