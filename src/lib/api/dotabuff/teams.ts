import { shouldMockService, tryMock } from '@/lib/api';
import { getPlayerData } from '@/lib/api/opendota/players';
import { fetchPage, isAlreadyQueuedResult } from '@/lib/api/shared';
import { cacheService } from '@/lib/cache-service';
import { generateFakeDotabuffTeamMatchesHtml, generateFakeMatchDetails } from '@/lib/fake-data-generator';
import { writeMockData } from '@/lib/mock-data-writer';
import { logWithTimestampToFile } from '@/lib/server-logger';
import { getOpendotaMatchCacheKey, getTeamCacheFilename, getTeamCacheKey } from '@/lib/utils/cache-keys';
import * as cheerio from 'cheerio';
import { getMatch } from '../opendota/matches';

// Function to fetch a single page (mock or real)
async function fetchTeamMatchesPage(teamId: string, pageNum: number, endpoint: string): Promise<string | null> {
  logWithTimestampToFile('log', `[fetchTeamMatchesPage] Called for teamId=${teamId}, pageNum=${pageNum}`);
  const cacheKey = getTeamCacheKey(teamId);
  const pageCacheKey = `${cacheKey}-page-${pageNum}`;
  const pageFilename = getTeamCacheFilename(teamId, pageNum);
  
  // 1. Try mock API for this page
  const mockRes = await tryMock('dotabuff', pageFilename);
  if (mockRes) {
    logWithTimestampToFile('log', `[fetchTeamMatchesPage] Returning mock data for page ${pageNum}`);
    return await mockRes.text();
  }
  
  // 2. Check if we should mock the service
  if (shouldMockService('dotabuff')) {
    logWithTimestampToFile('log', `[fetchTeamMatchesPage] Generating fake data for page ${pageNum}`);
    try {
      const fakeData = generateFakeDotabuffTeamMatchesHtml(teamId, pageNum, pageFilename);
      return fakeData;
    } catch {
      logWithTimestampToFile('warn', `[fetchTeamMatchesPage] No fake data available for teamId=${teamId}, pageNum=${pageNum}`);
      return null;
    }
  }
  
  // 3. Fetch real data through queue
  logWithTimestampToFile('log', `[fetchTeamMatchesPage] Fetching real data for page ${pageNum}`);
  const endpointWithPage = `${endpoint}?page=${pageNum}`;
  
  const result = await fetchPage('dotabuff', pageCacheKey, endpointWithPage, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    },
  });
  logWithTimestampToFile('log', `[fetchTeamMatchesPage] Returning real data for page ${pageNum}`);
  return result;
}

// Extracted helper: checkTeamMatchesCache
async function checkTeamMatchesCache(cacheKey: string, filename: string, leagueId: string, teamId: string): Promise<{ teamName: string; matchIdsByLeague: Record<string, string[]> } | null> {
  logWithTimestampToFile('log', `[getTeamNameAndMatches] Checking cache for key: ${cacheKey}`);
  const cached = await cacheService.get<string>(cacheKey, filename);
  logWithTimestampToFile('log', `[getTeamNameAndMatches] cacheService.get returned type: ${typeof cached}, value: ${JSON.stringify(cached)}`);
  if (cached) {
    logWithTimestampToFile('log', `[getTeamNameAndMatches] Cache hit for key: ${cacheKey}`);
    return parseTeamMatchesHtml(cached, leagueId, teamId);
  }
  logWithTimestampToFile('log', `[getTeamNameAndMatches] Cache miss for key: ${cacheKey}`);
  return null;
}

