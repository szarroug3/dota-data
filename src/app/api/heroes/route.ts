/**
 * @openapi
 * /heroes:
 *   get:
 *     tags:
 *       - Heroes
 *     summary: Get all heroes
 *     responses:
 *       200:
 *         description: List of heroes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/OpenDotaHero'
 *       404:
 *         description: Hero data not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *   post:
 *     tags:
 *       - Heroes
 *     summary: Fetch and return all heroes (synchronous)
 *     responses:
 *       200:
 *         description: List of heroes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/OpenDotaHero'
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
import { getHeroes } from '@/lib/api';
import { cacheService } from '@/lib/cache-service';
import { corsOptionsHandler, withCORS } from '@/lib/cors';
import { logWithTimestampToFile } from '@/lib/server-logger';
import { getHeroesCacheKeyAndFilename } from '@/lib/utils/cache-keys';
import { NextResponse } from 'next/server';

const debug = (...args: unknown[]) => {
  logWithTimestampToFile('log', '[HEROES POLL]', ...args);
};

export async function GET() {
  const { key: cacheKey, filename } = getHeroesCacheKeyAndFilename();
  const HEROES_TTL = 60 * 60 * 24 * 90; // 90 days in seconds

  // Check cache for data
  const cached = await cacheService.get(cacheKey, filename, HEROES_TTL);
  if (cached) {
    debug('Heroes data present, returning 200:', filename);
    return withCORS(NextResponse.json(cached));
  }

  debug('Heroes data not found, returning 404');
  return withCORS(NextResponse.json({ error: 'Heroes data not found' }, { status: 404 }));
}

export async function POST(request: Request) {
  debug('POST: Handler called for heroes');
  
  // 1. Parse request body for force option
  let force = false;
  try {
    const body = await request.json();
    force = body.force || false;
  } catch (err) {
    debug('POST: Failed to parse JSON body, using default force=false', err);
  }

  const { key: cacheKey, filename } = getHeroesCacheKeyAndFilename();
  const TTL = 7 * 24 * 60 * 60; // 7 days

  // 2. Check cache first (unless force=true)
  if (!force) {
    const cached = await cacheService.get(cacheKey, filename, TTL);
    if (cached) {
      debug('POST: Cache hit, returning data');
      return withCORS(NextResponse.json(cached));
    }
  }

  // 3. Invalidate cache if force refresh
  if (force) {
    debug('POST: Force refresh requested, invalidating cache');
    await cacheService.invalidate(cacheKey, filename);
  }

  // 4. Call service layer
  try {
    debug('POST: Fetching heroes data');
    const data = await getHeroes(force);
    debug('POST: Heroes data fetched successfully');
    return withCORS(NextResponse.json(data));
  } catch (err) {
    debug('POST: Error fetching heroes data:', err);
    return withCORS(NextResponse.json({ error: 'Failed to fetch heroes data' }, { status: 500 }));
  }
}

export async function OPTIONS() {
  return corsOptionsHandler();
}
