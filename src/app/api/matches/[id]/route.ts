/**
 * @openapi
 * /matches/{id}:
 *   post:
 *     tags:
 *       - Matches
 *     summary: Get match data
 *     description: |
 *       Returns match data immediately if cached, or waits for fetch to complete.
 *       Always returns 200 with the actual data.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Match ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               teamId:
 *                 type: string
 *                 description: Team ID for processing match data
 *               force:
 *                 type: boolean
 *                 description: Force refresh - bypass cache and fetch fresh data
 *             required:
 *               - teamId
 *     responses:
 *       200:
 *         description: Match data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
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
import { getMatch } from '@/lib/api/opendota/matches';
import { cacheService } from '@/lib/cache-service';
import { logWithTimestampToFile } from '@/lib/server-logger';
import { processMatch } from '@/lib/services/match-processing-service';
import type { OpenDotaMatch } from '@/types/opendota';

const debug = (...args: unknown[]) => {
  logWithTimestampToFile('log', '[MATCH DATA POLL]', ...args);
};

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: _id } = await params;
  debug('POST: Handler called for match', _id);
  
  let teamId: string | undefined;
  let force = false;
  try {
    const body = await request.json();
    teamId = body.teamId;
    force = body.force || false;
    debug('POST: Parsed request body', { teamId, force });
  } catch (err) {
    debug('POST: Failed to parse JSON body', err);
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { 
      status: 400, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }

  if (!teamId) {
    debug('POST: Missing teamId parameter');
    return new Response(JSON.stringify({ error: 'teamId parameter is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const matchCacheKey = `opendota-match-${_id}`;
  const matchFilename = `opendota-match-${_id}.json`;
  
  // Check cache first (unless force refresh)
  if (!force) {
    debug('POST: Checking cache for match', _id);
    const matchData = await cacheService.get<OpenDotaMatch>(matchCacheKey, matchFilename);
    if (matchData) {
      debug('POST: Match file present, returning processed data');
      // Process the match before returning
      const processed = processMatch(matchData, teamId);
      return new Response(JSON.stringify(processed), { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }
  }

  // If force refresh or not in cache, invalidate and fetch fresh data
  if (force) {
    debug('POST: Force refresh requested, invalidating cache');
    await cacheService.invalidate(matchCacheKey, matchFilename);
  }

  debug('POST: Match data not in cache, fetching and waiting for completion');
  
  try {
    // Wait for the background job to complete
    debug('POST: Calling getMatch for match', _id);
    await getMatch(Number(_id), true);
    debug('POST: getMatch completed for match', _id);
    
    // Get the fresh data from cache
    debug('POST: Getting fresh data from cache for match', _id);
    const matchData = await cacheService.get<OpenDotaMatch>(matchCacheKey, matchFilename);
    if (!matchData) {
      throw new Error('Failed to fetch match data');
    }
    
    // Process the match before returning
    debug('POST: Processing match data for match', _id);
    const processed = processMatch(matchData, teamId);
    debug('POST: Match data fetched and processed successfully');
    return new Response(JSON.stringify(processed), { 
      status: 200, 
      headers: { 'Content-Type': 'application/json' } 
    });
  } catch (err) {
    debug('POST: Error fetching match data:', err);
    return new Response(JSON.stringify({ error: 'Failed to fetch match data' }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }
}
