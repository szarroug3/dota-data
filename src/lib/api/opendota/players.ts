import path from 'path';

import { request, requestWithRetry } from '@/lib/utils/request';
import {
  OpenDotaPlayer,
  OpenDotaPlayerComprehensive,
  OpenDotaPlayerHero,
  OpenDotaPlayerMatches,
  OpenDotaPlayerWL,
} from '@/types/external-apis';

/**
 * Fetch comprehensive Dota 2 player data from OpenDota using the generic request function.
 *
 * Calls only the endpoints used by the frontend:
 * - players/{playerId} (profile)
 * - players/{playerId}/heroes
 * - players/{playerId}/matches
 * - players/{playerId}/wl
 *
 * Unused fields are omitted from the response shape. Data is cached for 24h to minimize
 * repeated traffic. A small inter-call delay is included
 * to respect OpenDota's 1 req/sec guidance. Retries/backoff for 429/5xx are handled
 * by the shared requestWithRetry helper.
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
    cacheKey,
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
  const delayMs = 1100;

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
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // 1. Profile
  const profile: OpenDotaPlayer = await fetchJson(`${baseUrl}/players/${playerId}`);
  await delay(delayMs);

  // 2. Heroes (used by frontend)
  const heroes: OpenDotaPlayerHero[] = await fetchJson(`${baseUrl}/players/${playerId}/heroes`);
  await delay(delayMs);

  // 3. Matches (recentMatches used by frontend)
  const recentMatches: OpenDotaPlayerMatches[] = await fetchJson(`${baseUrl}/players/${playerId}/matches`);
  await delay(delayMs);

  // 4. Win/Loss (used by frontend)
  const wl: OpenDotaPlayerWL = await fetchJson(`${baseUrl}/players/${playerId}/wl`);
  await delay(delayMs);

  const comprehensiveData = {
    profile,
    heroes,
    recentMatches,
    wl,
  } as OpenDotaPlayerComprehensive;

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
