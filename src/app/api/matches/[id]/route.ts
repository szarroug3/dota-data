/**
 * @openapi
 * /matches/{id}:
 *   post:
 *     tags:
 *       - Matches
 *     summary: Get match data from OpenDota
 *     description: |
 *       Returns processed match data from OpenDota API.
 *       Fetches match details, processes them, and returns structured match data.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Match ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               force:
 *                 type: boolean
 *                 description: Force refresh - bypass cache and fetch fresh data
 *     responses:
 *       200:
 *         description: Processed match data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MatchResponse'
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
import { processMatchDecoupled } from '@/lib/services/match-processing-service';
import type { OpenDotaMatch } from '@/types/opendota';
import { MatchRequest, MatchResponse, ApiErrorResponse } from '@/types/api';

const debug = (...args: unknown[]) => {
  logWithTimestampToFile('log', '[MATCH DATA POLL]', ...args);
};

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: _id } = await params;
  debug('POST: Handler called for match', _id);
  
  let force = false;
  try {
    const body = await request.json();
    const requestBody = body as MatchRequest;
    force = requestBody.force || false;
    debug('POST: Parsed request body', { force });
  } catch (err) {
    debug('POST: Failed to parse JSON body', err);
    return new Response(JSON.stringify({ error: 'Invalid JSON body' } as ApiErrorResponse), { 
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
      const processed = processMatchDecoupled(matchData);
      return new Response(JSON.stringify(processed as MatchResponse), { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }
  }

  if (force) {
    debug('POST: Force refresh requested, invalidating cache');
    await cacheService.invalidate(matchCacheKey, matchFilename);
  }

  debug('POST: Match data not in cache, fetching and waiting for completion');
  
  try {
    debug('POST: Calling getMatch for match', _id);
    await getMatch(Number(_id), true);
    debug('POST: getMatch completed for match', _id);
    const matchData = await cacheService.get<OpenDotaMatch>(matchCacheKey, matchFilename);
    if (!matchData) {
      throw new Error('Failed to fetch match data');
    }
    const processed = processMatchDecoupled(matchData);
    debug('POST: Match data fetched and processed successfully');
    return new Response(JSON.stringify(processed as MatchResponse), { 
      status: 200, 
      headers: { 'Content-Type': 'application/json' } 
    });
  } catch (err) {
    debug('POST: Error fetching match data:', err);
    return new Response(JSON.stringify({ error: 'Failed to fetch match data' } as ApiErrorResponse), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }
}
