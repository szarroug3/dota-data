import { shouldMockService, tryMock } from '@/lib/api';
import { fetchAPI } from '@/lib/api/shared';
import { cacheService } from '@/lib/cache-service';
import { generateFakeMatch } from '@/lib/fake-data-generators/match-generator';
import { logWithTimestampToFile } from '@/lib/server-logger';
import { getOpendotaMatchCacheKey, getOpendotaPublicMatchesCacheKey } from '@/lib/utils/cache-keys';
import { getPlayerData } from '../opendota/players';



// Define explicit types for player and match data
export interface Player {
  account_id?: number;
  player_slot: number;
}

export interface MatchData {
  players: Player[];
  radiant_team_id?: number;
  dire_team_id?: number;
  [key: string]: unknown;
}

// Helper: filter players for a team
function filterPlayersForTeam(players: Player[], teamId: string, radiantTeamId?: number, direTeamId?: number): Player[] {
  if (!teamId) return [];
  const teamIdNum = Number(teamId);
  const isRadiant = radiantTeamId && teamIdNum === radiantTeamId;
  const isDire = direTeamId && teamIdNum === direTeamId;
  return players.filter((p) =>
    (isRadiant && typeof p.player_slot === 'number' && p.player_slot < 128) ||
    (isDire && typeof p.player_slot === 'number' && p.player_slot >= 128)
  );
}

// Helper: convert compatible object to MatchData
function toMatchData(obj: unknown): MatchData | null {
  if (
    obj &&
    typeof obj === 'object' &&
    'players' in obj &&
    Array.isArray((obj as { players: unknown[] }).players) &&
    (obj as { players: unknown[] }).players.every((p) => typeof (p as Player).player_slot === 'number')
  ) {
    return obj as MatchData;
  }
  return null;
}

// Helper: queue a single player
async function queuePlayer(accountId: number, matchId: number, forceRefresh: boolean): Promise<void> {
  await getPlayerData(accountId, forceRefresh);
}

// Refactored main function
export async function queuePlayersForTeam(matchData: MatchData | object, teamId: string, matchId: number, forceRefresh: boolean): Promise<void> {
  const match = toMatchData(matchData);
  if (!match) {
    logWithTimestampToFile('warn', '[queuePlayersForTeam] Invalid matchData or teamId');
    return;
  }
  logWithTimestampToFile('log', `[queuePlayersForTeam] CALLED with teamId=${teamId}, matchId=${matchId}, forceRefresh=${forceRefresh}, matchData keys=${Object.keys(match)}`);
  const { players, radiant_team_id, dire_team_id } = match;
  const teamPlayers = filterPlayersForTeam(players, teamId, radiant_team_id, dire_team_id);
  logWithTimestampToFile('log', `[queuePlayersForTeam] Found ${teamPlayers.length} players for team ${teamId} in match ${matchId}`);
  await Promise.all(
    teamPlayers.map(async (player) => {
      if (player.account_id) {
        await queuePlayer(player.account_id, matchId, forceRefresh);
      } else {
        logWithTimestampToFile('warn', `[queuePlayersForTeam] Player missing account_id in match ${matchId}`);
      }
    })
  );
}

// Helper to handle queueing players for a match
async function handleQueuePlayersForMatch(data: unknown, teamId: string | undefined, matchId: number, forceRefresh: boolean) {
  if (teamId) {
    const match = toMatchData(data);
    if (match) {
      try {
        await queuePlayersForTeam(match, teamId, matchId, forceRefresh);
        logWithTimestampToFile('log', `[handleQueuePlayersForMatch] Finished queuePlayersForTeam for matchId=${matchId}, teamId=${teamId}`);
      } catch (err) {
        logWithTimestampToFile('error', `[handleQueuePlayersForMatch] Error queueing players for matchId=${matchId}:`, err);
      }
    } else {
      logWithTimestampToFile('warn', '[handleQueuePlayersForMatch] Skipping invalid match data');
    }
  }
}

