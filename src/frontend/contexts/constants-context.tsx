'use client';

/**
 * Constants Context
 *
 * Manages constants data (heroes and items) and provides actions for operations.
 * Uses constants data fetching context for data retrieval.
 */

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

import { useConstantsDataFetching } from '@/frontend/contexts/constants-data-fetching-context';
import { formatHeroImageUrl, formatItemImageUrl } from '@/lib/utils/image-url';
import type {
  ConstantsContextProviderProps,
  ConstantsContextValue,
  Hero,
  Item,
} from '@/types/contexts/constants-context-value';
import type { OpenDotaHero, OpenDotaItem } from '@/types/external-apis';

// ============================================================================
// HELPERS
// ============================================================================

function buildFetchHeroes(
  fetchHeroesData: (force?: boolean) => Promise<OpenDotaHero[] | { error: string }>,
  setIsLoadingHeroes: (v: boolean) => void,
  setHeroesError: (v: string | null) => void,
  setHeroes: React.Dispatch<React.SetStateAction<Record<string, Hero>>>,
  setHeroesByName: React.Dispatch<React.SetStateAction<Record<string, Hero>>>,
) {
  return async (force = false) => {
    try {
      setIsLoadingHeroes(true);
      setHeroesError(null);
      const result = await fetchHeroesData(force);
      if ('error' in result) {
        setHeroesError(result.error);
        return;
      }
      const convertedHeroes = result.map(convertApiHeroToHero);
      const heroesById: Record<string, Hero> = {};
      const heroesByNameLocal: Record<string, Hero> = {};
      convertedHeroes.forEach((hero) => {
        heroesById[hero.id] = hero;
        heroesByNameLocal[hero.name] = hero;
      });
      setHeroes(heroesById);
      setHeroesByName(heroesByNameLocal);
    } catch (error) {
      setHeroesError(error instanceof Error ? error.message : 'Failed to fetch heroes');
    } finally {
      setIsLoadingHeroes(false);
    }
  };
}

function buildFetchItems(
  fetchItemsData: (force?: boolean) => Promise<Record<string, OpenDotaItem> | { error: string }>,
  setIsLoadingItems: (v: boolean) => void,
  setItemsError: (v: string | null) => void,
  setItemsById: React.Dispatch<React.SetStateAction<Record<number, Item>>>,
  setItems: React.Dispatch<React.SetStateAction<Record<string, Item>>>,
) {
  return async (force = false) => {
    try {
      setIsLoadingItems(true);
      setItemsError(null);
      const result = await fetchItemsData(force);
      if ('error' in result) {
        console.error('Error fetching items:', result.error);
        setItemsError(result.error as string);
        return;
      }
      const itemsByIdLocal: Record<number, Item> = {};
      const itemsByNameLocal: Record<string, Item> = {};
      Object.entries(result).forEach(([itemName, itemData]) => {
        const item: Item = {
          id: (itemData.id as number) ?? -1,
          name: (itemData.dname as string) ?? '',
          imageUrl: formatItemImageUrl((itemData.img as string) ?? ''),
        };
        itemsByIdLocal[item.id] = item;
        itemsByNameLocal[itemName] = item;
      });
      setItemsById(itemsByIdLocal);
      setItems(itemsByNameLocal);
    } catch (error) {
      console.error('Exception fetching items:', error);
      setItemsError(error instanceof Error ? error.message : 'Failed to fetch items');
    } finally {
      setIsLoadingItems(false);
    }
  };
}
const convertApiHeroToHero = (hero: OpenDotaHero): Hero => {
  const name = hero.name ?? '';

  return {
    id: String(hero.id ?? ''),
    name,
    localizedName: hero.localized_name ?? '',
    primaryAttribute:
      hero.primary_attr === 'str' ? 'strength' : hero.primary_attr === 'agi' ? 'agility' : 'intelligence',
    attackType: (hero.attack_type || '').toLowerCase() === 'ranged' ? 'ranged' : 'melee',
    roles: Array.isArray(hero.roles) ? hero.roles : [],
    imageUrl: formatHeroImageUrl(name),
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
  const [itemsById, setItemsById] = useState<Record<number, Item>>({});

  // Loading states
  const [isLoadingHeroes, setIsLoadingHeroes] = useState(false);
  const [isLoadingItems, setIsLoadingItems] = useState(false);

  // Error states
  const [heroesError, setHeroesError] = useState<string | null>(null);
  const [itemsError, setItemsError] = useState<string | null>(null);

  // Actions
  const fetchHeroes = useMemo(
    () => buildFetchHeroes(fetchHeroesData, setIsLoadingHeroes, setHeroesError, setHeroes, setHeroesByName),
    [fetchHeroesData],
  );

  const fetchItems = useMemo(
    () => buildFetchItems(fetchItemsData, setIsLoadingItems, setItemsError, setItemsById, setItems),
    [fetchItemsData],
  );

  const clearErrors = useCallback(() => {
    setHeroesError(null);
    setItemsError(null);
  }, []);

  // Load constants on mount
  React.useEffect(() => {
    void fetchHeroes(false);
    void fetchItems(false);
  }, [fetchHeroes, fetchItems]);

  const getItemById = useCallback(
    (itemId: number | string) => {
      if (typeof itemId === 'string') {
        return items[itemId];
      }
      return itemsById[itemId];
    },
    [items, itemsById],
  );
  const getHeroById = useCallback((heroId: string) => heroes[heroId], [heroes]);
  const getHeroByName = useCallback((heroName: string) => heroesByName[heroName], [heroesByName]);

  const contextValue: ConstantsContextValue = useMemo(
    () => ({
      // Hero data
      heroes,
      heroesByName,
      items,
      itemsById,
      isLoadingHeroes,
      isLoadingItems,
      heroesError,
      itemsError,
      fetchHeroes,
      fetchItems,
      clearErrors,
      getItemById,
      getHeroById,
      getHeroByName,
    }),
    [
      heroes,
      heroesByName,
      items,
      itemsById,
      isLoadingHeroes,
      isLoadingItems,
      heroesError,
      itemsError,
      fetchHeroes,
      fetchItems,
      clearErrors,
      getItemById,
      getHeroById,
      getHeroByName,
    ],
  );

  return <ConstantsContext.Provider value={contextValue}>{children}</ConstantsContext.Provider>;
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
