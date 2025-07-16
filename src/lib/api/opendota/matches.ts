import path from 'path';

import { request, requestWithRetry } from '@/lib/utils/request';
import { OpenDotaMatch } from '@/types/external-apis';

/**
 * Fetches a Dota 2 match from OpenDota using the generic request function.
 * OpenDota endpoint: https://api.opendota.com/api/matches/{matchId}
 *
 * @param matchId The match ID to fetch
 * @param force If true, bypasses cache and fetches fresh data
 * @returns OpenDotaMatch object
 */
export async function fetchOpenDotaMatch(matchId: string, force = false): Promise<OpenDotaMatch> {
  const cacheKey = `opendota:match:${matchId}`;
  const cacheTTL = 60 * 60 * 24 * 14; // 14 days
  const mockFilename = path.join(process.cwd(), 'mock-data', 'matches', `match-${matchId}.json`);

  const result = await request<OpenDotaMatch>(
    'opendota',
    () => fetchMatchFromOpenDota(matchId),
    (data: string) => parseOpenDotaMatch(data),
    mockFilename,
    force,
    cacheTTL,
    cacheKey
  );

  if (!result) {
    throw new Error(`Failed to fetch match data for match ${matchId}`);
  }

  return result;
}

/**
 * Fetch match from OpenDota API
 */
async function fetchMatchFromOpenDota(matchId: string): Promise<string> {
  const url = `${process.env.OPENDOTA_API_BASE_URL || 'https://api.opendota.com/api'}/matches/${matchId}`;
  
  try {
    const response = await requestWithRetry('GET', url);
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Match not found');
      }
      throw new Error(`OpenDota API error: ${response.status} ${response.statusText}`);
    }
    
    return await response.text();
  } catch (err) {
    throw new Error(`Failed to fetch match from OpenDota: ${err}`);
  }
}

/**
 * Parse OpenDota match data
 */
function parseOpenDotaMatch(data: string): OpenDotaMatch {
  try {
    const match = JSON.parse(data) as OpenDotaMatch;
    return match;
  } catch (err) {
    throw new Error(`Failed to parse OpenDota match data: ${err}`);
  }
} 