/**
 * Player Context Provider
 *
 * Manages player state, data fetching, filtering, and player management actions.
 * Provides centralized player data management for the entire application.
 */

import React, { createContext, useContext, useEffect, useMemo, useReducer } from 'react';

import type {
    Player,
    PlayerContextProviderProps,
    PlayerContextValue,
    PlayerData,
    PlayerFilters,
    PlayerStats
} from '@/types/contexts/player-context-value';

// ============================================================================
// CONTEXT CREATION
// ============================================================================

const PlayerContext = createContext<PlayerContextValue | undefined>(undefined);

// ============================================================================
// TYPES
// ============================================================================

interface PlayerState {
  // Player data
  players: Player[];
  filteredPlayers: Player[];
  selectedPlayerId: string | null;
  selectedPlayer: PlayerData | null;
  playerStats: PlayerStats | null;
  
  // Filters and state
  filters: PlayerFilters;
  
  // Loading states
  isLoadingPlayers: boolean;
  isLoadingPlayerData: boolean;
  isLoadingPlayerStats: boolean;
  
  // Error states
  playersError: string | null;
  playerDataError: string | null;
  playerStatsError: string | null;
}

type PlayerAction =
  | { type: 'SET_PLAYERS_LOADING'; payload: boolean }
  | { type: 'SET_PLAYERS'; payload: Player[] }
  | { type: 'SET_PLAYERS_ERROR'; payload: string | null }
  | { type: 'SET_FILTERED_PLAYERS'; payload: Player[] }
  | { type: 'SET_SELECTED_PLAYER_ID'; payload: string | null }
  | { type: 'SET_SELECTED_PLAYER'; payload: PlayerData | null }
  | { type: 'SET_PLAYER_DATA_LOADING'; payload: boolean }
  | { type: 'SET_PLAYER_DATA_ERROR'; payload: string | null }
  | { type: 'SET_PLAYER_STATS'; payload: PlayerStats | null }
  | { type: 'SET_PLAYER_STATS_LOADING'; payload: boolean }
  | { type: 'SET_PLAYER_STATS_ERROR'; payload: string | null }
  | { type: 'SET_FILTERS'; payload: PlayerFilters }
  | { type: 'ADD_PLAYER'; payload: Player }
  | { type: 'REMOVE_PLAYER'; payload: string }
  | { type: 'UPDATE_PLAYER'; payload: Player }
  | { type: 'CLEAR_ERRORS' };

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const createMockPlayer = (id: string): Player => ({
  id,
  name: `Player ${id}`,
  teamId: '1',
  role: 'Carry',
  totalMatches: 0,
  winRate: 0
});

const createMockPlayerData = (playerId: string): PlayerData => ({
  player: {
    id: playerId,
    name: 'Player Alpha',
    teamId: '1',
    role: 'Carry',
    totalMatches: 150,
    winRate: 0.65
  },
  matches: [
    {
      matchId: 'm1',
      result: 'win',
      date: '2024-06-01T12:00:00Z',
      heroId: '1',
      heroName: 'Anti-Mage',
      kills: 8,
      deaths: 2,
      assists: 4,
      lastHits: 250,
      denies: 15,
      netWorth: 25000,
      gpm: 600,
      xpm: 550,
      items: ['item1', 'item2'],
      role: 'Carry',
      team: 'radiant'
    }
  ],
  heroes: [
    {
      heroId: '1',
      heroName: 'Anti-Mage',
      gamesPlayed: 25,
      wins: 18,
      losses: 7,
      winRate: 0.72,
      averageKDA: 2.5,
      averageGPM: 580,
      averageXPM: 520,
      bestPerformance: null,
      worstPerformance: null
    }
  ],
  stats: {
    totalMatches: 150,
    totalWins: 98,
    totalLosses: 52,
    overallWinRate: 0.65,
    averageKDA: 2.3,
    averageGPM: 520,
    averageXPM: 480,
    mostPlayedHero: null,
    bestHero: null,
    preferredRole: 'Carry',
    averageMatchDuration: 2400
  },
  trends: {
    recentPerformance: [],
    heroProgression: [],
    roleEvolution: []
  }
});

