/**
 * @openapi
 * /items:
 *   post:
 *     tags:
 *       - Items
 *     summary: Get all items
 *     description: |
 *       Returns items data immediately if cached, or waits for fetch to complete.
 *       Always returns 200 with the actual data.
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
 *         description: Items data
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
import { fetchItems } from '@/lib/api/opendota/items';
import { cacheService } from '@/lib/cache-service';
import { logWithTimestampToFile } from '@/lib/server-logger';
import { getOpendotaItemsCacheFilename, getOpendotaItemsCacheKey } from '@/lib/utils/cache-keys';
import { NextResponse } from 'next/server';

const debug = (...args: unknown[]) => {
  logWithTimestampToFile('log', '[ITEMS DATA]', ...args);
};

export async function POST(request: Request) {
  debug('POST: Handler called for items');
  
  // 1. Parse request body for force option
  let force = false;
  try {
    const body = await request.json();
    force = body.force || false;
  } catch (err) {
    debug('POST: Failed to parse JSON body, using default force=false', err);
  }

  const cacheKey = getOpendotaItemsCacheKey();
  const filename = getOpendotaItemsCacheFilename();
  const TTL = 7 * 24 * 60 * 60; // 7 days

  // 2. Check cache first (unless force=true)
  if (!force) {
    const cached = await cacheService.get(cacheKey, filename, TTL);
    if (cached) {
      debug('POST: Cache hit, returning data');
      return NextResponse.json(cached);
    }
  }

  // 3. Invalidate cache if force refresh
  if (force) {
    debug('POST: Force refresh requested, invalidating cache');
    await cacheService.invalidate(cacheKey, filename);
  }

  // 4. Call service layer
  try {
    debug('POST: Fetching items data');
    const data = await fetchItems();
    debug('POST: Items data fetched successfully');
    return NextResponse.json(data);
  } catch (err) {
    debug('POST: Error fetching items data:', err);
    return NextResponse.json({ error: 'Failed to fetch items data' }, { status: 500 });
  }
} 