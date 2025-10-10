import path from 'path';

import { CacheTtlSeconds } from '@/lib/cache-ttls';
import { request, requestWithRetry } from '@/lib/utils/request';
import { OpenDotaItem } from '@/types/external-apis';

/**
 * Fetches the list of Dota 2 items from OpenDota using the generic request function.
 * OpenDota API docs: https://docs.opendota.com/#tag/constants/operation/get_constants
 *
 * @param force If true, bypasses cache and fetches fresh data
 * @returns Object of OpenDotaItem objects keyed by item name
 */
export async function fetchOpenDotaItems(force = false): Promise<Record<string, OpenDotaItem>> {
  const cacheKey = 'opendota:items';
  const cacheTTL = CacheTtlSeconds.items;
  const externalDataFilename = path.join(process.cwd(), 'mock-data', 'external-data', 'items.json');

  const result = await request<Record<string, OpenDotaItem>>(
    'opendota',
    () => fetchItemsFromOpenDota(),
    (data: string) => parseOpenDotaItems(data),
    externalDataFilename,
    force,
    cacheTTL,
    cacheKey,
  );

  if (!result) {
    throw new Error('Failed to fetch items data');
  }

  return result;
}

/**
 * Fetch items from OpenDota API
 */
async function fetchItemsFromOpenDota(): Promise<string> {
  const url = `https://api.opendota.com/api/constants/items`;

  try {
    const response = await requestWithRetry('GET', url);

    if (!response.ok) {
      throw new Error(`OpenDota API error: ${response.status} ${response.statusText}`);
    }

    return await response.text();
  } catch (err) {
    throw new Error(`Failed to fetch items from OpenDota: ${err}`);
  }
}

/**
 * Parse OpenDota items data
 */
function parseOpenDotaItems(data: string): Record<string, OpenDotaItem> {
  try {
    return JSON.parse(data) as Record<string, OpenDotaItem>;
  } catch (err) {
    throw new Error(`Failed to parse OpenDota items data: ${err}`);
  }
}
