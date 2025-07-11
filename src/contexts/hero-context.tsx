/**
 * Hero Context Provider
 *
 * Manages hero state, data fetching, filtering, and hero management actions.
 * Provides centralized hero data management for the entire application.
 */

import React, { createContext, useCallback, useContext, useEffect, useReducer } from 'react';

import type {
  Hero,
  HeroContextProviderProps,
  HeroContextValue,
  HeroData,
  HeroFilters,
  HeroStats
} from '@/types/contexts/hero-context-value';

// ============================================================================
// STATE TYPES
// ============================================================================

interface HeroState {
  heroes: Hero[];
  filteredHeroes: Hero[];
  selectedHeroId: string | null;
  selectedHero: HeroData | null;
  heroStats: HeroStats | null;
  filters: HeroFilters;
  isLoadingHeroes: boolean;
  isLoadingHeroData: boolean;
  isLoadingHeroStats: boolean;
  heroesError: string | null;
  heroDataError: string | null;
  heroStatsError: string | null;
}

// ============================================================================
// ACTION TYPES
// ============================================================================

type HeroAction =
  | { type: 'SET_HEROES_LOADING'; payload: boolean }
  | { type: 'SET_HEROES'; payload: Hero[] }
  | { type: 'SET_HEROES_ERROR'; payload: string | null }
  | { type: 'SET_FILTERED_HEROES'; payload: Hero[] }
  | { type: 'SET_SELECTED_HERO_ID'; payload: string | null }
  | { type: 'SET_SELECTED_HERO'; payload: HeroData | null }
  | { type: 'SET_HERO_DATA_LOADING'; payload: boolean }
  | { type: 'SET_HERO_DATA_ERROR'; payload: string | null }
  | { type: 'SET_HERO_STATS'; payload: HeroStats | null }
  | { type: 'SET_HERO_STATS_LOADING'; payload: boolean }
  | { type: 'SET_HERO_STATS_ERROR'; payload: string | null }
  | { type: 'SET_FILTERS'; payload: HeroFilters }
  | { type: 'CLEAR_ERRORS' };

// ============================================================================
// REDUCER
// ============================================================================

// Helper to check if all hero filters are empty
function areAllHeroFiltersEmpty(filters: HeroFilters): boolean {
  return (
    filters.primaryAttribute.length === 0 &&
    filters.attackType.length === 0 &&
    filters.roles.length === 0 &&
    filters.complexity.length === 0 &&
    filters.difficulty.length === 0 &&
    filters.pickRate.min == null && filters.pickRate.max == null &&
    filters.winRate.min == null && filters.winRate.max == null
  );
}

const handleHeroesActions = (state: HeroState, action: HeroAction): HeroState => {
  switch (action.type) {
    case 'SET_HEROES_LOADING':
      return { ...state, isLoadingHeroes: action.payload };
    case 'SET_HEROES': {
      const allHeroes = action.payload;
      const filters = state.filters;
      const isAllFiltersEmpty = areAllHeroFiltersEmpty(filters);
      return {
        ...state,
        heroes: allHeroes,
        filteredHeroes: isAllFiltersEmpty ? allHeroes : [],
        isLoadingHeroes: false
      };
    }
    case 'SET_HEROES_ERROR':
      return { ...state, heroesError: action.payload, isLoadingHeroes: false };
    case 'SET_FILTERED_HEROES':
      return { ...state, filteredHeroes: action.payload };
    default:
      return state;
  }
};

const handleHeroDataActions = (state: HeroState, action: HeroAction): HeroState => {
  switch (action.type) {
    case 'SET_SELECTED_HERO_ID':
      return { ...state, selectedHeroId: action.payload };
    case 'SET_SELECTED_HERO':
      return { ...state, selectedHero: action.payload };
    case 'SET_HERO_DATA_LOADING':
      return { ...state, isLoadingHeroData: action.payload };
    case 'SET_HERO_DATA_ERROR':
      return { ...state, heroDataError: action.payload, isLoadingHeroData: false };
    default:
      return state;
  }
};

const handleHeroStatsActions = (state: HeroState, action: HeroAction): HeroState => {
  switch (action.type) {
    case 'SET_HERO_STATS':
      return { ...state, heroStats: action.payload, isLoadingHeroStats: false };
    case 'SET_HERO_STATS_LOADING':
      return { ...state, isLoadingHeroStats: action.payload };
    case 'SET_HERO_STATS_ERROR':
      return { ...state, heroStatsError: action.payload, isLoadingHeroStats: false };
    default:
      return state;
  }
};

const handleFilterActions = (state: HeroState, action: HeroAction): HeroState => {
  switch (action.type) {
    case 'SET_FILTERS':
      return { ...state, filters: action.payload };
    case 'CLEAR_ERRORS':
      return {
        ...state,
        heroesError: null,
        heroDataError: null,
        heroStatsError: null
      };
    default:
      return state;
  }
};