// Extracted helper: queueTeamMatchesRequest
async function queueTeamMatchesRequest(
  endpoint: string,
  teamId: string,
  leagueId: string,
  cacheKey: string,
  CACHE_TTL: number,
  filename: string
): Promise<string | { status: string; signature: string } | { error: string; status: number }> {
  return await cacheService.queueRequest(
    'dotabuff',
    cacheKey,
    async () => {
      logWithTimestampToFile('log', `[getTeamNameAndMatches] [queueRequest] Fetching Dotabuff HTML for teamId=${teamId}`);
      const htmlPages = await fetchAllDotabuffPages(endpoint, teamId);
      const joinedHtml = htmlPages.join('');
      logWithTimestampToFile('log', `[getTeamNameAndMatches] [queueRequest] Fetched and joined HTML, length=${joinedHtml.length}`);
      // Write combined HTML to cache-dotabuff-team-[id]-matches.html in mock path
      const combinedCacheFile = getTeamCacheFilename(teamId, 0);
      try {
        await writeMockData(combinedCacheFile, joinedHtml, `/teams/${teamId}/matches`);
        logWithTimestampToFile('log', `[getTeamNameAndMatches] [queueRequest] Wrote combined HTML to ${combinedCacheFile}`);
      } catch (err: unknown) {
        logWithTimestampToFile('error', `[getTeamNameAndMatches] [queueRequest] Error writing combined HTML to ${combinedCacheFile}:`, err);
      }
      // Parse and enqueue as side effects
      try {
        const parsed = parseTeamMatchesHtml(joinedHtml, leagueId, teamId);
        logWithTimestampToFile('log', `[getTeamNameAndMatches] [queueRequest] Parsed team matches: ${JSON.stringify(parsed)}`);
        if (parsed && parsed.matchIdsByLeague && parsed.matchIdsByLeague[leagueId]) {
          for (const matchId of parsed.matchIdsByLeague[leagueId]) {
            logWithTimestampToFile('log', `[getTeamNameAndMatches] [queueRequest] Enqueuing matchId=${matchId}`);
            // Refactored: Inline the match job logic so the background job writes data directly
            cacheService.queueRequest(
              'opendota',
              `opendota-match-${matchId}`,
              async () => {
                logWithTimestampToFile('log', `[DOTABUFF] [BGJOB] Starting match job for matchId=${matchId}, teamId=${teamId}`);
                const cacheKey = getOpendotaMatchCacheKey(matchId);
                const filename = `${cacheKey}.json`;
                const MATCH_TTL = 60 * 60 * 24 * 14; // 14 days in seconds
                let matchData: unknown;
                // 1. Try mock data if available
                const mockRes = await tryMock('opendota', filename);
                if (mockRes) {
                  matchData = await mockRes.json();
                } else if (shouldMockService('opendota')) {
                  matchData = generateFakeMatchDetails(Number(matchId), filename);
                } else {
                  matchData = await getMatch(Number(matchId), false, teamId);
                }
                // Write to cache/disk
                await cacheService.set('opendota', cacheKey, matchData, MATCH_TTL, filename);
                logWithTimestampToFile('log', `[DOTABUFF] [BGJOB] Wrote match data to cache for matchId=${matchId}, filename=${filename}`);
                // Queue player jobs if possible
                if (
                  matchData &&
                  typeof matchData === 'object' &&
                  'players' in matchData &&
                  Array.isArray((matchData as { players: unknown[] }).players)
                ) {
                  for (const player of (matchData as { players: Array<{ account_id?: number }> }).players) {
                    if (player.account_id) {
                      getPlayerData(player.account_id, false)
                        .then((playerData: unknown) => {
                          if (playerData && typeof playerData === 'object' && !('status' in playerData)) {
                            logWithTimestampToFile('log', `[DOTABUFF] [BGJOB] Successfully fetched player data for account_id=${player.account_id}`);
                          } else {
                            logWithTimestampToFile('log', `[DOTABUFF] [BGJOB] getPlayerData returned status for account_id=${player.account_id}: ${JSON.stringify(playerData)}`);
                          }
                        })
                        .catch((err: unknown) => {
                          logWithTimestampToFile('error', `[DOTABUFF] [BGJOB] Error fetching player data for account_id=${player.account_id}:`, err);
                        });
                    }
                  }
                }
                logWithTimestampToFile('log', `[DOTABUFF] [BGJOB] Finished match job for matchId=${matchId}, teamId=${teamId}`);
                return matchData;
              },
              CACHE_TTL,
              `opendota-match-${matchId}.json`
            );
          }
        }
      } catch (err: unknown) {
        logWithTimestampToFile('error', `[getTeamNameAndMatches] [queueRequest] Error during parse/enqueue:`, err);
      }
      // Only return the joined HTML for caching
      return joinedHtml;
    },
    CACHE_TTL,
    filename
  );
}

