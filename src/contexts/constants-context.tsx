"use client";

/**
 * Constants Context
 * 
 * Manages constants data (heroes and items) and provides actions for operations.
 * Uses constants data fetching context for data retrieval.
 */

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

import { useConstantsDataFetching } from '@/contexts/constants-data-fetching-context';
import { formatHeroImageUrl, formatItemImageUrl } from '@/lib/utils/image-url';
import type {
  ConstantsContextProviderProps,
  ConstantsContextValue,
  Hero,
  Item
} from '@/types/contexts/constants-context-value';
import type { OpenDotaHero } from '@/types/external-apis';

// ============================================================================
// HELPERS
// ============================================================================



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
    imageUrl: formatHeroImageUrl(openDotaHero.name)
  };
};

// ============================================================================
// CONTEXT
// ============================================================================

const ConstantsContext = createContext<ConstantsContextValue | undefined>(undefined);

// ============================================================================
// PROVIDER
// ============================================================================

export const ConstantsProvider: React.FC<ConstantsContextProviderProps> = ({ children }) => {
  const { fetchHeroesData, fetchItemsData } = useConstantsDataFetching();
  
  // State
  const [heroes, setHeroes] = useState<Record<string, Hero>>({});
  const [heroesByName, setHeroesByName] = useState<Record<string, Hero>>({});
  const [items, setItems] = useState<Record<string, Item>>({});
  
  // Loading states
  const [isLoadingHeroes, setIsLoadingHeroes] = useState(false);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  
  // Error states
  const [heroesError, setHeroesError] = useState<string | null>(null);
  const [itemsError, setItemsError] = useState<string | null>(null);
  
  // Actions
  const fetchHeroes = useCallback(async (force = false) => {
    try {
      setIsLoadingHeroes(true);
      setHeroesError(null);
      
      const result = await fetchHeroesData(force);
      
      if ('error' in result) {
        setHeroesError(result.error);
        return;
      }
      
      const convertedHeroes = result.map(convertOpenDotaHeroToHero);
      
      // Convert array to records for easier lookup
      const heroesById: Record<string, Hero> = {};
      const heroesByName: Record<string, Hero> = {};
      convertedHeroes.forEach(hero => {
        heroesById[hero.id] = hero;
        heroesByName[hero.name] = hero;
      });
      setHeroes(heroesById);
      setHeroesByName(heroesByName);
    } catch (error) {
      setHeroesError(error instanceof Error ? error.message : 'Failed to fetch heroes');
    } finally {
      setIsLoadingHeroes(false);
    }
  }, [fetchHeroesData]);
  
  const fetchItems = useCallback(async (force = false) => {
    try {
      setIsLoadingItems(true);
      setItemsError(null);
      
      const result = await fetchItemsData(force);
      
      if ('error' in result) {
        console.error('Error fetching items:', result.error);
        setItemsError(result.error as string);
        return;
      }
      
      // Convert items to our format, keyed by numeric ID for match data lookup
      const items: Record<number, Item> = {};
      
      Object.entries(result).forEach(([itemName, itemData]) => {
        const item: Item = {
          id: itemData.id, // Use numeric ID as the item ID
          name: itemData.dname,
          imageUrl: formatItemImageUrl(itemData.img) // Use the actual image path from API
        };
        
        // Store by numeric ID for match data lookup
        items[itemData.id] = item;
      });
      
      setItems(items);
    } catch (error) {
      console.error('Exception fetching items:', error);
      setItemsError(error instanceof Error ? error.message : 'Failed to fetch items');
    } finally {
      setIsLoadingItems(false);
    }
  }, [fetchItemsData]);
  

  
  const clearErrors = useCallback(() => {
    setHeroesError(null);
    setItemsError(null);
  }, []);
  
  const getItemById = useCallback((itemId: number) => items[itemId], [items]);
  const getHeroById = useCallback((heroId: string) => heroes[heroId], [heroes]);
  const getHeroByName = useCallback((heroName: string) => heroesByName[heroName], [heroesByName]);
  
  const contextValue: ConstantsContextValue = useMemo(() => ({
    // Hero data
    heroes,
    heroesByName,
    items,
    isLoadingHeroes,
    isLoadingItems,
    heroesError,
    itemsError,
    fetchHeroes,
    fetchItems,
    clearErrors,
    getItemById,
    getHeroById,
    getHeroByName
  }), [
    heroes,
    heroesByName,
    items,
    isLoadingHeroes,
    isLoadingItems,
    heroesError,
    itemsError,
    fetchHeroes,
    fetchItems,
    clearErrors,
    getItemById,
    getHeroById,
    getHeroByName
  ]);
  
  return (
    <ConstantsContext.Provider value={contextValue}>
      {children}
    </ConstantsContext.Provider>
  );
};

// ============================================================================
// HOOK
// ============================================================================

export const useConstantsContext = (): ConstantsContextValue => {
  const context = useContext(ConstantsContext);
  if (!context) {
    throw new Error('useConstantsContext must be used within a ConstantsProvider');
  }
  return context;
}; 