// Handler map for reducer actions
const actionHandlers = {
  'SET_HEROES_LOADING': handleHeroesActions,
  'SET_HEROES': handleHeroesActions,
  'SET_HEROES_ERROR': handleHeroesActions,
  'SET_FILTERED_HEROES': handleHeroesActions,
  'SET_SELECTED_HERO_ID': handleHeroDataActions,
  'SET_SELECTED_HERO': handleHeroDataActions,
  'SET_HERO_DATA_LOADING': handleHeroDataActions,
  'SET_HERO_DATA_ERROR': handleHeroDataActions,
  'SET_HERO_STATS': handleHeroStatsActions,
  'SET_HERO_STATS_LOADING': handleHeroStatsActions,
  'SET_HERO_STATS_ERROR': handleHeroStatsActions,
  'SET_FILTERS': handleFilterActions,
  'CLEAR_ERRORS': handleFilterActions
} as const;

const heroReducer = (state: HeroState, action: HeroAction): HeroState => {
  const handler = actionHandlers[action.type as keyof typeof actionHandlers];
  return handler ? handler(state, action) : state;
};

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialState: HeroState = {
  heroes: [],
  filteredHeroes: [],
  selectedHeroId: null,
  selectedHero: null,
  heroStats: null,
  filters: {
    primaryAttribute: [],
    attackType: [],
    roles: [],
    complexity: [],
    difficulty: [],
    pickRate: { min: null, max: null },
    winRate: { min: null, max: null }
  },
  isLoadingHeroes: false,
  isLoadingHeroData: false,
  isLoadingHeroStats: false,
  heroesError: null,
  heroDataError: null,
  heroStatsError: null
};

// ============================================================================
// CONTEXT CREATION
// ============================================================================

const HeroContext = createContext<HeroContextValue | undefined>(undefined);

// ============================================================================
// PROVIDER
// ============================================================================

// Helper: Initial data loading effect
function useInitialHeroLoad(fetchHeroes: () => Promise<void>) {
  useEffect(() => {
    fetchHeroes();
  }, [fetchHeroes]);
}

// Helper to return mock heroes
function getMockHeroes(): Hero[] {
  return [
    {
      id: '1',
      name: 'Anti-Mage',
      localizedName: 'Anti-Mage',
      primaryAttribute: 'agility',
      attackType: 'melee',
      roles: ['Carry', 'Escape'],
      complexity: 2,
      imageUrl: '/heroes/anti-mage.png'
    },
    {
      id: '2',
      name: 'Invoker',
      localizedName: 'Invoker',
      primaryAttribute: 'intelligence',
      attackType: 'ranged',
      roles: ['Carry', 'Nuker', 'Disabler'],
      complexity: 3,
      imageUrl: '/heroes/invoker.png'
    }
  ];
}

// Standalone async function for fetching heroes
async function fetchHeroesData(dispatch: React.Dispatch<HeroAction>): Promise<void> {
  try {
    dispatch({ type: 'SET_HEROES_LOADING', payload: true });
    await new Promise(resolve => setTimeout(resolve, 10));
    const mockHeroes: Hero[] = getMockHeroes();
    dispatch({ type: 'SET_HEROES', payload: mockHeroes });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch heroes';
    dispatch({ type: 'SET_HEROES_ERROR', payload: errorMessage });
  }
}

// Simple hook that returns the async function
function useFetchHeroes(dispatch: React.Dispatch<HeroAction>) {
  return useCallback(() => fetchHeroesData(dispatch), [dispatch]);
}

// Helper to create mock hero data
function getMockHeroData(heroId: string, heroes: Hero[]): HeroData {
  const hero = heroes.find(h => h.id === heroId) || {
    id: heroId,
    name: 'Unknown Hero',
    localizedName: 'Unknown Hero',
    primaryAttribute: 'strength',
    attackType: 'melee',
    roles: [],
    complexity: 1,
    imageUrl: ''
  };
  
  return {
    hero,
    stats: {
      totalGames: 100,
      totalWins: 60,
      totalLosses: 40,
      winRate: 0.6,
      averageKDA: 2.5,
      averageGPM: 500,
      averageXPM: 480,
      averageMatchDuration: 2400,
      pickRate: 0.15,
      banRate: 0.05,
      preferredRoles: hero.roles,
      counters: [],
      synergies: []
    },
    meta: {
      pickRate: 0.15,
      banRate: 0.05,
      winRate: 0.6,
      averageKDA: 2.5,
      averageGPM: 500,
      averageXPM: 480,
      averageMatchDuration: 2400,
      preferredRoles: hero.roles,
      difficulty: 'medium'
    },
    counters: [],
    synergies: []
  };
}

// Standalone async function for fetching hero data
async function fetchHeroDataAndDispatch(heroId: string, state: HeroState, dispatch: React.Dispatch<HeroAction>): Promise<void> {
  try {
    dispatch({ type: 'SET_HERO_DATA_LOADING', payload: true });
    await new Promise(resolve => setTimeout(resolve, 10));
    const mockHeroData: HeroData = getMockHeroData(heroId, state.heroes);
    dispatch({ type: 'SET_SELECTED_HERO', payload: mockHeroData });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch hero data';
    dispatch({ type: 'SET_HERO_DATA_ERROR', payload: errorMessage });
  }
}