// Extracted helper: handleTeamMatchesResult
function handleTeamMatchesResult(result: unknown, leagueId: string, teamId: string, cacheKey: string):
  | { teamName: string; matchIdsByLeague: Record<string, string[]> }
  | { status: string; signature: string }
  | { error: string; status: number }
{
  logWithTimestampToFile('log', `[getTeamNameAndMatches] cacheService.queueRequest returned type: ${typeof result}, value: ${JSON.stringify(result)}`);
  if (isAlreadyQueuedResult(result)) {
    logWithTimestampToFile('log', `[getTeamNameAndMatches] Already queued for key: ${cacheKey}`);
    return { status: 'queued', signature: cacheKey };
  }
  logWithTimestampToFile('log', `[getTeamNameAndMatches] Returning queueResult for teamId=${teamId}`);
  if (typeof result === 'string') {
    return parseTeamMatchesHtml(result, leagueId, teamId);
  }
  // Sleep for 10 seconds to simulate a long-running queue
   
  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  sleep(10000);
  return result as { error: string; status: number };
}

// Refactored main function
export async function getTeamNameAndMatches(
  teamId: string,
  leagueId: string,
  forceRefresh = false
): Promise<
  | { teamName: string; matchIdsByLeague: Record<string, string[]> }
  | { status: string; signature: string }
  | { error: string; status: number }
> {
  logWithTimestampToFile('log', `[getTeamNameAndMatches] Called with teamId=${teamId}, leagueId=${leagueId}, forceRefresh=${forceRefresh}`);
  const endpoint = `/esports/teams/${teamId}/matches`;
  const cacheKey = getTeamCacheKey(teamId);
  const CACHE_TTL = 60 * 60 * 2; // 2 hours in seconds
  const filename = getTeamCacheFilename(teamId, 0);

  // 1. Check cache for combined HTML
  if (!forceRefresh) {
    const cachedResult = await checkTeamMatchesCache(cacheKey, filename, leagueId, teamId);
    if (cachedResult) return cachedResult;
  }

  // 2. Queue the fetch for all pages if not cached
  const result = await queueTeamMatchesRequest(endpoint, teamId, leagueId, cacheKey, CACHE_TTL, filename);
  return handleTeamMatchesResult(result, leagueId, teamId, cacheKey);
}

// Helper for extracting img alt from HTML
function extractImgAltFromHtml(html: string, selector: string): string | null {
  const $ = cheerio.load(html);
  const img = $(selector).first();
  if (img.length) {
    return img.attr('alt') || null;
  }
  return null;
}