const createMockPlayerStats = (): PlayerStats => ({
  totalMatches: 150,
  totalWins: 98,
  totalLosses: 52,
  overallWinRate: 0.65,
  averageKDA: 2.3,
  averageGPM: 520,
  averageXPM: 480,
  mostPlayedHero: {
    heroId: '1',
    heroName: 'Anti-Mage',
    gamesPlayed: 25,
    wins: 18,
    losses: 7,
    winRate: 0.72,
    averageKDA: 2.5,
    averageGPM: 580,
    averageXPM: 520,
    bestPerformance: null,
    worstPerformance: null
  },
  bestHero: {
    heroId: '2',
    heroName: 'Invoker',
    gamesPlayed: 20,
    wins: 15,
    losses: 5,
    winRate: 0.75,
    averageKDA: 3.2,
    averageGPM: 620,
    averageXPM: 580,
    bestPerformance: null,
    worstPerformance: null
  },
  preferredRole: 'Carry',
  averageMatchDuration: 2400
});

const handleLoadingStates = (state: PlayerState, action: PlayerAction): PlayerState => {
  switch (action.type) {
    case 'SET_PLAYERS_LOADING':
      return { ...state, isLoadingPlayers: action.payload };
    case 'SET_PLAYER_DATA_LOADING':
      return { ...state, isLoadingPlayerData: action.payload };
    case 'SET_PLAYER_STATS_LOADING':
      return { ...state, isLoadingPlayerStats: action.payload };
    default:
      return state;
  }
};

const handleErrorStates = (state: PlayerState, action: PlayerAction): PlayerState => {
  switch (action.type) {
    case 'SET_PLAYERS_ERROR':
      return { ...state, playersError: action.payload, isLoadingPlayers: false };
    case 'SET_PLAYER_DATA_ERROR':
      return { ...state, playerDataError: action.payload, isLoadingPlayerData: false };
    case 'SET_PLAYER_STATS_ERROR':
      return { ...state, playerStatsError: action.payload, isLoadingPlayerStats: false };
    case 'CLEAR_ERRORS':
      return {
        ...state,
        playersError: null,
        playerDataError: null,
        playerStatsError: null
      };
    default:
      return state;
  }
};

const handleDataStates = (state: PlayerState, action: PlayerAction): PlayerState => {
  switch (action.type) {
    case 'SET_PLAYERS':
      return { ...state, players: action.payload, isLoadingPlayers: false };
    case 'SET_FILTERED_PLAYERS':
      return { ...state, filteredPlayers: action.payload };
    case 'SET_SELECTED_PLAYER':
      return { ...state, selectedPlayer: action.payload };
    case 'SET_PLAYER_STATS':
      return { ...state, playerStats: action.payload };
    default:
      return state;
  }
};

const handleSelectionStates = (state: PlayerState, action: PlayerAction): PlayerState => {
  switch (action.type) {
    case 'SET_SELECTED_PLAYER_ID':
      return { ...state, selectedPlayerId: action.payload };
    case 'SET_FILTERS':
      return { ...state, filters: action.payload };
    case 'ADD_PLAYER':
      return { ...state, players: [...state.players, action.payload] };
    case 'REMOVE_PLAYER':
      return { ...state, players: state.players.filter(p => p.id !== action.payload) };
    case 'UPDATE_PLAYER':
      return { ...state, players: state.players.map(p => p.id === action.payload.id ? action.payload : p) };
    default:
      return state;
  }
};

// ============================================================================
// REDUCER
// ============================================================================

