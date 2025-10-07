/**
 * Reference Data Loader
 * Handles loading of global reference data (heroes, items, leagues)
 */

import { formatHeroImageUrl, formatItemImageUrl } from '@/lib/utils/image-url';
import type { OpenDotaHero, OpenDotaItem, OpenDotaLeague } from '@/types/external-apis/opendota';

import type { Hero, Item, League } from './app-data-types';

/**
 * Load heroes data from API
 * Fetches all heroes from /api/heroes
 */
export async function loadHeroes(): Promise<Map<number, Hero>> {
  try {
    const response = await fetch('/api/heroes');
    if (!response.ok) {
      throw new Error(`Failed to fetch heroes: ${response.status} ${response.statusText}`);
    }

    const heroes = (await response.json()) as OpenDotaHero[];
    const heroesMap = new Map<number, Hero>();

    // Populate heroes Map
    heroes.forEach((hero) => {
      heroesMap.set(hero.id, {
        id: hero.id,
        name: hero.name,
        localizedName: hero.localized_name,
        imageUrl: formatHeroImageUrl(hero.name),
        primaryAttribute: hero.primary_attr as 'strength' | 'agility' | 'intelligence',
        attackType: hero.attack_type as 'melee' | 'ranged',
        roles: hero.roles,
      });
    });

    return heroesMap;
  } catch (error) {
    console.error('Failed to load heroes:', error);
    throw error;
  }
}

/**
 * Load items data from API
 * Fetches all items from /api/items
 */
export async function loadItems(): Promise<Map<number, Item>> {
  try {
    const response = await fetch('/api/items');
    if (!response.ok) {
      throw new Error(`Failed to fetch items: ${response.status} ${response.statusText}`);
    }

    const items = (await response.json()) as Record<string, OpenDotaItem>;
    const itemsMap = new Map<number, Item>();

    // Populate items Map (items come as an object, not array)
    Object.values(items).forEach((item) => {
      itemsMap.set(item.id, {
        id: item.id,
        name: item.dname,
        imageUrl: formatItemImageUrl(item.img),
        cost: item.cost,
      });
    });

    return itemsMap;
  } catch (error) {
    console.error('Failed to load items:', error);
    throw error;
  }
}

/**
 * Load leagues data from API
 * Fetches all leagues from /api/leagues
 */
export async function loadLeagues(): Promise<Map<number, League>> {
  try {
    const response = await fetch('/api/leagues');
    if (!response.ok) {
      throw new Error(`Failed to fetch leagues: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as { leagues: OpenDotaLeague[] };
    const leaguesMap = new Map<number, League>();

    // Populate leagues Map
    data.leagues.forEach((league) => {
      if (league.leagueid && league.name) {
        leaguesMap.set(league.leagueid, {
          id: league.leagueid,
          name: league.name,
        });
      }
    });

    return leaguesMap;
  } catch (error) {
    console.error('Failed to load leagues:', error);
    throw error;
  }
}
