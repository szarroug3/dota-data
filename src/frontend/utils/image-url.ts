/**
 * Formats the full item image URL from OpenDota API response
 *
 * @param itemImagePath The image path from OpenDota API (e.g., "/apps/dota2/images/dota_react/items/blink.png?t=1593393829403")
 * @returns The complete URL for the item image
 */
export function formatItemImageUrl(itemImagePath: string): string {
  // Sanitize the path to remove characters that can appear in some sources (e.g., apostrophes, ampersands, spaces)
  const sanitizedPath = (itemImagePath || '')
    .replace(/['&\s]/g, '')
    .trim();
  return `https://cdn.cloudflare.steamstatic.com${sanitizedPath}`;
}

/**
 * Formats the full hero URL from OpenDota API response
 *
 * @param heroName The hero's name from the OpenDota API response
 * @returns The complete URL for the hero image
 */
export function formatHeroImageUrl(heroName: string): string {
  const hero = heroName.replace('npc_dota_hero_', '');
  return `https://dota2protracker.com/static/heroes/${hero}_vert.jpg`;
}


