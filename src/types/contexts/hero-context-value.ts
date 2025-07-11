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
 * Hero data interface
 */
export interface HeroData {
  hero: Hero;
  stats: HeroStats;
  meta: HeroMeta;
  counters: HeroCounter[];
  synergies: HeroSynergy[];
}

/**
 * Hero meta interface
 */
export interface HeroMeta {
  pickRate: number;
  banRate: number;
  winRate: number;
  averageKDA: number;
  averageGPM: number;
  averageXPM: number;
  averageMatchDuration: number;
  preferredRoles: string[];
  difficulty: 'easy' | 'medium' | 'hard';
}

/**
 * Hero counter interface
 */
export interface HeroCounter {
  heroId: string;
  heroName: string;
  counterStrength: 'strong' | 'medium' | 'weak';
  winRate: number;
  reason: string;
}

/**
 * Hero synergy interface
 */
export interface HeroSynergy {
  heroId: string;
  heroName: string;
  synergyStrength: 'strong' | 'medium' | 'weak';
  winRate: number;
  reason: string;
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

/**
 * Hero stats interface
 */
export interface HeroStats {
  totalGames: number;
  totalWins: number;
  totalLosses: number;
  winRate: number;
  averageKDA: number;
  averageGPM: number;
  averageXPM: number;
  averageMatchDuration: number;
  pickRate: number;
  banRate: number;
  preferredRoles: string[];
  counters: HeroCounter[];
  synergies: HeroSynergy[];
}

/**
 * Hero trends interface
 */
export interface HeroTrends {
  pickRateTrend: TrendPoint[];
  winRateTrend: TrendPoint[];
  banRateTrend: TrendPoint[];
  performanceTrend: TrendPoint[];
}

/**
 * Trend point interface
 */
export interface TrendPoint {
  period: string;
  value: number;
  change: number;
}

/**
 * Hero recommendations interface
 */
export interface HeroRecommendations {
  situationalPicks: Hero[];
  strongCounters: Hero[];
  goodSynergies: Hero[];
  metaHeroes: Hero[];
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
  selectedHero: HeroData | null;
  heroStats: HeroStats | null;
  
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

// ============================================================================
// HERO DATA TYPES
// ============================================================================

/**
 * Hero selection state
 */
export interface HeroSelectionState {
  selectedHeroId: string | null;
  selectedHeroIds: string[];
}

/**
 * Hero filtering state
 */
export interface HeroFilteringState {
  filters: HeroFilters;
  sortBy: 'name' | 'pickRate' | 'winRate' | 'complexity' | 'primaryAttribute';
  sortDirection: 'asc' | 'desc';
}

/**
 * Hero data loading state
 */
export interface HeroDataLoadingState {
  isLoading: boolean;
  isRefreshing: boolean;
  lastUpdated: string | null;
  error: string | null;
}

/**
 * Hero preferences and settings
 */
export interface HeroPreferences {
  defaultView: 'grid' | 'list' | 'stats';
  showAdvancedStats: boolean;
  autoRefresh: boolean;
  refreshInterval: number; // in seconds
  showTrends: boolean;
  showRecommendations: boolean;
} 