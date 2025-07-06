/**
 * @openapi
 * /teams/{id}:
 *   post:
 *     tags:
 *       - Teams
 *     summary: Get team data with matches
 *     description: |
 *       Returns team data with matches immediately if cached, or waits for fetch to complete.
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
 *               force:
 *                 type: boolean
 *                 description: Force refresh - bypass cache and fetch fresh data
 *     responses:
 *       200:
 *         description: Team data with matches
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DotabuffTeam'
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
import type { DotabuffTeam } from '@/types/opendota';

const debug = (...args: unknown[]) => {
  logWithTimestampToFile('log', '[TEAM DATA]', ...args);
};

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  debug('POST: Handler called for team', id);
  
  // 1. Parse request body for force option
  let force = false;
  try {
    const body = await request.json();
    force = body.force || false;
  } catch (err) {
    debug('POST: Failed to parse JSON body, using defaults', err);
  }

  const cacheKey = getTeamCacheKey(id);
  const filename = getTeamCacheFilename(id, 0);
  const TTL = 6 * 60 * 60; // 6 hours

  // 2. Check cache first (unless force=true)
  if (!force) {
    const cached = await cacheService.get<DotabuffTeam>(cacheKey, filename, TTL);
    if (cached) {
      debug('POST: Cache hit, returning data');
      return new Response(JSON.stringify(cached), { status: 200 });
    }
  }

  // 3. Invalidate cache if force refresh
  if (force) {
    debug('POST: Force refresh requested, invalidating cache');
    await cacheService.invalidate(cacheKey, filename);
  }

  // 4. Call service layer
  try {
    debug('POST: Fetching team data');
    const data = await getTeamNameAndMatches(id, force);
    debug('POST: Team data fetched successfully');
    return new Response(JSON.stringify(data), { status: 200 });
  } catch (err) {
    debug('POST: Error fetching team data:', err);
    return new Response(JSON.stringify({ error: 'Failed to fetch team data' }), { status: 500 });
  }
} 