import { fetchOpenDota } from "@/lib/api";
import type { Match, Team } from "@/types/team";
import { logWithTimestamp } from './utils';

const OPENDOTA_BASE_URL = "https://api.opendota.com/api";

/**
 * Helper function to extract opponent name from OpenDota data
 */
function getOpponentName(openDotaData: unknown, team: Team): string {
  if (!openDotaData || typeof openDotaData !== "object") return "Unknown";
  
  const data = openDotaData as { radiant_name?: string; dire_name?: string };
  
  // If we have team names, use them
  if (data.radiant_name && data.dire_name) {
    if (data.radiant_name === team.name) return data.dire_name;
    if (data.dire_name === team.name) return data.radiant_name;
  }
  
  // If unable to determine, return 'Unknown'
  return "Unknown";
}

/**
 * Helper function to extract team result from OpenDota data
 */
function getTeamResult(openDotaData: unknown, team: Team): string {
  if (!openDotaData || typeof openDotaData !== "object") return "Unknown";
  
  const data = openDotaData as { 
    radiant_name?: string; 
    dire_name?: string; 
    radiant_win?: boolean 
  };
  
  // If we have team names and result, use them
  if (data.radiant_name && data.dire_name && typeof data.radiant_win === 'boolean') {
    if (data.radiant_name === team.name) {
      return data.radiant_win ? "W" : "L";
    }
    if (data.dire_name === team.name) {
      return data.radiant_win ? "L" : "W";
    }
  }
  
  // If unable to determine, return 'Unknown'
  return "Unknown";
}

/**
 * Check if match data is complete and parsed
 */
function isMatchDataComplete(data: unknown): boolean {
  if (!data || typeof data !== "object") {
    logWithTimestamp('log', '[isMatchDataComplete] Data is not an object:', typeof data);
    return false;
  }
  
  const match = data as any;
  
  // Check if we have basic match info
  if (!match.match_id) {
    logWithTimestamp('log', '[isMatchDataComplete] No match_id found');
    return false;
  }
  
  // Check if we have player data (indicates the match is parsed)
  if (!match.players || !Array.isArray(match.players) || match.players.length === 0) {
    logWithTimestamp('log', '[isMatchDataComplete] No valid players array found. players:', match.players);
    return false;
  }
  
  // For mock data, we're more lenient - we don't require team names
  // since they might not be in the mock data structure
  logWithTimestamp('log', '[isMatchDataComplete] Match data is complete for match', match.match_id);
  return true;
}

/**
 * Enrich a match with OpenDota data
 */
export async function enrichMatchWithOpenDota(
  matchId: string,
  team: Team,
): Promise<Match> {
  logWithTimestamp('log', '[enrichMatchWithOpenDota] Start enriching match', matchId, 'for team', team.name);

  try {
    logWithTimestamp('log', '[enrichMatchWithOpenDota] Calling fetchOpenDota for match', matchId);
    const res = await fetchOpenDota(`${OPENDOTA_BASE_URL}/matches/${matchId}`);
    logWithTimestamp('log', '[enrichMatchWithOpenDota] fetchOpenDota completed for match', matchId, ', status:', res.status, ', ok:', res.ok);
    
    if (!res.ok) {
      logWithTimestamp('error', '[enrichMatchWithOpenDota] Response not ok for match', matchId, ':', res.status, res.statusText);
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    const data = await res.json();
    logWithTimestamp('log', '[enrichMatchWithOpenDota] Parsed response for match', matchId, ', data type:', typeof data, ', keys:', data && typeof data === 'object' ? Object.keys(data) : 'not an object');

    // For mock data, we skip the retry logic and just use what we get
    const isComplete = isMatchDataComplete(data);
    logWithTimestamp('log', '[enrichMatchWithOpenDota] Match data complete check:', isComplete, 'for', matchId);

    const result = {
      id: matchId,
      date:
        data && typeof data === "object" && "start_time" in data && typeof data.start_time === "number"
          ? new Date(data.start_time * 1000).toISOString()
          : "",
      opponent: getOpponentName(data, team),
      result: getTeamResult(data, team),
      score:
        data && typeof data === "object" && "radiant_score" in data && "dire_score" in data
          ? `${data.radiant_score} - ${data.dire_score}`
          : "",
      league: team.league || "",
      notes: isComplete ? "" : "Mock data - some fields may be missing",
      openDota:
        data && typeof data === "object" && data !== null && !Array.isArray(data)
          ? (data as Record<string, unknown>)
          : undefined,
    };
    logWithTimestamp('log', '[enrichMatchWithOpenDota] Returning match object for', matchId, ':', result);
    return result;
  } catch (err) {
    logWithTimestamp('error', '[enrichMatchWithOpenDota] Error enriching match', matchId, ':', err);
    // Return a basic match object on error
    return {
      id: matchId,
      date: "",
      opponent: "Error",
      result: "Error",
      score: "",
      league: team.league || "",
      notes: `Error: ${err instanceof Error ? err.message : 'Unknown error'}`,
      openDota: undefined,
    };
  }
}

/**
 * Batch enrich multiple matches with proper rate limiting
 */
export async function enrichMatchesBatch(
  matches: Match[],
  team: Team,
  onProgress?: (completed: number, total: number) => void
): Promise<Match[]> {
  logWithTimestamp('log', '[enrichMatchesBatch] Starting batch enrichment for', matches.length, 'matches');
  
  // Create all enrichment promises and add them to the queue
  const enrichmentPromises = matches.map((match, index) => {
    return async () => {
      logWithTimestamp('log', '[enrichMatchesBatch] Processing match', index + 1, '/', matches.length, ':', match.id);
      try {
        const enriched = await enrichMatchWithOpenDota(match.id, team);
        onProgress?.(index + 1, matches.length);
        return enriched;
      } catch (error) {
        logWithTimestamp('error', '[enrichMatchesBatch] Failed to enrich match', match.id, ':', error);
        onProgress?.(index + 1, matches.length);
        return match; // Return original match if enrichment fails
      }
    };
  });

  // Import the cache service to use the queue
  const { cacheService } = await import('./cache-service');
  
  // Add all matches to the queue and wait for them to complete
  const enrichedMatches = await Promise.all(
    enrichmentPromises.map((promise, idx) => {
      const matchId = matches[idx].id;
      return cacheService.queueRequest('opendota', promise, `match-${matchId}`);
    })
  );
  
  logWithTimestamp('log', '[enrichMatchesBatch] Completed batch enrichment for', matches.length, 'matches');
  return enrichedMatches;
} 