// Helper for matching img alt with regex
function extractImgAltWithRegex(html: string): string | null {
  const imgAltMatch = html.match(/<img[^>]*class=["'][^"']*img-team[^"']*img-avatar[^"']*["'][^>]*alt=["']([^"']+)["'][^>]*>/i)
    || html.match(/<img[^>]*alt=["']([^"']+)["'][^>]*class=["'][^"']*img-team[^"']*img-avatar[^"']*["'][^>]*>/i);
  if (imgAltMatch && imgAltMatch[1]) {
    return imgAltMatch[1];
  }
  return null;
}

function extractTeamNameFromHtml(html: string, teamId: string): string {
  let teamName = extractImgAltFromHtml(html, 'img.img-team.img-avatar');
  if (!teamName) {
    teamName = extractImgAltFromHtml(html, 'img');
  }
  if (!teamName) {
    teamName = extractImgAltWithRegex(html);
  }
  return teamName || teamId;
}

// Helper for extracting match IDs by league
function extractMatchIdsByLeague(html: string, leagueId: string): Record<string, string[]> {
  const matchIdsByLeague: Record<string, string[]> = {};
  const matchIdRegex = /<a[^>]+href=["']\/matches\/(\d+)["'][^>]*>/g;
  let match;
  while ((match = matchIdRegex.exec(html)) !== null) {
    if (!matchIdsByLeague[leagueId]) {
      matchIdsByLeague[leagueId] = [];
    }
    matchIdsByLeague[leagueId].push(match[1]);
  }
  return { [leagueId]: matchIdsByLeague[leagueId] || [] };
}

export function parseTeamMatchesHtml(html: string, leagueId: string, teamId: string): { teamName: string; matchIdsByLeague: Record<string, string[]> } {
  const teamName = extractTeamNameFromHtml(html, teamId);
  const matchIdsByLeague = extractMatchIdsByLeague(html, leagueId);
  return { teamName, matchIdsByLeague };
}

// Helper to validate team result structure
function isValidTeamResult(result: unknown): result is { teamName: string; matchIdsByLeague: Record<string, string[]> } {
  return (
    typeof result === 'object' &&
    result !== null &&
    'teamName' in result &&
    'matchIdsByLeague' in result &&
    typeof (result as { teamName: unknown }).teamName === 'string' &&
    typeof (result as { matchIdsByLeague: unknown }).matchIdsByLeague === 'object'
  );
}

// Helper to check for early return (status or error)
type EarlyReturn = { status: string; signature: string } | { error: string; status?: number } | { error: string };
function getEarlyReturn(result: unknown): EarlyReturn | null {
  if (typeof result === 'object' && result !== null) {
    if ('status' in result && typeof (result as { status?: string }).status === 'string') {
      return result as EarlyReturn;
    }
    if ('error' in result) {
      return result as EarlyReturn;
    }
  }
  return null;
}

// Refactor getTeamAndMatchIds to reduce complexity and remove any
async function getTeamAndMatchIds(
  teamId: string,
  leagueId: string,
  forceRefresh: boolean = false
): Promise<
  | { teamName: string; matchIds: string[] }
  | { status: string; signature: string }
  | { error: string }
> {
  logWithTimestampToFile('log', `[ORCHESTRATION] getTeamAndMatchIds: teamId=${teamId}, leagueId=${leagueId}, forceRefresh=${forceRefresh}`);
  const teamResult = await getTeamNameAndMatches(teamId, leagueId, forceRefresh);
  logWithTimestampToFile('log', `[ORCHESTRATION] getTeamAndMatchIds: teamResult=${JSON.stringify(teamResult)}`);
  const early = getEarlyReturn(teamResult);
  if (early) return early;
  if (!isValidTeamResult(teamResult)) {
    logWithTimestampToFile('log', `[ORCHESTRATION] getTeamAndMatchIds: Unexpected team result structure`);
    return { error: 'Unexpected team result structure' };
  }
  const teamName: string = teamResult.teamName;
  const matchIds: string[] = teamResult.matchIdsByLeague?.[leagueId] || [];
  logWithTimestampToFile('log', `[ORCHESTRATION] getTeamAndMatchIds: teamName=${teamName}, matchIds=${JSON.stringify(matchIds)}`);
  return { teamName, matchIds };
}

// Replace 'any' in queuePlayersFromMatch and fetchAndQueueMatchData
export async function fetchAndQueueMatchData(matchId: string, result: { matches: unknown[] }, teamId: string, bypassCache = false): Promise<void> {
  try {
    logWithTimestampToFile('log', `[ENQUEUE] Attempting to fetch and queue match data for matchId=${matchId}, teamId=${teamId}, bypassCache=${bypassCache}`);
    const matchData = await getMatch(Number(matchId), bypassCache, teamId);
    if (matchData && typeof matchData === 'object' && !('status' in matchData)) {
      logWithTimestampToFile('log', `[ENQUEUE] Successfully fetched match data for matchId=${matchId}, teamId=${teamId}`);
      result.matches.push(matchData);
      await queuePlayersFromMatch(matchData as { players?: Array<{ account_id?: number; player_slot?: number }>; radiant_team_id?: number; dire_team_id?: number }, teamId, matchId, bypassCache);
    } else if (matchData && typeof matchData === 'object' && 'status' in matchData) {
      logWithTimestampToFile('log', `[ENQUEUE] getMatch returned status for matchId=${matchId}: ${JSON.stringify(matchData)}`);
    }
  } catch (err: unknown) {
    logWithTimestampToFile('error', `[ENQUEUE] Error fetching match data for matchId=${matchId}:`, err);
  }
}

async function queuePlayersFromMatch(
  matchData: { players?: Array<{ account_id?: number; player_slot?: number }>; radiant_team_id?: number; dire_team_id?: number },
  teamId: string,
  matchId: string,
  forceRefresh: boolean
): Promise<void> {
  try {
    logWithTimestampToFile('log', `[ENQUEUE] Queueing players from match ${matchId} for team ${teamId}`);
    if (!matchData || !Array.isArray(matchData.players)) {
      logWithTimestampToFile('warn', `[ENQUEUE] No players array in match data for match ${matchId}`);
      return;
    }
    const isRadiant = matchData.radiant_team_id && String(matchData.radiant_team_id) === String(teamId);
    const isDire = matchData.dire_team_id && String(matchData.dire_team_id) === String(teamId);
    if (!isRadiant && !isDire) {
      logWithTimestampToFile('log', `[ENQUEUE] Team ${teamId} not found in match ${matchId} (radiant: ${matchData.radiant_team_id}, dire: ${matchData.dire_team_id})`);
      return;
    }
    const teamPlayers = matchData.players.filter((p: { account_id?: number; player_slot?: number }) =>
      (isRadiant && typeof p.player_slot === 'number' && p.player_slot < 128) ||
      (isDire && typeof p.player_slot === 'number' && p.player_slot >= 128)
    );
    logWithTimestampToFile('log', `[ENQUEUE] Found ${teamPlayers.length} players for team ${teamId} in match ${matchId}`);
    const playerPromises = teamPlayers.map(async (player: { account_id?: number }) => {
      if (!player.account_id) {
        logWithTimestampToFile('warn', `[ENQUEUE] Player missing account_id in match ${matchId}`);
        return;
      }
      try {
        logWithTimestampToFile('log', `[ENQUEUE] Queueing player data for account_id=${player.account_id}`);
        const playerData = await getPlayerData(player.account_id, forceRefresh);
        if (playerData && typeof playerData === 'object' && !('status' in playerData)) {
          logWithTimestampToFile('log', `[ENQUEUE] Successfully fetched player data for account_id=${player.account_id}`);
        } else {
          logWithTimestampToFile('log', `[ENQUEUE] Player data queued for account_id=${player.account_id}: ${JSON.stringify(playerData)}`);
        }
      } catch (err: unknown) {
        logWithTimestampToFile('error', `[ENQUEUE] Error queueing player data for account_id=${player.account_id}:`, err);
      }
    });
    Promise.allSettled(playerPromises).then((results: PromiseSettledResult<void>[]) => {
      const successCount = results.filter((r: PromiseSettledResult<void>) => r.status === 'fulfilled').length;
      logWithTimestampToFile('log', `[ENQUEUE] Background player queueing completed for match ${matchId}. Success: ${successCount}/${teamPlayers.length}`);
    });
  } catch (err: unknown) {
    logWithTimestampToFile('error', `[ENQUEUE] Error in queuePlayersFromMatch for match ${matchId}:`, err);
  }
}

// Utility: Invalidate cache for team, matches, and players
async function invalidateTeamAndRelatedCache(teamId: string, leagueId: string, matchIds: string[], playerIds: string[]): Promise<void> {
  // Invalidate team cache
  const teamCacheKey = getTeamCacheKey(teamId);
  const teamFilename = getTeamCacheFilename(teamId, 0);
  await cacheService.invalidate(teamCacheKey, teamFilename);
  // Invalidate matches
  for (const matchId of matchIds) {
    const matchCacheKey = `opendota-match-${matchId}`;
    const matchFilename = `${matchCacheKey}.json`;
    await cacheService.invalidate(matchCacheKey, matchFilename);
  }
  // Invalidate players
  for (const playerId of playerIds) {
    const playerCacheKey = `opendota-player-${playerId}`;
    const playerFilename = `${playerCacheKey}.json`;
    await cacheService.invalidate(playerCacheKey, playerFilename);
  }
}

// Helper for force refresh
async function handleForceRefresh(teamId: string, leagueId: string): Promise<unknown> {
  const tempTeamInfo = await getTeamAndMatchIds(teamId, leagueId, true); // bypass cache to get matchIds
  if ('status' in tempTeamInfo) return tempTeamInfo;
  if ('error' in tempTeamInfo) return tempTeamInfo;
  await invalidateTeamAndRelatedCache(teamId, leagueId, tempTeamInfo.matchIds, []);
  // Now proceed as normal, but with fresh data
  return handleNormal(teamId, leagueId, true);
}

// Replace 'any' in result objects in handleRefresh and handleNormal
async function handleRefresh(teamId: string, leagueId: string): Promise<unknown> {
  const teamInfo = await getTeamAndMatchIds(teamId, leagueId, true); // bypass cache
  const cachedTeamInfo = await getTeamAndMatchIds(teamId, leagueId, false); // use cache
  if ('status' in teamInfo || 'error' in teamInfo) return teamInfo;
  if ('status' in cachedTeamInfo || 'error' in cachedTeamInfo) return teamInfo; // fallback to new data if cache is missing
  const { matchIds: newMatchIds } = teamInfo;
  const { matchIds: cachedMatchIds } = cachedTeamInfo;
  const newOnlyMatchIds = newMatchIds.filter((id: string) => !cachedMatchIds.includes(id));
  const result: {
    id: string;
    teamId: string;
    teamName: string;
    leagueId: string;
    leagueName: string;
    matchIds: string[];
    matches: unknown[];
    players: unknown[];
    status?: string;
  } = {
    id: `${teamId}-${leagueId}`,
    teamId,
    teamName: teamInfo.teamName,
    leagueId,
    leagueName: leagueId,
    matchIds: newMatchIds,
    matches: [],
    players: []
  };
  await Promise.all(newOnlyMatchIds.map((matchId) => fetchAndQueueMatchData(matchId, result, teamId, true)));
  result.status = (result.matches.length === newMatchIds.length && result.players.length > 0) ? 'ready' : 'partial';
  return result;
}

async function handleNormal(teamId: string, leagueId: string, bypassCache = false): Promise<unknown> {
  logWithTimestampToFile('log', `[ORCHESTRATION] handleNormal: teamId=${teamId}, leagueId=${leagueId}, bypassCache=${bypassCache}`);
  const teamInfo = await getTeamAndMatchIds(teamId, leagueId, bypassCache);
  logWithTimestampToFile('log', `[ORCHESTRATION] handleNormal: teamInfo=${JSON.stringify(teamInfo)}`);
  if ('status' in teamInfo || 'error' in teamInfo) {
    logWithTimestampToFile('log', `[ORCHESTRATION] handleNormal: Early return with status or error: ${JSON.stringify(teamInfo)}`);
    return teamInfo;
  }
  const { teamName, matchIds } = teamInfo;
  logWithTimestampToFile('log', `[ORCHESTRATION] handleNormal: Parsed teamName=${teamName}, matchIds=${JSON.stringify(matchIds)}`);
  const result: {
    id: string;
    teamId: string;
    teamName: string;
    leagueId: string;
    leagueName: string;
    matchIds: string[];
    matches: unknown[];
    players: unknown[];
    status: string;
  } = {
    id: `${teamId}-${leagueId}`,
    teamId,
    teamName,
    leagueId,
    leagueName: leagueId,
    matchIds,
    matches: [],
    players: [],
    status: 'queued'
  };
  logWithTimestampToFile('log', `[ORCHESTRATION] handleNormal: Queuing fetchAndQueueMatchData for ${matchIds.length} matches`);
  const matchPromises = matchIds.map((matchId) => 
    fetchAndQueueMatchData(matchId, result, teamId, false)
      .catch(err => {
        logWithTimestampToFile('error', `[ORCHESTRATION] handleNormal: Error queueing match ${matchId}: ${err}`);
        return null;
      })
  );
  Promise.allSettled(matchPromises).then((results) => {
    const successCount = results.filter(r => r.status === 'fulfilled').length;
    logWithTimestampToFile('log', `[ORCHESTRATION] handleNormal: Background match queueing completed. Success: ${successCount}/${matchIds.length}`);
  });
  logWithTimestampToFile('log', `[ORCHESTRATION] handleNormal: Returning queued status immediately`);
  return result;
}

// Helper: Fetch all Dotabuff team match pages for a team
async function fetchAllDotabuffPages(endpoint: string, teamId: string): Promise<string[]> {
  // Fetch page 1 to determine total pages
  const page1Html = await fetchTeamMatchesPage(teamId, 1, endpoint);
  if (!page1Html) return [];
  const $ = cheerio.load(page1Html);
  let lastPage = 1;
  $('span.last a').each((_, el) => {
    const href = $(el).attr('href') || '';
    const match = href.match(/page=(\d+)/);
    if (match) {
      lastPage = Math.max(lastPage, parseInt(match[1], 10));
    }
  });
  // Fetch all pages (including page 1)
  const pagePromises = [];
  for (let i = 1; i <= lastPage; i++) {
    pagePromises.push(fetchTeamMatchesPage(teamId, i, endpoint));
  }
  const allPages = await Promise.all(pagePromises);
  // Filter out any nulls
  return allPages.filter(Boolean) as string[];
}

/**
 * Orchestrates team import, match queueing, and player queueing.
 * Returns team, match, and player info, and enqueues background jobs as needed.
 * Supports three modes: normal, refresh (bypass cache for new data), forceRefresh (invalidate all cache).
 */
export async function orchestrateTeamImportAndQueue(
  teamId: string,
  leagueId: string,
  forceRefresh = false,
  refresh = false
): Promise<unknown> {
  logWithTimestampToFile('log', `[ORCHESTRATION] Start orchestrateTeamImportAndQueue: teamId=${teamId}, leagueId=${leagueId}, forceRefresh=${forceRefresh}, refresh=${refresh}`);
  let result: unknown;
  try {
    if (forceRefresh) {
      logWithTimestampToFile('log', '[ORCHESTRATION] Calling handleForceRefresh');
      result = await handleForceRefresh(teamId, leagueId);
    } else if (refresh) {
      logWithTimestampToFile('log', '[ORCHESTRATION] Calling handleRefresh');
      result = await handleRefresh(teamId, leagueId);
    } else {
      logWithTimestampToFile('log', '[ORCHESTRATION] Calling handleNormal');
      result = await handleNormal(teamId, leagueId);
    }
    logWithTimestampToFile('log', `[ORCHESTRATION] Orchestration result: ${JSON.stringify(result)}`);
    return result;
  } catch (err: unknown) {
    logWithTimestampToFile('error', `[ORCHESTRATION] Error in orchestrateTeamImportAndQueue:`, err);
    throw err;
  }
} 