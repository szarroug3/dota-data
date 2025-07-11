import { OpenDotaHero } from '@/types/external-apis';

/**
 * Hero utility functions for data manipulation and lookups
 */

/**
 * Finds a hero by their ID
 * @param heroes Array of heroes to search
 * @param heroId The hero ID to find
 * @returns The hero object or null if not found
 */
export function findHeroById(heroes: OpenDotaHero[], heroId: number): OpenDotaHero | null {
  return heroes.find(hero => hero.id === heroId) || null;
}

/**
 * Finds a hero by their internal name
 * @param heroes Array of heroes to search
 * @param heroName The internal hero name (e.g., 'npc_dota_hero_antimage')
 * @returns The hero object or null if not found
 */
export function findHeroByName(heroes: OpenDotaHero[], heroName: string): OpenDotaHero | null {
  return heroes.find(hero => hero.name === heroName) || null;
}

/**
 * Finds a hero by their localized name
 * @param heroes Array of heroes to search
 * @param localizedName The localized hero name (e.g., 'Anti-Mage')
 * @returns The hero object or null if not found
 */
export function findHeroByLocalizedName(heroes: OpenDotaHero[], localizedName: string): OpenDotaHero | null {
  return heroes.find(hero => hero.localized_name === localizedName) || null;
}

/**
 * Filters heroes by their primary attribute
 * @param heroes Array of heroes to filter
 * @param attribute The primary attribute ('str', 'agi', 'int')
 * @returns Array of heroes with the specified primary attribute
 */
export function filterHeroesByAttribute(heroes: OpenDotaHero[], attribute: string): OpenDotaHero[] {
  return heroes.filter(hero => hero.primary_attr === attribute);
}

/**
 * Filters heroes by their attack type
 * @param heroes Array of heroes to filter
 * @param attackType The attack type ('Melee', 'Ranged')
 * @returns Array of heroes with the specified attack type
 */
export function filterHeroesByAttackType(heroes: OpenDotaHero[], attackType: string): OpenDotaHero[] {
  return heroes.filter(hero => hero.attack_type === attackType);
}

/**
 * Filters heroes by their roles
 * @param heroes Array of heroes to filter
 * @param role The role to filter by (e.g., 'Carry', 'Support', 'Initiator')
 * @returns Array of heroes that have the specified role
 */
export function filterHeroesByRole(heroes: OpenDotaHero[], role: string): OpenDotaHero[] {
  return heroes.filter(hero => hero.roles.includes(role));
}

/**
 * Filters heroes that are enabled in Captain's Mode
 * @param heroes Array of heroes to filter
 * @returns Array of heroes enabled in Captain's Mode
 */
export function filterCaptainsModeHeroes(heroes: OpenDotaHero[]): OpenDotaHero[] {
  return heroes.filter(hero => hero.cm_enabled);
}

/**
 * Gets all unique roles from the heroes array
 * @param heroes Array of heroes
 * @returns Array of unique role strings
 */
export function getAllRoles(heroes: OpenDotaHero[]): string[] {
  const roles = new Set<string>();
  heroes.forEach(hero => {
    hero.roles.forEach(role => roles.add(role));
  });
  return Array.from(roles).sort();
}

/**
 * Gets all unique primary attributes from the heroes array
 * @param heroes Array of heroes
 * @returns Array of unique primary attribute strings
 */
export function getAllPrimaryAttributes(heroes: OpenDotaHero[]): string[] {
  const attributes = new Set<string>();
  heroes.forEach(hero => {
    attributes.add(hero.primary_attr);
  });
  return Array.from(attributes).sort();
}

/**
 * Searches heroes by name (both internal and localized)
 * @param heroes Array of heroes to search
 * @param query The search query
 * @param caseSensitive Whether the search should be case sensitive
 * @returns Array of heroes matching the search query
 */
export function searchHeroesByName(heroes: OpenDotaHero[], query: string, caseSensitive = false): OpenDotaHero[] {
  const searchQuery = caseSensitive ? query : query.toLowerCase();
  return heroes.filter(hero => {
    const heroName = caseSensitive ? hero.name : hero.name.toLowerCase();
    const localizedName = caseSensitive ? hero.localized_name : hero.localized_name.toLowerCase();
    return heroName.includes(searchQuery) || localizedName.includes(searchQuery);
  });
}

