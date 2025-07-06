import { fetchData } from '@/lib/fetch-data';
import { OpenDotaItems } from '@/types/opendota';

/**
 * Fetch all items data from OpenDota API
 * @returns Promise<OpenDotaItems> - All items data
 */
export async function fetchItems(): Promise<OpenDotaItems> {
  // const cacheKey = 'opendota-items'; // No longer needed
  const url = 'https://api.opendota.com/api/constants/items';
  
  return fetchData<OpenDotaItems>(url);
}

/**
 * Get a specific item by name
 * @param itemName - The name of the item to fetch
 * @returns Promise<OpenDotaItem | null> - The item data or null if not found
 */
export async function getItem(itemName: string): Promise<OpenDotaItems[string] | null> {
  const items = await fetchItems();
  return items[itemName] || null;
}

/**
 * Get items by quality (component, common, rare, epic, artifact, etc.)
 * @param quality - The quality filter
 * @returns Promise<OpenDotaItems> - Filtered items
 */
export async function getItemsByQuality(quality: string): Promise<OpenDotaItems> {
  const items = await fetchItems();
  const filtered: OpenDotaItems = {};
  
  for (const [name, item] of Object.entries(items)) {
    if (item.qual === quality) {
      filtered[name] = item;
    }
  }
  
  return filtered;
}

/**
 * Get items by cost range
 * @param minCost - Minimum cost
 * @param maxCost - Maximum cost
 * @returns Promise<OpenDotaItems> - Filtered items
 */
export async function getItemsByCost(minCost: number, maxCost: number): Promise<OpenDotaItems> {
  const items = await fetchItems();
  const filtered: OpenDotaItems = {};
  
  for (const [name, item] of Object.entries(items)) {
    if (item.cost >= minCost && item.cost <= maxCost) {
      filtered[name] = item;
    }
  }
  
  return filtered;
} 