/**
 * Hero data hook types
 * 
 * Provides type definitions for the useHeroData hook.
 */

import type { Hero, HeroFilters } from '@/types/contexts/hero-context-value';

export interface UseHeroDataReturn {
  // Hero data
  heroes: Hero[];
  filteredHeroes: Hero[];
  selectedHero: Hero | null;
  selectedHeroId: string | null;
  heroData: Hero | null;
  heroStats: null; // Not implemented yet

  // Filters
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