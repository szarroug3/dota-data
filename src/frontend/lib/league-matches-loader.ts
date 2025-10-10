/**
 * League matches processing utilities
 * Handles fetching and processing Steam league matches data with request deduplication
 */

import type { LeagueMatchInfo, LeagueMatchesCache } from './app-data-types';

// In-flight request cache to deduplicate concurrent requests
const inFlightLeagueRequests = new Map<number, Promise<LeagueMatchesCache | null>>();

/**
 * Raw match data from Steam API
 */
interface RawLeagueMatch {
  match_id: number;
  radiant_team_id?: number;
  dire_team_id?: number;
  players?: Array<{ account_id: number; team_number: number }>;
}

/**
 * Raw league matches response from Steam API
 */
interface RawLeagueMatchesResponse {
  result?: {
    matches?: RawLeagueMatch[];
  };
}

/**
 * Process raw league matches data from Steam API
 * Extracts match info, team IDs, and player IDs
 *
 * @param rawData - Raw response from Steam API /api/leagues/[id]
 * @returns Processed cache entry with match info and team groupings
 */
export function processLeagueMatches(rawData: RawLeagueMatchesResponse): LeagueMatchesCache {
  const matches = rawData.result?.matches || [];

  // Process matches to extract team IDs, player IDs, and group by team
  const matchesMap = new Map<number, LeagueMatchInfo>();
  const matchIdsByTeam = new Map<number, number[]>();

  matches.forEach((match) => {
    // Extract player IDs by team
    const radiantPlayerIds: number[] = [];
    const direPlayerIds: number[] = [];

    (match.players || []).forEach((player) => {
      if (player.team_number === 0) {
        radiantPlayerIds.push(player.account_id);
      } else if (player.team_number === 1) {
        direPlayerIds.push(player.account_id);
      }
    });

    // Store match info
    matchesMap.set(match.match_id, {
      matchId: match.match_id,
      radiantTeamId: match.radiant_team_id,
      direTeamId: match.dire_team_id,
      radiantPlayerIds,
      direPlayerIds,
    });

    // Group match IDs by team
    if (match.radiant_team_id) {
      const existing = matchIdsByTeam.get(match.radiant_team_id) || [];
      existing.push(match.match_id);
      matchIdsByTeam.set(match.radiant_team_id, existing);
    }
    if (match.dire_team_id) {
      const existing = matchIdsByTeam.get(match.dire_team_id) || [];
      existing.push(match.match_id);
      matchIdsByTeam.set(match.dire_team_id, existing);
    }
  });

  return {
    matches: matchesMap,
    matchIdsByTeam,
    fetchedAt: Date.now(),
  };
}

/**
 * Fetch and process league matches from API
 * Automatically deduplicates concurrent requests for the same league
 * Always reuses in-flight requests regardless of force flag
 *
 * @param leagueId - The league ID to fetch matches for
 * @param force - If true, bypasses backend cache (via ?force=true query param)
 * @returns Processed cache entry or null if fetch fails
 */
export async function fetchAndProcessLeagueMatches(
  leagueId: number,
  force = false,
): Promise<LeagueMatchesCache | null> {
  // Always check if request is already in flight - no reason to duplicate
  const existingRequest = inFlightLeagueRequests.get(leagueId);
  if (existingRequest) {
    return existingRequest;
  }

  // Create new request
  const requestPromise = (async () => {
    try {
      const url = force ? `/api/leagues/${leagueId}?force=true` : `/api/leagues/${leagueId}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to fetch league matches: ${response.status} ${response.statusText}`);
      }

      const rawData = await response.json();
      return processLeagueMatches(rawData);
    } catch (error) {
      console.error(`Failed to fetch league matches for league ${leagueId}:`, error);
      return null;
    } finally {
      // Clean up in-flight cache when done
      inFlightLeagueRequests.delete(leagueId);
    }
  })();

  // Cache the promise
  inFlightLeagueRequests.set(leagueId, requestPromise);

  return requestPromise;
}

/**
 * Get league matches from cache or fetch if not cached
 * Handles cache lookup, fetching, and updating the cache
 *
 * @param leagueId - The league ID to get matches for
 * @param cache - The league matches cache Map
 * @param force - If true, bypasses cache and fetches fresh data
 * @returns Cached or newly fetched league matches data, or undefined if fetch fails
 */
export async function getOrFetchLeagueMatches(
  leagueId: number,
  cache: Map<number, LeagueMatchesCache>,
  force = false,
): Promise<LeagueMatchesCache | undefined> {
  // Check cache first (unless force is true)
  if (!force) {
    const cached = cache.get(leagueId);
    if (cached) {
      return cached;
    }
  }

  const processed = await fetchAndProcessLeagueMatches(leagueId, force);
  if (processed) {
    cache.set(leagueId, processed);
    return processed;
  }

  return undefined;
}
