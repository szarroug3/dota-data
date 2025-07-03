import { fetchAPI } from "@/lib/api";
import type { OpenDotaFullMatch } from "@/types/opendota";
import type { Match, Team } from "@/types/team";
import { getPlayerData } from './api';
import { logWithTimestamp } from './utils';

/**
 * Helper function to extract opponent name from OpenDota data
 */
function getOpponentName(openDotaData: OpenDotaFullMatch | undefined, team: Team): string {
  if (!openDotaData) return "Unknown";
  if (openDotaData.radiant_name && openDotaData.dire_name) {
    if (openDotaData.radiant_name === (team.teamName || team.id)) return openDotaData.dire_name;
    if (openDotaData.dire_name === (team.teamName || team.id)) return openDotaData.radiant_name;
  }
  return "Unknown";
}

// Helper to determine if a team is Radiant or Dire
function getTeamSide(openDotaData: OpenDotaFullMatch | undefined, team: Team): "Radiant" | "Dire" | "Unknown" {
  if (!openDotaData) return "Unknown";
  const radiantTeamId = openDotaData.radiant_team_id?.toString();
  const direTeamId = openDotaData.dire_team_id?.toString();
  if (radiantTeamId === team.id) return "Radiant";
  if (direTeamId === team.id) return "Dire";
  return "Unknown";
}

function getTeamResult(openDotaData: OpenDotaFullMatch | undefined, team: Team): string {
  if (!openDotaData) return "Unknown";
  const side = getTeamSide(openDotaData, team);
  if (side === "Radiant" && typeof openDotaData.radiant_win === "boolean") {
    return openDotaData.radiant_win ? "W" : "L";
  }
  if (side === "Dire" && typeof openDotaData.radiant_win === "boolean") {
    return openDotaData.radiant_win ? "L" : "W";
  }
  return "Unknown";
}

function getActiveTeamPlayers(data: OpenDotaFullMatch | undefined, team: Team): (OpenDotaFullMatch["players"][number])[] {
  if (!data || !Array.isArray(data.players)) return [];
  const side = getTeamSide(data, team);
  if (side === "Radiant") {
    return data.players.filter((p) => p.isRadiant || (typeof p.player_slot === 'number' && p.player_slot < 128));
  } else if (side === "Dire") {
    return data.players.filter((p) => !p.isRadiant && (typeof p.player_slot === 'number' && p.player_slot >= 128));
  }
  return [];
}

async function fetchAndCachePlayerData(accountId: number): Promise<void> {
  await getPlayerData(Number(accountId));
}

/**
 * Check if match data is complete and parsed
 */
function isMatchDataComplete(data: OpenDotaFullMatch | undefined): boolean {
  if (!data) {
    logWithTimestamp('log', '[isMatchDataComplete] Data is undefined');
    return false;
  }
  if (!('match_id' in data) || data.match_id == null) {
    logWithTimestamp('log', '[isMatchDataComplete] No match_id found');
    return false;
  }
  if (!Array.isArray(data.players) || data.players.length === 0) {
    logWithTimestamp('log', '[isMatchDataComplete] No valid players array found. players:', data.players);
    return false;
  }
  logWithTimestamp('log', '[isMatchDataComplete] Match data is complete for match', data.match_id);
  return true;
}

function buildEnrichedMatchResult(
  matchId: string,
  data: OpenDotaFullMatch | undefined,
  team: Team,
  isComplete: boolean
): Match {
  return {
    id: matchId,
    date:
      data && typeof data.start_time === "number"
        ? new Date(data.start_time * 1000).toISOString()
        : "",
    opponent: getOpponentName(data, team),
    result: getTeamResult(data, team),
    score:
      data && typeof data.radiant_score === "number" && typeof data.dire_score === "number"
        ? `${data.radiant_score} - ${data.dire_score}`
        : "",
    league: team.leagueId || "",
    notes: isComplete ? "" : "Mock data - some fields may be missing",
    openDota: data,
  };
}

/**
 * Enrich a match with OpenDota data
 */
export async function enrichMatchWithOpenDota(
  matchId: string,
  team: Team,
): Promise<Match> {
  logWithTimestamp('log', '[enrichMatchWithOpenDota] Start enriching match', matchId, 'for team', (team.teamName || team.id));
  logWithTimestamp('log', '[enrichMatchWithOpenDota] Calling fetchOpenDota for match', matchId);
  const endpoint = `/matches/${matchId}`;
  logWithTimestamp('log', '[enrichMatchWithOpenDota] fetchFromAPI endpoint:', endpoint);
  let data: OpenDotaFullMatch | undefined;
  try {
    data = await fetchAPI('opendota', endpoint, `opendota-match-${matchId}`) as OpenDotaFullMatch;
    logWithTimestamp('log', '[enrichMatchWithOpenDota] fetchFromAPI completed for match', matchId);
  } catch (err) {
    logWithTimestamp('error', '[enrichMatchWithOpenDota] fetchFromAPI error for match', matchId, ':', (err as Error)?.message || err);
    throw err;
  }

  // Enqueue player requests for active team players only
  const activeTeamPlayers = getActiveTeamPlayers(data, team);
  await Promise.all(
    activeTeamPlayers
      .filter((player) => player.account_id)
      .map((player) => fetchAndCachePlayerData(player.account_id!))
  );

  const isComplete = isMatchDataComplete(data);
  logWithTimestamp('log', '[enrichMatchWithOpenDota] Match data complete check:', isComplete, 'for', matchId);

  const result = buildEnrichedMatchResult(matchId, data, team, isComplete);
  logWithTimestamp('log', '[enrichMatchWithOpenDota] Returning match object for', matchId, ':', result);
  return result;
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

  // Add all matches to the queue and wait for them to complete
  const enrichedMatches = await Promise.all(
    enrichmentPromises.map((promise) => promise())
  );
  
  logWithTimestamp('log', '[enrichMatchesBatch] Completed batch enrichment for', matches.length, 'matches');
  return enrichedMatches;
} 