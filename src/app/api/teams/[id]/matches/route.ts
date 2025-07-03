/**
 * @openapi
 * /teams/{id}/matches:
 *   post:
 *     tags:
 *       - Teams
 *     summary: Import Dotabuff matches for a team
 *     description: |
 *       This endpoint uses an async/polling pattern. If the data is not available yet, it will queue the fetch and return a 202 response with `{ status: 'queued', signature }`. The client should poll this endpoint until a 200 response with the data is returned.
 *       To force a refresh and bypass the cache, add `?force=true` to the request URL. All cache invalidation and refresh is now handled via this query parameter.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Team ID
 *       - in: query
 *         name: force
 *         required: false
 *         schema:
 *           type: boolean
 *         description: Force refresh - bypass cache and fetch fresh data
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               leagueId:
 *                 type: string
 *                 description: The Dotabuff league ID
 *             required:
 *               - leagueId
 *     responses:
 *       200:
 *         description: Import result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   description: Unique team-league identifier
 *                 teamId:
 *                   type: string
 *                 teamName:
 *                   type: string
 *                 leagueId:
 *                   type: string
 *                 leagueName:
 *                   type: string
 *                 matchIds:
 *                   type: array
 *                   items:
 *                     type: string
 *                 matches:
 *                   type: array
 *                   items:
 *                     type: object
 *                 players:
 *                   type: array
 *                   items:
 *                     type: object
 *       202:
 *         description: Data is being fetched; client should poll until 200 is returned.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: queued
 *                 signature:
 *                   type: string
 *       400:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
import { fetchAndQueueMatchData, getTeamNameAndMatches, parseTeamMatchesHtml } from '@/lib/api/dotabuff/teams';
import { cacheService } from '@/lib/cache-service';
import { logWithTimestampToFile } from '@/lib/server-logger';
import { getTeamCacheFilename, getTeamCacheKey } from '@/lib/utils/cache-keys';
import { NextRequest } from 'next/server';

const debug = (...args: unknown[]) => {
  logWithTimestampToFile('log', '[TEAM IMPORT POLL]', ...args);
};

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { searchParams } = new URL(request.url);
  const leagueId = searchParams.get('leagueId');
  if (!leagueId) {
    debug('Missing leagueId query parameter');
    return new Response(JSON.stringify({ error: 'Missing leagueId query parameter' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  const { id } = await params;
  const teamCacheKey = getTeamCacheKey(id);
  const teamFilename = getTeamCacheFilename(id);
  const cachedData = await cacheService.get<string>(teamCacheKey, teamFilename);
  debug('GET: Data exists in cache?', cachedData, 'for', teamFilename);
  if (!cachedData) {
    debug('GET: Combined team HTML cache file missing:', teamFilename);
    return new Response(JSON.stringify({ status: 'queued', signature: `${id}-${leagueId}` }), { status: 202 });
  }
  const parsed = parseTeamMatchesHtml(cachedData, leagueId, id);
  // Do NOT start enrichment in the background for GET
  debug('Returning parsed Dotabuff data only (GET). No enrichment started.');
  return new Response(JSON.stringify(parsed), { status: 200, headers: { 'Content-Type': 'application/json' } });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  debug('POST: Handler called');
  const { id } = await params;
  let leagueId: string | undefined;
  try {
    const body = await request.json();
    leagueId = body.leagueId;
  } catch (err) {
    debug('POST: Failed to parse JSON body', err);
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 });
  }
  if (!leagueId) {
    debug('POST: Missing leagueId in body');
    return new Response(JSON.stringify({ error: 'Missing leagueId in body' }), { status: 400 });
  }
  const teamCacheKey = getTeamCacheKey(id);
  const teamFilename = getTeamCacheFilename(id);
  const teamHtml = await cacheService.get<string>(teamCacheKey, teamFilename);
  if (teamHtml) {
    const parsed = parseTeamMatchesHtml(teamHtml, leagueId, id);
    const matchIds = parsed.matchIdsByLeague?.[leagueId] || [];
    // Start enrichment in the background, but do not await
    (async () => {
      for (const matchId of matchIds) {
        fetchAndQueueMatchData(matchId, { matches: [] }, id, false);
      }
    })();
    debug('POST: Returning parsed Dotabuff data immediately after parsing. Enrichment is running in background.');
    return new Response(JSON.stringify({ status: 'ready', signature: `${id}-${leagueId}` }), { status: 200 });
  }
  debug('POST: Starting background job for team import', { id, leagueId });
  (async () => {
    debug('POST: Background job IIFE started', { id, leagueId });
    try {
      await getTeamNameAndMatches(id, leagueId, true);
      debug('POST: Background job completed for team import', { id, leagueId });
    } catch (err) {
      debug('POST: Background job error', err);
    }
  })();
  return new Response(JSON.stringify({ status: 'queued', signature: `${id}-${leagueId}` }), { status: 202 });
}
