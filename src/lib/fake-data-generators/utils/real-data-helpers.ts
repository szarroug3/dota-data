import type { OpenDotaItems } from '@/types/opendota';
import fs from 'fs';
import path from 'path';

/**
 * Load real items data from real-data/items.json
 */
export function loadRealItems(): OpenDotaItems {
  try {
    const itemsPath = path.join(process.cwd(), 'real-data', 'items.json');
    const itemsData = JSON.parse(fs.readFileSync(itemsPath, 'utf8'));
    return itemsData;
  } catch {
    console.warn('Could not load real items data');
    return {};
  }
}

/**
 * Get a list of common item IDs for fake data generation
 */
export function getCommonItemIds(): number[] {
  const items = loadRealItems();
  const commonItems = [
    'blink', 'boots', 'phase_boots', 'power_treads', 'travel_boots',
    'magic_wand', 'bracer', 'wraith_band', 'null_talisman',
    'ring_of_basilius', 'buckler', 'headdress', 'urn_of_shadows',
    'mekansm', 'vladmir', 'pipe', 'force_staff', 'euls',
    'blade_of_alacrity', 'staff_of_wizardry', 'ogre_axe',
    'ultimate_orb', 'point_booster', 'vitality_booster', 'energy_booster',
    'demon_edge', 'eagle', 'reaver', 'relic', 'hyperstone',
    'ring_of_health', 'void_stone', 'mystic_staff', 'platemail',
    'claymore', 'broadsword', 'mithril_hammer', 'quarterstaff',
    'chainmail', 'helm_of_iron_will', 'javelin', 'blades_of_attack',
    'gauntlets', 'slippers', 'mantle', 'branches', 'belt_of_strength',
    'boots_of_elves', 'robe', 'circlet', 'crown', 'diadem',
    'gloves', 'lifesteal', 'ring_of_regen', 'sobi_mask', 'gem',
    'cloak', 'talisman_of_evasion', 'cheese', 'magic_stick'
  ];
  
  return commonItems
    .map(name => items[name]?.id)
    .filter(id => id !== undefined) as number[];
}

/**
 * Get a random item ID from common items
 */
export function getRandomItemId(): number {
  const commonIds = getCommonItemIds();
  if (commonIds.length === 0) {
    // Fallback to some basic item IDs if no real data
    return Math.floor(Math.random() * 100) + 1;
  }
  return commonIds[Math.floor(Math.random() * commonIds.length)];
}

/**
 * Get multiple random item IDs for a player's inventory
 */
export function getRandomItemIds(count: number): number[] {
  try {
    const itemsPath = path.join(process.cwd(), 'real-data', 'items.json');
    const itemsData = JSON.parse(fs.readFileSync(itemsPath, 'utf8'));
    
    // Get all item IDs from the real data
    const itemIds = (Object.values(itemsData) as { id: number }[]).map(item => item.id).filter(Boolean);
    
    // Return random selection
    const result: number[] = [];
    for (let i = 0; i < count; i++) {
      const randomIndex = Math.floor(Math.random() * itemIds.length);
      result.push(itemIds[randomIndex]);
    }
    
    return result;
  } catch {
    console.warn('Could not load real items data, using fallback IDs');
    // Fallback to common item IDs
    const fallbackIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]; // Basic items
    return fallbackIds.slice(0, count);
  }
}

/**
 * Load real heroes data and return hero IDs
 */
export function getRandomHeroIds(count: number): number[] {
  try {
    const heroesPath = path.join(process.cwd(), 'real-data', 'heroes.json');
    const heroesData = JSON.parse(fs.readFileSync(heroesPath, 'utf8'));
    
    // Get all hero IDs from the real data
    const heroIds = (Object.values(heroesData) as { id: number }[]).map(hero => hero.id).filter(Boolean);
    
    // Return random selection
    const result: number[] = [];
    for (let i = 0; i < count; i++) {
      const randomIndex = Math.floor(Math.random() * heroIds.length);
      result.push(heroIds[randomIndex]);
    }
    
    return result;
  } catch {
    console.warn('Could not load real heroes data, using fallback IDs');
    // Fallback to common hero IDs
    const fallbackIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]; // Basic heroes
    return fallbackIds.slice(0, count);
  }
}

/**
 * Get a random hero ID from real data
 */
export function getRandomHeroId(): number {
  const heroIds = getRandomHeroIds(1);
  return heroIds[0] || 1;
} 