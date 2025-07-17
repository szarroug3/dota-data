/**
 * use-hero-data Hook
 *
 * Custom hook for hero data management and filtering.
 * Provides a clean interface for hero-related operations including
 * data fetching, filtering, and state management.
 */

// ============================================================================
// useHeroData: UI-Focused Hero Data Hook
//
// Provides a high-level, UI-friendly interface for hero data, actions, and state.
// Aggregates context, loading, error, and convenience actions for components.
// ============================================================================

import { useCallback } from 'react';

import type { HeroContextValue } from '@/contexts/hero-context';
import { useHeroContext } from '@/contexts/hero-context';
import type { Hero, HeroFilters } from '@/types/contexts/hero-context-value';
import type { UseHeroDataReturn } from '@/types/hooks/use-hero-data';

// ============================================================================
// Internal: Selected Hero Data Selector
// ============================================================================
function useSelectedHeroData(heroes: Hero[], selectedHeroId: string | null, selectedHero: Hero | null) {
  const heroData = selectedHero || null;
  const heroStats = null; // Not implemented yet
  return { heroData, heroStats };
}

// ============================================================================
// Internal: Hero Loading & Error States
// ============================================================================
function useHeroStates(context: HeroContextValue) {
  return {
    isLoadingHeroes: context.isLoadingHeroes,
    isLoadingHeroData: context.isLoadingHeroData,
    isLoadingHeroStats: context.isLoadingHeroStats,
    heroesError: context.heroesError,
    heroDataError: context.heroDataError,
    heroStatsError: context.heroStatsError
  };
}

// ============================================================================
// Internal: Hero Actions
// ============================================================================
function useHeroActions(
  heroes: Hero[],
  setSelectedHero: (heroId: string) => void,
  setFilters: (filters: HeroFilters) => void,
  refreshHeroes: () => Promise<void>,
  refreshHero: (heroId: string) => Promise<void>,
  clearErrors: () => void
) {
  const setSelectedHeroById = useCallback((heroId: string) => {
    setSelectedHero(heroId);
  }, [setSelectedHero]);

  const setFiltersHandler = useCallback((filters: HeroFilters) => {
    setFilters(filters);
  }, [setFilters]);

  const refreshHeroesHandler = useCallback(async () => {
    await refreshHeroes();
  }, [refreshHeroes]);

  const refreshHeroById = useCallback(async (heroId: string) => {
    await refreshHero(heroId);
  }, [refreshHero]);

  const clearErrorsHandler = useCallback(() => {
    clearErrors();
  }, [clearErrors]);

  return {
    setSelectedHero: setSelectedHeroById,
    setFilters: setFiltersHandler,
    refreshHeroes: refreshHeroesHandler,
    refreshHero: refreshHeroById,
    clearErrors: clearErrorsHandler
  };
}

// ============================================================================
// Exported Hook: useHeroData
// ============================================================================

export function useHeroData(): UseHeroDataReturn {
  const context = useHeroContext();
  const {
    heroes,
    filteredHeroes,
    selectedHeroId,
    selectedHero,
    filters,
    setSelectedHero,
    setFilters,
    refreshHeroes,
    refreshHero,
    clearErrors
  } = context;

  const { heroData, heroStats } = useSelectedHeroData(heroes, selectedHeroId, selectedHero);
  const {
    isLoadingHeroes,
    isLoadingHeroData,
    isLoadingHeroStats,
    heroesError,
    heroDataError,
    heroStatsError
  } = useHeroStates(context);
  const {
    setSelectedHero: setSelectedHeroHandler,
    setFilters: setFiltersHandler,
    refreshHeroes: refreshHeroesHandler,
    refreshHero: refreshHeroHandler,
    clearErrors: clearErrorsHandler
  } = useHeroActions(heroes, setSelectedHero, setFilters, refreshHeroes, refreshHero, clearErrors);

  return {
    heroes,
    filteredHeroes,
    selectedHero: selectedHero || null,
    selectedHeroId,
    heroData,
    heroStats,
    filters,
    isLoadingHeroes,
    isLoadingHeroData,
    isLoadingHeroStats,
    heroesError,
    heroDataError,
    heroStatsError,
    setSelectedHero: setSelectedHeroHandler,
    setFilters: setFiltersHandler,
    refreshHeroes: refreshHeroesHandler,
    refreshHero: refreshHeroHandler,
    clearErrors: clearErrorsHandler
  };
} 