export async function getMatch(
  matchId: number, 
  forceRefresh = false,
  teamId?: string
): Promise<unknown> {
  const cacheKey = getOpendotaMatchCacheKey(matchId.toString());
  const filename = `${cacheKey}.json`;
  const MATCH_TTL = 60 * 60 * 24 * 14; // 14 days in seconds

  // 1. Check cache for data (unless force refresh)
  if (!forceRefresh) {
    const cached = await cacheService.get<unknown>(cacheKey, filename, MATCH_TTL);
    if (cached) {
      // Queue players if teamId is provided
      await handleQueuePlayersForMatch(cached, teamId, matchId, forceRefresh);
      return cached;
    }
  }

  // 2. Try mock data if available
  const mockRes = await tryMock('opendota', filename);
  if (mockRes) {
    const data = await mockRes.json();
    await cacheService.set('opendota', cacheKey, data, MATCH_TTL, filename);
    // Queue players if teamId is provided
    await handleQueuePlayersForMatch(data, teamId, matchId, forceRefresh);
    return data;
  }
  
  // 3. Check if we should use mock service
  if (shouldMockService('opendota')) {
    const fakeData = generateFakeMatch(matchId, filename);
    await cacheService.set('opendota', cacheKey, fakeData, MATCH_TTL, filename);
    // Queue players if teamId is provided
    await handleQueuePlayersForMatch(fakeData, teamId, matchId, forceRefresh);
    return fakeData;
  }
  
  // 4. Fetch real data
  const data = await fetchAPI<unknown>('opendota', `/matches/${matchId}`, cacheKey);
  
  // 5. Write processed data to cache
  await cacheService.set('opendota', cacheKey, data, MATCH_TTL, filename);
  
  // 6. Queue players if teamId is provided (after data is cached)
  await handleQueuePlayersForMatch(data, teamId, matchId, forceRefresh);
  
  // 7. Return processed data
  return data;
}

export async function refreshMatchDetails(
  matchId: number,
  teamId?: string
): Promise<unknown> {
  const cacheKey = getOpendotaMatchCacheKey(matchId.toString());
  const filename = `${cacheKey}.json`;
  const MATCH_TTL = 60 * 60 * 24 * 14; // 14 days in seconds
  await cacheService.invalidate(cacheKey, filename);
  
  // 2. Try mock data if available
  const mockRes = await tryMock('opendota', filename);
  if (mockRes) {
    const data = await mockRes.json();
    await cacheService.set('opendota', cacheKey, data, MATCH_TTL, filename);
    // Queue players if teamId is provided
    await handleQueuePlayersForMatch(data, teamId, matchId, false);
    return data;
  }
  
  // 3. Check if we should use mock service
  if (shouldMockService('opendota')) {
    const fakeData = generateFakeMatch(matchId, filename);
    await cacheService.set('opendota', cacheKey, fakeData, MATCH_TTL, filename);
    // Queue players if teamId is provided
    await handleQueuePlayersForMatch(fakeData, teamId, matchId, false);
    return fakeData;
  }
  
  // 4. Fetch real data
  const data = await fetchAPI<unknown>('opendota', `/matches/${matchId}`, cacheKey);
  
  // 5. Write processed data to cache
  await cacheService.set('opendota', cacheKey, data, MATCH_TTL, filename);
  
  // 6. Queue players if teamId is provided (after data is cached)
  await handleQueuePlayersForMatch(data, teamId, matchId, false);
  
  // 7. Return processed data
  return data;
}

export async function getPublicMatches(limit: number = 100): Promise<unknown[]> {
  const cacheKey = getOpendotaPublicMatchesCacheKey(limit.toString());
  const filename = `${cacheKey}.json`;
  const MATCHES_TTL = 60 * 60; // 1 hour in seconds

  // 1. Check cache for data
  const cached = await cacheService.get<unknown[]>(cacheKey, filename, MATCHES_TTL);
  if (cached) return cached;

  // 2. Try mock data if available
  const mockRes = await tryMock('opendota', filename);
  if (mockRes) {
    const data = await mockRes.json();
    await cacheService.set('opendota', cacheKey, data, MATCHES_TTL, filename);
    return data;
  }
  
  // 3. Check if we should use mock service
  if (shouldMockService('opendota')) {
    const fakeData = Array.from({ length: limit }, (_, i) => generateFakeMatch(9000000000 + i, `${9000000000 + i}.json`));
    await cacheService.set('opendota', cacheKey, fakeData, MATCHES_TTL, filename);
    return fakeData;
  }
  
  // 4. Fetch real data
  const data = await fetchAPI<unknown[]>("opendota", `/publicMatches?limit=${limit}`, cacheKey);
  
  // 5. Write processed data to cache
  await cacheService.set('opendota', cacheKey, data, MATCHES_TTL, filename);
  
  // 6. Return processed data
  return data;
} 