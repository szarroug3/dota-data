/**
 * use-hero-data Hook
 *
 * Custom hook for hero data management and filtering.
 * Provides a clean interface for hero-related operations including
 * data fetching, filtering, and state management.
 */

import { useCallback, useEffect, useMemo } from 'react';

import { useHeroContext } from '@/contexts/hero-context';
import type { Hero, HeroFilters } from '@/types/contexts/hero-context-value';

// ============================================================================
// HOOK RETURN TYPE
// ============================================================================

export interface UseHeroDataReturn {
  heroes: Hero[];
  filteredHeroes: Hero[];
  loading: boolean;
  isLoading: boolean; // Add alias for compatibility
  error: string | null;
  filters: HeroFilters;
  actions: {
    setFilters: (filters: HeroFilters) => void;
    refreshHeroes: (force?: boolean) => Promise<void>;
    clearError: () => void;
  };
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export function useHeroData(): UseHeroDataReturn {
  const context = useHeroContext();

  // ============================================================================
  // DERIVED STATE
  // ============================================================================

  const loading = useMemo(() => {
    return context.isLoadingHeroes || context.isLoadingHeroData || context.isLoadingHeroStats;
  }, [context.isLoadingHeroes, context.isLoadingHeroData, context.isLoadingHeroStats]);

  const error = useMemo(() => {
    return context.heroesError || context.heroDataError || context.heroStatsError;
  }, [context.heroesError, context.heroDataError, context.heroStatsError]);

  // ============================================================================
  // ACTIONS
  // ============================================================================

  const setFilters = useCallback((filters: HeroFilters) => {
    context.setFilters(filters);
  }, [context]);

  const refreshHeroes = useCallback(async () => {
    try {
      await context.refreshHeroes();
    } catch (err) {
      console.error('Failed to refresh heroes:', err);
    }
  }, [context]);

  const clearError = useCallback(() => {
    context.clearErrors();
  }, [context]);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Auto-refresh heroes if needed
  useEffect(() => {
    if (context.heroes.length === 0 && !context.isLoadingHeroes && !context.heroesError) {
      refreshHeroes();
    }
  }, [context.heroes.length, context.isLoadingHeroes, context.heroesError, refreshHeroes]);

  // ============================================================================
  // RETURN VALUE
  // ============================================================================

  return {
    heroes: context.heroes,
    filteredHeroes: context.filteredHeroes,
    loading,
    isLoading: loading, // Add alias for compatibility
    error,
    filters: context.filters,
    actions: {
      setFilters,
      refreshHeroes,
      clearError
    }
  };
} 