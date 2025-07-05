/**
 * @openapi
 * /teams/{id}/matches:
 *   post:
 *     tags:
 *       - Teams
 *     summary: Import Dotabuff matches for a team
 *     description: |
 *       Returns team name and match IDs immediately if cached, or waits for import to complete.
 *       Always returns 200 with the actual data.
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

const debug = (...args: unknown[]) => {
  logWithTimestampToFile('log', '[TEAM IMPORT POLL]', ...args);
};

interface RequestBody {
  leagueId: string;
  force?: boolean;
}

async function parseRequestBody(request: NextRequest): Promise<RequestBody> {
  return await request.json() as RequestBody;
}

function validateRequestBody(body: RequestBody): string | null {
  if (!body.leagueId) {
    return 'Missing leagueId in body';
  }
  return null;
}

async function getCachedTeamData(teamCacheKey: string, teamFilename: string): Promise<Response | null> {
  const cachedData = await cacheService.get<string>(teamCacheKey, teamFilename);
  if (cachedData) {
    try {
      // Parse the cached JSON data
      const parsed = typeof cachedData === 'string' ? JSON.parse(cachedData) : cachedData;
      if (parsed && typeof parsed === 'object' && 'teamName' in parsed && 'matchIdsByLeague' in parsed) {
        debug('POST: Team data found in cache, returning parsed data');
        return new Response(JSON.stringify(parsed), { 
          status: 200, 
          headers: { 'Content-Type': 'application/json' } 
        });
      }
    } catch (parseErr) {
      debug('POST: Failed to parse cached data:', parseErr);
    }
  }
  return null;
}

function createErrorResponse(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), { 
    status, 
    headers: { 'Content-Type': 'application/json' } 
  });
}

function createSuccessResponse(data: unknown): Response {
  return new Response(JSON.stringify(data), { 
    status: 200, 
    headers: { 'Content-Type': 'application/json' } 
  });
}

async function fetchAndProcessTeamData(id: string, leagueId: string, _teamCacheKey: string, _teamFilename: string): Promise<Response> {
  try {
    // Wait for the background job to complete
    const result = await getTeamNameAndMatches(id, leagueId, true);
    
    // Check if we got a valid result
    if (result && typeof result === 'object' && 'teamName' in result && 'matchIdsByLeague' in result) {
      debug('POST: Team data fetched successfully');
      return createSuccessResponse(result);
    } else if (result && typeof result === 'object' && 'status' in result) {
      // Handle queued status
      debug('POST: Request queued, returning status');
      return createSuccessResponse(result);
    } else {
      throw new Error('Invalid result format from getTeamNameAndMatches');
    }
  } catch (err) {
    debug('POST: Error fetching team data:', err);
    console.error('[API ERROR] /api/teams/[id]/matches:', err);
    return createErrorResponse('Failed to fetch team data', 500);
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  debug('POST: Handler called');
  const { id } = await params;
  
  let body: RequestBody;
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
