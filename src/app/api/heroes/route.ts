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

export async function POST() {
  debug('POST: Handler called for heroes');
  const { key: cacheKey, filename } = getHeroesCacheKeyAndFilename();
  const HEROES_TTL = 60 * 60 * 24 * 90; // 90 days in seconds

  try {
    // Always fetch and cache fresh data synchronously
    await getHeroes(true); // Force refresh
    const cached = await cacheService.get(cacheKey, filename, HEROES_TTL);
    if (cached) {
      debug('POST: Heroes data fetched and ready, returning 200');
      return withCORS(NextResponse.json(cached));
    } else {
      debug('POST: Heroes data fetch failed, not found after refresh');
      return withCORS(NextResponse.json({ error: 'Heroes data not found after refresh' }, { status: 500 }));
    }
  } catch (err) {
    debug('POST: Heroes data fetch error:', err);
    return withCORS(NextResponse.json({ error: 'Failed to fetch heroes data' }, { status: 500 }));
  }
}

export async function OPTIONS() {
  return corsOptionsHandler();
}
