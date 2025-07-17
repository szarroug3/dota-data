"use client";

/**
 * Hero Context
 * 
 * Manages hero data and provides actions for hero operations.
 * Handles hero data filtering, sorting, and aggregation.
 * Uses hero data fetching context for data retrieval.
 */

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

import { useHeroDataFetching } from '@/contexts/hero-data-fetching-context';
import type { Hero, HeroContextProviderProps, HeroFilters } from '@/types/contexts/hero-context-value';
import type { OpenDotaHero } from '@/types/external-apis';

// ============================================================================
// DEFAULTS
// ============================================================================

const DEFAULT_HERO_FILTERS: HeroFilters = {
  primaryAttribute: [],
  attackType: [],
  roles: [],
  complexity: [],
  difficulty: [],
  pickRate: {
    min: null,
    max: null
  },
  winRate: {
    min: null,
    max: null
  }
};

// ============================================================================
// HELPERS
// ============================================================================

const findHero = (heroList: Hero[], heroId: string): Hero | undefined => {
  return heroList.find(hero => hero.id === heroId);
};

const heroExists = (heroList: Hero[], heroId: string): boolean => {
  return heroList.some(hero => hero.id === heroId);
};

const areAllHeroFiltersEmpty = (filters: HeroFilters): boolean => {
  return (
    filters.primaryAttribute.length === 0 &&
    filters.attackType.length === 0 &&
    filters.roles.length === 0 &&
    filters.complexity.length === 0 &&
    filters.difficulty.length === 0 &&
    filters.pickRate.min === null &&
    filters.pickRate.max === null &&
    filters.winRate.min === null &&
    filters.winRate.max === null
  );
};

const applyHeroFilters = (heroList: Hero[], filters: HeroFilters): Hero[] => {
  return heroList.filter(hero => {
    // Primary attribute filter
    if (filters.primaryAttribute.length > 0 && !filters.primaryAttribute.includes(hero.primaryAttribute)) {
      return false;
    }
    
    // Attack type filter
    if (filters.attackType.length > 0 && !filters.attackType.includes(hero.attackType)) {
      return false;
    }
    
    // Roles filter
    if (filters.roles.length > 0 && !filters.roles.some(role => hero.roles.includes(role))) {
      return false;
    }
    
    // Complexity filter
    if (filters.complexity.length > 0 && !filters.complexity.includes(hero.complexity)) {
      return false;
    }
    
    // For now, skip pickRate and winRate filters since we don't have this data
    // TODO: Implement when we have hero stats data
    
    return true;
  });
};

const convertOpenDotaHeroToHero = (openDotaHero: OpenDotaHero): Hero => {
  // Convert primary attribute string to proper type
  const primaryAttribute = openDotaHero.primary_attr as 'strength' | 'agility' | 'intelligence';
  
  // Convert attack type string to proper type
  const attackType = openDotaHero.attack_type as 'melee' | 'ranged';
  
  return {
    id: openDotaHero.id.toString(),
    name: openDotaHero.name,
    localizedName: openDotaHero.localized_name,
    primaryAttribute,
    attackType,
    roles: openDotaHero.roles,
    complexity: 2, // Default complexity since OpenDotaHero doesn't have this
    imageUrl: `https://dota2protracker.com/static/heroes/${openDotaHero.name}_vert.jpg`
  };
};

// ============================================================================
// CONTEXT
// ============================================================================

export interface HeroContextValue {
  // Hero data
  heroes: Hero[];
  filteredHeroes: Hero[];
  selectedHeroId: string | null;
  selectedHero: Hero | null;
  
  // Filters and state
  filters: HeroFilters;
  
  // Loading states
  isLoadingHeroes: boolean;
  isLoadingHeroData: boolean;
  isLoadingHeroStats: boolean;
  
  // Error states
  heroesError: string | null;
  heroDataError: string | null;
  heroStatsError: string | null;
  
  // Actions
  setSelectedHero: (heroId: string) => void;
  setFilters: (filters: HeroFilters) => void;
  refreshHeroes: () => Promise<void>;
  refreshHero: (heroId: string) => Promise<void>;
  clearErrors: () => void;
}

const HeroContext = createContext<HeroContextValue | undefined>(undefined);

// ============================================================================
// CUSTOM HOOKS
// ============================================================================

const useHeroState = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return {
    isLoading,
    setIsLoading,
    error,
    setError
  };
};