/**
 * Sorts heroes by their localized name
 * @param heroes Array of heroes to sort
 * @param ascending Whether to sort in ascending order
 * @returns New array of heroes sorted by localized name
 */
export function sortHeroesByName(heroes: OpenDotaHero[], ascending = true): OpenDotaHero[] {
  return [...heroes].sort((a, b) => {
    const comparison = a.localized_name.localeCompare(b.localized_name);
    return ascending ? comparison : -comparison;
  });
}

/**
 * Sorts heroes by their win rate (if win rate data is available)
 * @param heroes Array of heroes to sort
 * @param ascending Whether to sort in ascending order
 * @returns New array of heroes sorted by win rate
 */
export function sortHeroesByWinRate(heroes: OpenDotaHero[], ascending = false): OpenDotaHero[] {
  return [...heroes].sort((a, b) => {
    // Calculate win rate from available data
    const aWinRate = a.pro_pick > 0 ? a.pro_win / a.pro_pick : 0;
    const bWinRate = b.pro_pick > 0 ? b.pro_win / b.pro_pick : 0;
    const comparison = aWinRate - bWinRate;
    return ascending ? comparison : -comparison;
  });
}

/**
 * Sorts heroes by their pick rate (if pick rate data is available)
 * @param heroes Array of heroes to sort
 * @param ascending Whether to sort in ascending order
 * @returns New array of heroes sorted by pick rate
 */
export function sortHeroesByPickRate(heroes: OpenDotaHero[], ascending = false): OpenDotaHero[] {
  return [...heroes].sort((a, b) => {
    const comparison = a.pro_pick - b.pro_pick;
    return ascending ? comparison : -comparison;
  });
}

/**
 * Gets hero statistics summary
 * @param heroes Array of heroes
 * @returns Object containing hero statistics
 */
export function getHeroStatistics(heroes: OpenDotaHero[]): {
  totalHeroes: number;
  strengthHeroes: number;
  agilityHeroes: number;
  intelligenceHeroes: number;
  meleeHeroes: number;
  rangedHeroes: number;
  captainsModeHeroes: number;
  uniqueRoles: string[];
} {
  return {
    totalHeroes: heroes.length,
    strengthHeroes: filterHeroesByAttribute(heroes, 'str').length,
    agilityHeroes: filterHeroesByAttribute(heroes, 'agi').length,
    intelligenceHeroes: filterHeroesByAttribute(heroes, 'int').length,
    meleeHeroes: filterHeroesByAttackType(heroes, 'Melee').length,
    rangedHeroes: filterHeroesByAttackType(heroes, 'Ranged').length,
    captainsModeHeroes: filterCaptainsModeHeroes(heroes).length,
    uniqueRoles: getAllRoles(heroes)
  };
}

/**
 * Converts hero data to a simplified format for UI display
 * @param hero The hero object to convert
 * @returns Simplified hero object for UI
 */
export function heroToDisplayFormat(hero: OpenDotaHero): {
  id: number;
  name: string;
  displayName: string;
  attribute: string;
  attackType: string;
  roles: string[];
  image: string;
  icon: string;
  isEnabled: boolean;
  winRate: number;
  pickRate: number;
} {
  return {
    id: hero.id,
    name: hero.name,
    displayName: hero.localized_name,
    attribute: hero.primary_attr,
    attackType: hero.attack_type,
    roles: hero.roles,
    image: hero.img,
    icon: hero.icon,
    isEnabled: hero.cm_enabled,
    winRate: hero.pro_pick > 0 ? hero.pro_win / hero.pro_pick : 0,
    pickRate: hero.pro_pick
  };
}

/**
 * Creates a hero lookup map by ID for fast access
 * @param heroes Array of heroes
 * @returns Map with hero ID as key and hero object as value
 */
export function createHeroLookupMap(heroes: OpenDotaHero[]): Map<number, OpenDotaHero> {
  return new Map(heroes.map(hero => [hero.id, hero]));
}

/**
 * Creates a hero lookup map by name for fast access
 * @param heroes Array of heroes
 * @returns Map with hero name as key and hero object as value
 */
export function createHeroNameLookupMap(heroes: OpenDotaHero[]): Map<string, OpenDotaHero> {
  return new Map(heroes.map(hero => [hero.name, hero]));
} 