/**
 * Hero context value types
 * 
 * Defines the structure for hero-related state and data management
 * in the frontend application.
 */

// ============================================================================
// HERO DATA TYPES
// ============================================================================

/**
 * Hero interface
 */
export interface Hero {
  id: string;
  name: string;
  localizedName: string;
  primaryAttribute: 'strength' | 'agility' | 'intelligence';
  attackType: 'melee' | 'ranged';
  roles: string[];
  complexity: 1 | 2 | 3;
  imageUrl: string;
}

/**
 * Hero filters interface
 */
export interface HeroFilters {
  primaryAttribute: ('strength' | 'agility' | 'intelligence')[];
  attackType: ('melee' | 'ranged')[];
  roles: string[];
  complexity: (1 | 2 | 3)[];
  difficulty: ('easy' | 'medium' | 'hard')[];
  pickRate: {
    min: number | null;
    max: number | null;
  };
  winRate: {
    min: number | null;
    max: number | null;
  };
}

// ============================================================================
// HERO CONTEXT STATE
// ============================================================================

/**
 * Hero context value interface
 */
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

/**
 * Hero context provider props
 */
export interface HeroContextProviderProps {
  children: React.ReactNode;
} 