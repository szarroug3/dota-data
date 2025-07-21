/**
 * Formats the full item image URL from OpenDota API response
 * 
 * @param itemImagePath The image path from OpenDota API (e.g., "/apps/dota2/images/dota_react/items/blink.png?t=1593393829403")
 * @returns The complete URL for the item image
 */
export function formatItemImageUrl(itemImagePath: string): string {
  const baseUrl = "https://cdn.cloudflare.steamstatic.com";
  return baseUrl + itemImagePath;
}
