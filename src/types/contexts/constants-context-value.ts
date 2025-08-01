/**
 * Constants context value types
 * 
 * Defines the structure for constants-related state and data management
 * in the frontend application. Includes heroes and items.
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
  imageUrl: string;
}

// ============================================================================
// ITEM DATA TYPES
// ============================================================================

/**
 * Item interface
 */
export interface Item {
  id: number;
  name: string;
  imageUrl: string;
}

// ============================================================================
// CONSTANTS CONTEXT STATE
// ============================================================================

/**
 * Constants context value interface
 */
export interface ConstantsContextValue {
  // Hero data - mapped by hero ID for easier lookup
  heroes: Record<string, Hero>; // Key is hero ID as string
  
  // Hero data - mapped by hero name for easier lookup
  heroesByName: Record<string, Hero>; // Key is hero name (e.g., "npc_dota_hero_lion")
  
  // Item data - mapped by item ID for easier lookup
  items: Record<number, Item>; // Key is item ID as number
  
  // Loading states
  isLoadingHeroes: boolean;
  isLoadingItems: boolean;
  
  // Error states
  heroesError: string | null;
  itemsError: string | null;
  
  // Actions
  fetchHeroes: (force?: boolean) => Promise<void>;
  fetchItems: (force?: boolean) => Promise<void>;
  clearErrors: () => void;
  
  // Utility functions
  getItemById: (itemId: number) => Item | undefined;
  getHeroById: (heroId: string) => Hero | undefined;
  getHeroByName: (heroName: string) => Hero | undefined;
}

/**
 * Constants context provider props
 */
export interface ConstantsContextProviderProps {
  children: React.ReactNode;
} 