// Simple hook that returns the async function
function useFetchHeroData(state: HeroState, dispatch: React.Dispatch<HeroAction>) {
  return useCallback((heroId: string) => fetchHeroDataAndDispatch(heroId, state, dispatch), [dispatch, state]);
}

// Helper to create mock hero stats
function getMockHeroStats(): HeroStats {
  return {
    totalGames: 100,
    totalWins: 60,
    totalLosses: 40,
    winRate: 0.6,
    averageKDA: 2.5,
    averageGPM: 500,
    averageXPM: 480,
    averageMatchDuration: 2400,
    pickRate: 0.15,
    banRate: 0.05,
    preferredRoles: ['Carry'],
    counters: [],
    synergies: []
  };
}

// Standalone async function for fetching hero stats
async function fetchHeroStatsAndDispatch(dispatch: React.Dispatch<HeroAction>): Promise<void> {
  try {
    dispatch({ type: 'SET_HERO_STATS_LOADING', payload: true });
    await new Promise(resolve => setTimeout(resolve, 10));
    const mockHeroStats: HeroStats = getMockHeroStats();
    dispatch({ type: 'SET_HERO_STATS', payload: mockHeroStats });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch hero stats';
    dispatch({ type: 'SET_HERO_STATS_ERROR', payload: errorMessage });
  }
}

// Simple hook that returns the async function
function useFetchHeroStats(dispatch: React.Dispatch<HeroAction>) {
  return useCallback(() => fetchHeroStatsAndDispatch(dispatch), [dispatch]);
}

// Helper to apply hero filters
function applyHeroFilters(heroes: Hero[], filters: HeroFilters): Hero[] {
  if (areAllHeroFiltersEmpty(filters)) {
    return heroes;
  }
  // For now, return empty array when filters are applied
  // This can be expanded with actual filtering logic later
  return [];
}

function useHeroActions(state: HeroState, dispatch: React.Dispatch<HeroAction>) {
  const fetchHeroes = useFetchHeroes(dispatch);
  const fetchHeroData = useFetchHeroData(state, dispatch);
  const fetchHeroStats = useFetchHeroStats(dispatch);

  // Actions
  const setSelectedHero = useCallback((heroId: string): void => {
    dispatch({ type: 'SET_SELECTED_HERO_ID', payload: heroId });
    fetchHeroData(heroId);
  }, [dispatch, fetchHeroData]);

  const setFilters = useCallback((filters: HeroFilters): void => {
    dispatch({ type: 'SET_FILTERS', payload: filters });
    const filtered = applyHeroFilters(state.heroes, filters);
    dispatch({ type: 'SET_FILTERED_HEROES', payload: filtered });
  }, [dispatch, state.heroes]);

  const refreshHeroes = useCallback(async (): Promise<void> => {
    await fetchHeroes();
  }, [fetchHeroes]);

  const refreshHero = useCallback(async (): Promise<void> => {
    await fetchHeroStats();
  }, [fetchHeroStats]);

  const clearErrors = useCallback((): void => {
    dispatch({ type: 'CLEAR_ERRORS' });
  }, [dispatch]);

  return {
    fetchHeroes,
    fetchHeroData,
    fetchHeroStats,
    setSelectedHero,
    setFilters,
    refreshHeroes,
    refreshHero,
    clearErrors
  };
}

export const HeroProvider: React.FC<HeroContextProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(heroReducer, initialState);
  const actions = useHeroActions(state, dispatch);

  const contextValue: HeroContextValue = {
    heroes: state.heroes,
    filteredHeroes: state.filteredHeroes,
    selectedHeroId: state.selectedHeroId,
    selectedHero: state.selectedHero,
    heroStats: state.heroStats,
    filters: state.filters,
    isLoadingHeroes: state.isLoadingHeroes,
    isLoadingHeroData: state.isLoadingHeroData,
    isLoadingHeroStats: state.isLoadingHeroStats,
    heroesError: state.heroesError,
    heroDataError: state.heroDataError,
    heroStatsError: state.heroStatsError,
    setSelectedHero: actions.setSelectedHero,
    setFilters: actions.setFilters,
    refreshHeroes: actions.refreshHeroes,
    refreshHero: actions.refreshHero,
    clearErrors: actions.clearErrors
  };

  // Initial load
  useInitialHeroLoad(actions.fetchHeroes);

  return (
    <HeroContext.Provider value={contextValue}>
      {children}
    </HeroContext.Provider>
  );
};

export const useHeroContext = (): HeroContextValue => {
  const context = useContext(HeroContext);
  if (context === undefined) {
    throw new Error('useHeroContext must be used within a HeroProvider');
  }
  return context;
}; 