const useHeroUtilities = (heroes: Hero[]) => {
  const heroExistsCallback = useCallback((heroId: string) => {
    return heroExists(heroes, heroId);
  }, [heroes]);

  const findHeroCallback = useCallback((heroId: string): Hero | undefined => {
    return findHero(heroes, heroId);
  }, [heroes]);

  const areAllHeroFiltersEmptyCallback = useCallback((filters: HeroFilters): boolean => {
    return areAllHeroFiltersEmpty(filters);
  }, []);

  const applyHeroFiltersCallback = useCallback((heroList: Hero[], filters: HeroFilters): Hero[] => {
    return applyHeroFilters(heroList, filters);
  }, []);

  return {
    heroExists: heroExistsCallback,
    findHero: findHeroCallback,
    areAllHeroFiltersEmpty: areAllHeroFiltersEmptyCallback,
    applyHeroFilters: applyHeroFiltersCallback
  };
};

// ============================================================================
// OPERATIONS
// ============================================================================

const useRefreshHeroes = (
  setHeroes: (heroes: Hero[]) => void,
  setFilteredHeroes: (heroes: Hero[]) => void,
  filters: HeroFilters,
  setIsLoading: (loading: boolean) => void,
  setError: (error: string | null) => void,
  areAllHeroFiltersEmpty: (filters: HeroFilters) => boolean,
  applyHeroFilters: (heroList: Hero[], filters: HeroFilters) => Hero[],
  fetchHeroesData: () => Promise<OpenDotaHero[] | { error: string }>
) => {
  return useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchHeroesData();
      if ('error' in result) {
        throw new Error(result.error);
      }
      
      // Convert OpenDotaHero to Hero format
      const convertedHeroes: Hero[] = result.map(convertOpenDotaHeroToHero);
      
      setHeroes(convertedHeroes);
      
      // Apply current filters
      const isAllFiltersEmpty = areAllHeroFiltersEmpty(filters);
      if (isAllFiltersEmpty) {
        setFilteredHeroes(convertedHeroes);
      } else {
        const filtered = applyHeroFilters(convertedHeroes, filters);
        setFilteredHeroes(filtered);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh heroes';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [filters, setHeroes, setFilteredHeroes, areAllHeroFiltersEmpty, applyHeroFilters, fetchHeroesData, setIsLoading, setError]);
};

const useRefreshHero = (
  heroExists: (heroId: string) => boolean,
  refreshHeroes: () => Promise<void>,
  setIsLoading: (loading: boolean) => void,
  setError: (error: string | null) => void
) => {
  return useCallback(async (heroId: string) => {
    if (!heroExists(heroId)) {
      throw new Error('Hero not found');
    }

    setIsLoading(true);
    setError(null);

    try {
      // For now, we'll just refresh all heroes since individual hero data isn't implemented
      await refreshHeroes();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh hero';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [heroExists, refreshHeroes, setIsLoading, setError]);
};

const useSetSelectedHero = (
  findHero: (heroId: string) => Hero | undefined,
  setSelectedHeroId: (heroId: string | null) => void,
  setSelectedHero: (hero: Hero | null) => void
) => {
  return useCallback(async (heroId: string | null) => {
    if (!heroId) {
      setSelectedHeroId(null);
      setSelectedHero(null);
      return;
    }
    const hero = findHero(heroId);
    if (!hero) {
      throw new Error('Hero not found');
    }
    setSelectedHeroId(heroId);
    setSelectedHero(hero);
  }, [findHero, setSelectedHeroId, setSelectedHero]);
};

const useSetFilters = (
  heroes: Hero[],
  setFilters: (filters: HeroFilters) => void,
  setFilteredHeroes: (heroes: Hero[]) => void,
  areAllHeroFiltersEmpty: (filters: HeroFilters) => boolean,
  applyHeroFilters: (heroList: Hero[], filters: HeroFilters) => Hero[]
) => {
  return useCallback((newFilters: HeroFilters) => {
    setFilters(newFilters);
    
    // Apply new filters to current heroes
    const isAllFiltersEmpty = areAllHeroFiltersEmpty(newFilters);
    if (isAllFiltersEmpty) {
      setFilteredHeroes(heroes);
    } else {
      const filtered = applyHeroFilters(heroes, newFilters);
      setFilteredHeroes(filtered);
    }
  }, [heroes, setFilters, setFilteredHeroes, areAllHeroFiltersEmpty, applyHeroFilters]);
};

const useHeroOperations = (
  heroes: Hero[],
  setHeroes: (heroes: Hero[]) => void,
  filteredHeroes: Hero[],
  setFilteredHeroes: (heroes: Hero[]) => void,
  selectedHeroId: string | null,
  setSelectedHeroId: (heroId: string | null) => void,
  selectedHero: Hero | null,
  setSelectedHero: (hero: Hero | null) => void,
  filters: HeroFilters,
  setFilters: (filters: HeroFilters) => void,
  setIsLoading: (loading: boolean) => void,
  setError: (error: string | null) => void,
  heroExists: (heroId: string) => boolean,
  findHero: (heroId: string) => Hero | undefined,
  areAllHeroFiltersEmpty: (filters: HeroFilters) => boolean,
  applyHeroFilters: (heroList: Hero[], filters: HeroFilters) => Hero[],
  fetchHeroesData: () => Promise<OpenDotaHero[] | { error: string }>
) => {
  const refreshHeroes = useRefreshHeroes(
    setHeroes,
    setFilteredHeroes,
    filters,
    setIsLoading,
    setError,
    areAllHeroFiltersEmpty,
    applyHeroFilters,
    fetchHeroesData
  );

  const refreshHero = useRefreshHero(
    heroExists,
    refreshHeroes,
    setIsLoading,
    setError
  );

  const setSelectedHeroHandler = useSetSelectedHero(
    findHero,
    setSelectedHeroId,
    setSelectedHero
  );

  const setFiltersHandler = useSetFilters(
    heroes,
    setFilters,
    setFilteredHeroes,
    areAllHeroFiltersEmpty,
    applyHeroFilters
  );

  return {
    refreshHeroes,
    refreshHero,
    setSelectedHero: setSelectedHeroHandler,
    setFilters: setFiltersHandler
  };
};

const useErrorHandling = (setError: (error: string | null) => void) => {
  const clearErrors = useCallback(() => {
    setError(null);
  }, [setError]);

  return {
    clearErrors
  };
};

// ============================================================================
// PROVIDER IMPLEMENTATION
// ============================================================================

export const HeroProvider: React.FC<HeroContextProviderProps> = ({ children }) => {
  // State
  const { isLoading, setIsLoading, error, setError } = useHeroState();
  
  // Hero data state
  const [heroes, setHeroes] = useState<Hero[]>([]);
  const [filteredHeroes, setFilteredHeroes] = useState<Hero[]>([]);
  const [selectedHeroId, setSelectedHeroId] = useState<string | null>(null);
  const [selectedHero, setSelectedHero] = useState<Hero | null>(null);
  const [filters, setFilters] = useState<HeroFilters>(DEFAULT_HERO_FILTERS);

  // Contexts
  const { fetchHeroesData } = useHeroDataFetching();

  // Utilities
  const { heroExists, findHero, areAllHeroFiltersEmpty, applyHeroFilters } = useHeroUtilities(heroes);

  // Operations
  const {
    refreshHeroes,
    refreshHero,
    setSelectedHero: setSelectedHeroHandler,
    setFilters: setFiltersHandler
  } = useHeroOperations(
    heroes,
    setHeroes,
    filteredHeroes,
    setFilteredHeroes,
    selectedHeroId,
    setSelectedHeroId,
    selectedHero,
    setSelectedHero,
    filters,
    setFilters,
    setIsLoading,
    setError,
    heroExists,
    findHero,
    areAllHeroFiltersEmpty,
    applyHeroFilters,
    fetchHeroesData
  );

  const { clearErrors } = useErrorHandling(setError);

  // Fetch heroes on mount
  useEffect(() => {
    refreshHeroes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Context value
  const contextValue: HeroContextValue = {
    heroes,
    filteredHeroes,
    selectedHeroId,
    selectedHero,
    filters,
    isLoadingHeroes: isLoading,
    isLoadingHeroData: false, // Not implemented yet
    isLoadingHeroStats: false, // Not implemented yet
    heroesError: error,
    heroDataError: null, // Not implemented yet
    heroStatsError: null, // Not implemented yet
    refreshHeroes,
    refreshHero,
    setSelectedHero: setSelectedHeroHandler,
    setFilters: setFiltersHandler,
    clearErrors
  };

  return (
    <HeroContext.Provider value={contextValue}>
      {children}
    </HeroContext.Provider>
  );
};

// ============================================================================
// HOOK
// ============================================================================

export const useHeroContext = (): HeroContextValue => {
  const context = useContext(HeroContext);
  
  if (context === undefined) {
    throw new Error('useHeroContext must be used within a HeroProvider');
  }
  
  return context;
}; 