const playerReducer = (state: PlayerState, action: PlayerAction): PlayerState => {
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

const initialState: PlayerState = {
  // Player data
  players: [],
  filteredPlayers: [],
  selectedPlayerId: null,
  selectedPlayer: null,
  playerStats: null,
  
  // Filters and state
  filters: {
    dateRange: { start: null, end: null },
    heroes: [],
    roles: [],
    result: 'all',
    performance: {
      minKDA: null,
      minGPM: null,
      minXPM: null
    }
  },
  
  // Loading states
  isLoadingPlayers: false,
  isLoadingPlayerData: false,
  isLoadingPlayerStats: false,
  
  // Error states
  playersError: null,
  playerDataError: null,
  playerStatsError: null
};

// ============================================================================
// FETCHER FUNCTIONS
// ============================================================================

const createFetchers = (dispatch: React.Dispatch<PlayerAction>) => ({
  fetchPlayers: async (): Promise<void> => {
    try {
      dispatch({ type: 'SET_PLAYERS_LOADING', payload: true });
      const mockPlayers: Player[] = [
        {
          id: 'p1',
          name: 'Player Alpha',
          teamId: '1',
          role: 'Carry',
          totalMatches: 150,
          winRate: 0.65
        },
        {
          id: 'p2',
          name: 'Player Beta',
          teamId: '1',
          role: 'Support',
          totalMatches: 120,
          winRate: 0.58
        }
      ];
      dispatch({ type: 'SET_PLAYERS', payload: mockPlayers });
      dispatch({ type: 'SET_FILTERED_PLAYERS', payload: mockPlayers });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch players';
      dispatch({ type: 'SET_PLAYERS_ERROR', payload: errorMessage });
    }
  },

  fetchPlayerData: async (): Promise<void> => {
    try {
      dispatch({ type: 'SET_PLAYER_DATA_LOADING', payload: true });
      const mockPlayerData = createMockPlayerData('p1');
      dispatch({ type: 'SET_SELECTED_PLAYER', payload: mockPlayerData });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch player data';
      dispatch({ type: 'SET_PLAYER_DATA_ERROR', payload: errorMessage });
    }
  },

  fetchPlayerStats: async (): Promise<void> => {
    try {
      dispatch({ type: 'SET_PLAYER_STATS_LOADING', payload: true });
      const mockPlayerStats = createMockPlayerStats();
      dispatch({ type: 'SET_PLAYER_STATS', payload: mockPlayerStats });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch player stats';
      dispatch({ type: 'SET_PLAYER_STATS_ERROR', payload: errorMessage });
    }
  }
});

// ============================================================================
// ACTION FUNCTIONS
// ============================================================================

const createActions = (
  dispatch: React.Dispatch<PlayerAction>,
  fetchers: ReturnType<typeof createFetchers>,
  state: PlayerState
) => ({
  setSelectedPlayer: (playerId: string): void => {
    dispatch({ type: 'SET_SELECTED_PLAYER_ID', payload: playerId });
    fetchers.fetchPlayerData();
  },

  setFilters: (filters: PlayerFilters): void => {
    dispatch({ type: 'SET_FILTERS', payload: filters });
    // Apply filters to players (mock: just return all for now)
    const filtered = state.players.filter(() => true);
    dispatch({ type: 'SET_FILTERED_PLAYERS', payload: filtered });
  },

  addPlayer: async (playerId: string): Promise<void> => {
    const newPlayer = createMockPlayer(playerId);
    dispatch({ type: 'ADD_PLAYER', payload: newPlayer });
  },

  removePlayer: async (playerId: string): Promise<void> => {
    dispatch({ type: 'REMOVE_PLAYER', payload: playerId });
  },

  refreshPlayer: async (playerId: string): Promise<void> => {
    // Set the selected player ID first, then fetch data
    dispatch({ type: 'SET_SELECTED_PLAYER_ID', payload: playerId });
    await fetchers.fetchPlayerData();
    await fetchers.fetchPlayerStats();
  },

  clearErrors: (): void => {
    dispatch({ type: 'CLEAR_ERRORS' });
  }
});

// ============================================================================
// PLAYER CONTEXT PROVIDER
// ============================================================================

export const PlayerProvider: React.FC<PlayerContextProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(playerReducer, initialState);

  // Memoized fetchers to prevent infinite loops
  const fetchers = useMemo(() => createFetchers(dispatch), [dispatch]);

  // Memoized actions
  const actions = useMemo(() => createActions(dispatch, fetchers, state), [dispatch, fetchers, state]);

  // Initial load - only run once
  useEffect(() => {
    fetchers.fetchPlayers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array to run only once

  // Context value
  const contextValue: PlayerContextValue = {
    players: state.players,
    filteredPlayers: state.filteredPlayers,
    selectedPlayerId: state.selectedPlayerId,
    selectedPlayer: state.selectedPlayer,
    playerStats: state.playerStats,
    filters: state.filters,
    isLoadingPlayers: state.isLoadingPlayers,
    isLoadingPlayerData: state.isLoadingPlayerData,
    isLoadingPlayerStats: state.isLoadingPlayerStats,
    playersError: state.playersError,
    playerDataError: state.playerDataError,
    playerStatsError: state.playerStatsError,
    setSelectedPlayer: actions.setSelectedPlayer,
    setFilters: actions.setFilters,
    addPlayer: actions.addPlayer,
    removePlayer: actions.removePlayer,
    refreshPlayer: actions.refreshPlayer,
    clearErrors: actions.clearErrors
  };

  return (
    <PlayerContext.Provider value={contextValue}>
      {children}
    </PlayerContext.Provider>
  );
};

// ============================================================================
// HOOK
// ============================================================================

export const usePlayerContext = (): PlayerContextValue => {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error('usePlayerContext must be used within a PlayerProvider');
  }
  return context;
}; 