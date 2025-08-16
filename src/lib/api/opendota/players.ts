import path from 'path';

import { request, requestWithRetry } from '@/lib/utils/request';
import {
  OpenDotaPlayer,
  OpenDotaPlayerComprehensive,
  OpenDotaPlayerCounts,
  OpenDotaPlayerHero,
  OpenDotaPlayerMatches,
  OpenDotaPlayerRanking,
  OpenDotaPlayerRating,
  OpenDotaPlayerTotals,
  OpenDotaPlayerWardMap,
  OpenDotaPlayerWL
} from '@/types/external-apis';

/**
 * Fetches comprehensive Dota 2 player data from OpenDota using the generic request function.
 * OpenDota endpoints: 
 * - https://api.opendota.com/api/players/{playerId}
 * - https://api.opendota.com/api/players/{playerId}/counts
 * - https://api.opendota.com/api/players/{playerId}/heroes
 * - https://api.opendota.com/api/players/{playerId}/rankings
 * - https://api.opendota.com/api/players/{playerId}/ratings
 * - https://api.opendota.com/api/players/{playerId}/matches
 * - https://api.opendota.com/api/players/{playerId}/totals
 * - https://api.opendota.com/api/players/{playerId}/wl
 * - https://api.opendota.com/api/players/{playerId}/wardMap
 *
 * @param playerId The player ID to fetch
 * @param force If true, bypasses cache and fetches fresh data
 * @returns Comprehensive player data object
 */
export async function fetchOpenDotaPlayer(playerId: string, force = false): Promise<OpenDotaPlayerComprehensive> {
  const cacheKey = `opendota:player-comprehensive:${playerId}`;
  const cacheTTL = 60 * 60 * 24; // 24 hours
  const mockFilename = path.join(process.cwd(), 'mock-data', 'players', `player-${playerId}-comprehensive.json`);

  const result = await request<OpenDotaPlayerComprehensive>(
    'opendota',
    () => fetchAllPlayerDataFromOpenDota(playerId),
    (data: string) => parseOpenDotaPlayerComprehensive(data),
    mockFilename,
    force,
    cacheTTL,
    cacheKey
  );

  if (!result) {
    throw new Error(`Failed to fetch player data for player ${playerId}`);
  }

  return result;
}

/**
 * Fetch all player data from OpenDota API with rate limiting
 */
async function fetchAllPlayerDataFromOpenDota(playerId: string): Promise<string> {
  const baseUrl = process.env.OPENDOTA_API_BASE_URL || 'https://api.opendota.com/api';
  const delayMs = 1000;

  // Helper to fetch and parse JSON
  async function fetchJson(url: string) {
    const response = await requestWithRetry('GET', url);
    if (!response.ok) {
      throw new Error(`OpenDota API error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  }

  // Helper to add delay
  function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // 1. Profile
  const profile: OpenDotaPlayer = await fetchJson(`${baseUrl}/players/${playerId}`);
  await delay(delayMs);

  // 2. Counts
  const counts: OpenDotaPlayerCounts = await fetchJson(`${baseUrl}/players/${playerId}/counts`);
  await delay(delayMs);

  // 3. Heroes
  const heroes: OpenDotaPlayerHero[] = await fetchJson(`${baseUrl}/players/${playerId}/heroes`);
  await delay(delayMs);

  // 4. Rankings
  let rankings: OpenDotaPlayerRanking[] = [];
  try {
    rankings = await fetchJson(`${baseUrl}/players/${playerId}/rankings`);
  } catch {
    rankings = [];
  }
  await delay(delayMs);

  // 5. Ratings
  let ratings: OpenDotaPlayerRating[] = [];
  try {
    ratings = await fetchJson(`${baseUrl}/players/${playerId}/ratings`);
  } catch {
    ratings = [];
  }
  await delay(delayMs);

  // 6. Matches
  const recentMatches: OpenDotaPlayerMatches[] = await fetchJson(`${baseUrl}/players/${playerId}/matches`);
  await delay(delayMs);

  // 7. Totals
  const totals: OpenDotaPlayerTotals = await fetchJson(`${baseUrl}/players/${playerId}/totals`);
  await delay(delayMs);

  // 8. Win/Loss
  const wl: OpenDotaPlayerWL = await fetchJson(`${baseUrl}/players/${playerId}/wl`);
  await delay(delayMs);

  // 9. Ward Map
  let wardMap: OpenDotaPlayerWardMap = { obs: {}, sen: {} };
  try {
    wardMap = await fetchJson(`${baseUrl}/players/${playerId}/wardMap`);
  } catch {
    wardMap = { obs: {}, sen: {} };
  }

  const comprehensiveData: OpenDotaPlayerComprehensive = {
    profile,
    counts,
    heroes,
    rankings,
    ratings,
    recentMatches,
    totals,
    wl,
    wardMap
  };

  return JSON.stringify(comprehensiveData);
}

/**
 * Parse comprehensive OpenDota player data
 */
function parseOpenDotaPlayerComprehensive(data: string): OpenDotaPlayerComprehensive {
  try {
    return JSON.parse(data);
  } catch (err) {
    throw new Error(`Failed to parse OpenDota player comprehensive data: ${err}`);
  }
} 