import path from 'path';

import { CacheTtlSeconds } from '@/lib/cache-ttls';
import { request, requestWithRetry } from '@/lib/utils/request';
import { OpenDotaHero } from '@/types/external-apis';

/**
 * Fetches the list of Dota 2 heroes from OpenDota using the generic request function.
 * OpenDota API docs: https://docs.opendota.com/#tag/heroes/operation/get_heroes
 *
 * @param force If true, bypasses cache and fetches fresh data
 * @returns Array of OpenDotaHero objects
 */
export async function fetchOpenDotaHeroes(force = false): Promise<OpenDotaHero[]> {
  const cacheKey = 'opendota:heroes';
  const cacheTTL = CacheTtlSeconds.heroes;
  const externalDataFilename = path.join(process.cwd(), 'mock-data', 'external-data', 'heroes.json');

  const result = await request<OpenDotaHero[]>(
    'opendota',
    () => fetchHeroesFromOpenDota(),
    (data: string) => parseOpenDotaHeroes(data),
    externalDataFilename,
    force,
    cacheTTL,
    cacheKey,
  );

  if (!result) {
    throw new Error('Failed to fetch heroes data');
  }

  return result;
}

/**
 * Fetch heroes from OpenDota API
 */
async function fetchHeroesFromOpenDota(): Promise<string> {
  const url = `https://api.opendota.com/api/heroes`;

  try {
    const response = await requestWithRetry('GET', url);

    if (!response.ok) {
      throw new Error(`OpenDota API error: ${response.status} ${response.statusText}`);
    }

    return await response.text();
  } catch (err) {
    throw new Error(`Failed to fetch heroes from OpenDota: ${err}`);
  }
}

/**
 * Parse OpenDota heroes data
 */
function parseOpenDotaHeroes(data: string): OpenDotaHero[] {
  try {
    const heroes = JSON.parse(data) as OpenDotaHero[];
    return heroes;
  } catch (err) {
    throw new Error(`Failed to parse OpenDota heroes data: ${err}`);
  }
}
