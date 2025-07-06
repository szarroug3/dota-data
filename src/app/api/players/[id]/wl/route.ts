/**
 * @openapi
 * /players/{id}/wl:
 *   post:
 *     tags:
 *       - Players
 *     summary: Get player win/loss record
 *     description: |
 *       Returns player win/loss data immediately if cached, or waits for fetch to complete.
 *       Always returns 200 with the actual data.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Player ID
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
 *         description: Player win/loss data
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
import { getPlayerWL } from '@/lib/api/opendota/players';
import { cacheService } from '@/lib/cache-service';
import { logWithTimestampToFile } from '@/lib/server-logger';
import { getPlayerWLCacheFilename, getPlayerWLCacheKey } from '@/lib/utils/cache-keys';

const debug = (...args: unknown[]) => {
  logWithTimestampToFile('log', '[PLAYER WL]', ...args);
};

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  debug('POST: Handler called for player wl', id);
  
  // 1. Parse request body for force option
  let force = false;
  try {
    const body = await request.json();
    force = body.force || false;
  } catch (err) {
    debug('POST: Failed to parse JSON body, using default force=false', err);
  }

  const cacheKey = getPlayerWLCacheKey(id);
  const filename = getPlayerWLCacheFilename(id);
  const TTL = 24 * 60 * 60; // 24 hours

  // 2. Check cache first (unless force=true)
  if (!force) {
    const cached = await cacheService.get(cacheKey, filename, TTL);
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
    debug('POST: Fetching player wl data');
    const data = await getPlayerWL(Number(id));
    debug('POST: Player wl data fetched successfully');
    return new Response(JSON.stringify(data), { status: 200 });
  } catch (err) {
    debug('POST: Error fetching player wl data:', err);
    return new Response(JSON.stringify({ error: 'Failed to fetch player wl data' }), { status: 500 });
  }
} 