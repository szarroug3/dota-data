"use client";

/**
 * Constants Context
 * 
 * Manages constants data (heroes and items) and provides actions for operations.
 * Uses constants data fetching context for data retrieval.
 */

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

import { useConstantsDataFetching } from '@/contexts/constants-data-fetching-context';
import { formatItemImageUrl } from '@/lib/utils/item-image-url';
import type { 
  ConstantsContextValue, 
  ConstantsContextProviderProps, 
  Hero,
  Item
} from '@/types/contexts/constants-context-value';
import type { OpenDotaHero, OpenDotaItem } from '@/types/external-apis';

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
    imageUrl: `https://dota2protracker.com/static/heroes/${openDotaHero.name}_vert.jpg`
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
  const [items, setItems] = useState<Record<string, Item>>({});
  
  // Loading states
  const [isLoadingHeroes, setIsLoadingHeroes] = useState(false);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  
  // Error states
  const [heroesError, setHeroesError] = useState<string | null>(null);
  const [itemsError, setItemsError] = useState<string | null>(null);
  
  // Actions
  const refreshHeroes = useCallback(async () => {
    try {
      setIsLoadingHeroes(true);
      setHeroesError(null);
      
      const result = await fetchHeroesData();
      
      if ('error' in result) {
        setHeroesError(result.error);
        return;
      }
      
      const convertedHeroes = result.map(convertOpenDotaHeroToHero);
      
      // Convert array to record for easier lookup
      const heroesById: Record<string, Hero> = {};
      convertedHeroes.forEach(hero => {
        heroesById[hero.id] = hero;
      });
      
      setHeroes(heroesById);
    } catch (error) {
      setHeroesError(error instanceof Error ? error.message : 'Failed to refresh heroes');
    } finally {
      setIsLoadingHeroes(false);
    }
  }, [fetchHeroesData]);
  
  const refreshItems = useCallback(async () => {
    try {
      setIsLoadingItems(true);
      setItemsError(null);
      
      const result = await fetchItemsData();
      
      if ('error' in result) {
        setItemsError(result.error as string);
        return;
      }
      
      // Convert from name-based mapping to ID-based mapping with simplified items
      const itemsById: Record<string, Item> = {};
      Object.values(result).forEach(item => {
        itemsById[item.id.toString()] = {
          id: item.id.toString(),
          name: item.dname,
          imageUrl: formatItemImageUrl(item.img)
        };
      });
      
      setItems(itemsById);
    } catch (error) {
      setItemsError(error instanceof Error ? error.message : 'Failed to refresh items');
    } finally {
      setIsLoadingItems(false);
    }
  }, [fetchItemsData]);
  

  
  const clearErrors = useCallback(() => {
    setHeroesError(null);
    setItemsError(null);
  }, []);
  
  // Initial data loading
  useEffect(() => {
    refreshHeroes();
    refreshItems();
  }, [refreshHeroes, refreshItems]);
  
  const contextValue: ConstantsContextValue = {
    // Hero data
    heroes,
    items,
    isLoadingHeroes,
    isLoadingItems,
    heroesError,
    itemsError,
    refreshHeroes,
    refreshItems,
    clearErrors,
    getItemById: useCallback((itemId: string) => items[itemId], [items]),
    getHeroById: useCallback((heroId: string) => heroes[heroId], [heroes])
  };
  
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