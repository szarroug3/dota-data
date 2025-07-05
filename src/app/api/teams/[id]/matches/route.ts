/**
 * @openapi
 * /teams/{id}/matches:
 *   post:
 *     tags:
 *       - Teams
 *     summary: Get team name and match list from Dotabuff
 *     description: |
 *       Returns team name and match IDs from Dotabuff API.
 *       Fetches team data and returns structured team information with match IDs.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Team ID
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
 *               force:
 *                 type: boolean
 *                 description: Force refresh - bypass cache and fetch fresh data
 *             required:
 *               - leagueId
 *     responses:
 *       200:
 *         description: Team data with match IDs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 teamName:
 *                   type: string
 *                   description: Team name from Dotabuff
 *                 matchIdsByLeague:
 *                   type: object
 *                   description: Match IDs organized by league
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
import { getTeamNameAndMatches } from '@/lib/api/dotabuff/teams';
import { cacheService } from '@/lib/cache-service';
import { logWithTimestampToFile } from '@/lib/server-logger';
import { getTeamCacheFilename, getTeamCacheKey } from '@/lib/utils/cache-keys';
import { NextRequest } from 'next/server';
import { TeamMatchesRequest, TeamMatchesResponse, ApiErrorResponse } from '@/types/api';


const debug = (...args: unknown[]) => {
  logWithTimestampToFile('log', '[TEAM IMPORT POLL]', ...args);
};

async function parseRequestBody(request: NextRequest): Promise<TeamMatchesRequest> {
  return await request.json() as TeamMatchesRequest;
}

function validateRequestBody(body: TeamMatchesRequest): string | null {
  if (!body.leagueId) {
    return 'Missing leagueId in body';
  }
  return null;
}

async function getCachedTeamData(teamCacheKey: string, teamFilename: string): Promise<Response | null> {
  const cachedData = await cacheService.get<string>(teamCacheKey, teamFilename);
  if (cachedData) {
    try {
      const parsed = typeof cachedData === 'string' ? JSON.parse(cachedData) : cachedData;
      if (parsed && typeof parsed === 'object' && 'teamName' in parsed && 'matchIdsByLeague' in parsed) {
        debug('POST: Team data found in cache, returning parsed data');
        return createSuccessResponse(parsed as TeamMatchesResponse);
      }
    } catch (parseErr) {
      debug('POST: Failed to parse cached data:', parseErr);
    }
  }
  return null;
}

function createErrorResponse(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message, status } as ApiErrorResponse), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

function createSuccessResponse(data: TeamMatchesResponse): Response {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

async function fetchAndProcessTeamData(id: string, leagueId: string, _teamCacheKey: string, _teamFilename: string): Promise<Response> {
  try {
    const result = await getTeamNameAndMatches(id, leagueId, true);
    if (result && typeof result === 'object' && 'teamName' in result && 'matchIdsByLeague' in result) {
      debug('POST: Team data fetched successfully');
      return createSuccessResponse(result as TeamMatchesResponse);
    } else if (isApiErrorResponse(result)) {
      return createErrorResponse(result.error, 500);
    } else {
      // If result is a status response, wait for completion and retry
      debug('POST: Request queued, waiting for completion');
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
      return await fetchAndProcessTeamData(id, leagueId, _teamCacheKey, _teamFilename);
    }
  } catch (err) {
    debug('POST: Error fetching team data:', err);
    return createErrorResponse('Failed to fetch team data', 500);
  }
}

function isApiErrorResponse(obj: unknown): obj is ApiErrorResponse {
  return obj !== null && typeof obj === 'object' && 'error' in obj && typeof (obj as Record<string, unknown>).error === 'string';
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  debug('POST: Handler called');
  const { id } = await params;

  let body: TeamMatchesRequest;
  try {
    body = await parseRequestBody(request);
  } catch (err) {
    debug('POST: Failed to parse JSON body', err);
    return createErrorResponse('Invalid JSON body', 400);
  }

  const validationError = validateRequestBody(body);
  if (validationError) {
    debug('POST: Missing leagueId in body');
    return createErrorResponse(validationError, 400);
  }

  const { leagueId, force = false } = body;
  const teamCacheKey = getTeamCacheKey(id);
  const teamFilename = getTeamCacheFilename(id);

  // Check cache first (unless force refresh)
  if (!force) {
    const cachedResponse = await getCachedTeamData(teamCacheKey, teamFilename);
    if (cachedResponse) {
      return cachedResponse;
    }
  }

  // If force refresh or not in cache, invalidate and fetch fresh data
  if (force) {
    debug('POST: Force refresh requested, invalidating cache');
    await cacheService.invalidate(teamCacheKey, teamFilename);
  }

  debug('POST: Team data not in cache, fetching and waiting for completion');

  return await fetchAndProcessTeamData(id, leagueId, teamCacheKey, teamFilename);
}
