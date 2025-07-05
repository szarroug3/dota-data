import { getLeagueName } from '@/lib/api/dotabuff/leagues';
import { cacheService } from '@/lib/cache-service';
import { logWithTimestampToFile } from '@/lib/server-logger';
import { getLeagueCacheKey } from '@/lib/utils/cache-keys';
import * as cheerio from 'cheerio';
import { NextRequest } from 'next/server';

const debug = (...args: unknown[]) => {
  logWithTimestampToFile('log', '[LEAGUE DATA POLL]', ...args);
};

function parseLeagueNameHtml(html: string, leagueId: string) {
  const $ = cheerio.load(html);
  const img = $('img.img-league.img-avatar').first();
  let leagueName = '';
  if (img.length) {
    leagueName = img.attr('alt') || '';
  }
  if (!leagueName) {
    leagueName = leagueId;
  }
  return { leagueName };
}

function parseForceFlag(request: NextRequest): Promise<boolean> {
  return request.json()
    .then(body => body.force || false)
    .catch(() => false);
}

async function getCachedLeagueData(leagueCacheKey: string, leagueFilename: string) {
  let cached = await cacheService.get(leagueCacheKey, leagueFilename);
  if (typeof cached === 'string') {
    try { cached = JSON.parse(cached); }
    catch {
      // Ignore JSON parse errors: return the raw string if not valid JSON
    }
  }
  return cached;
}

async function invalidateLeagueCache(leagueCacheKey: string, leagueFilename: string) {
  await cacheService.invalidate(leagueCacheKey, leagueFilename);
}

function parseLeagueNameResult(htmlOrStatus: unknown, id: string): { leagueName: string } {
  if (typeof htmlOrStatus === 'string') {
    return parseLeagueNameHtml(htmlOrStatus, id);
  } else if (typeof htmlOrStatus === 'object' && htmlOrStatus !== null && 'leagueName' in htmlOrStatus) {
    return htmlOrStatus as { leagueName: string };
  } else {
    throw new Error('Unexpected response from getLeagueName');
  }
}

async function fetchAndCacheLeagueData(id: string, leagueCacheKey: string, leagueFilename: string, debug: (...args: unknown[]) => void) {
  const htmlOrStatus = await getLeagueName(id, true);
  if (typeof htmlOrStatus === 'object' && htmlOrStatus !== null && 'status' in htmlOrStatus) {
    // Still queued or processing
    return { status: 202, body: htmlOrStatus };
  }
  const parsed = parseLeagueNameResult(htmlOrStatus, id);
  if (parsed && typeof parsed === 'object' && 'leagueName' in parsed) {
    debug('POST: Setting cache with parsed leagueName', parsed.leagueName, leagueCacheKey, leagueFilename);
    await cacheService.set('league', leagueCacheKey, JSON.stringify(parsed), undefined, leagueFilename);
    debug('POST: Cache set complete', leagueCacheKey, leagueFilename);
  }
  debug('POST: League data fetched and cached successfully');
  return { status: 200, body: parsed };
}

/**
 * @openapi
 * /leagues/{id}:
 *   post:
 *     tags:
 *       - League
 *     summary: Get league name from Dotabuff
 *     description: |
 *       Returns league data immediately if cached, or waits for fetch to complete.
 *       Always returns 200 with the actual data.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: League ID
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
 *         description: League data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 leagueName:
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
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  debug('POST: Handler called for league', id);

  const leagueCacheKey = getLeagueCacheKey(id);
  const leagueFilename = `${leagueCacheKey}.json`;

  let force = false;
  force = await parseForceFlag(request);

  if (!force) {
    const cached = await getCachedLeagueData(leagueCacheKey, leagueFilename);
    if (cached) {
      debug('POST: League data present in cache, returning data');
      return new Response(JSON.stringify(cached), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  if (force) {
    debug('POST: Force refresh requested, invalidating cache', leagueCacheKey, leagueFilename);
    await invalidateLeagueCache(leagueCacheKey, leagueFilename);
    debug('POST: Cache invalidated', leagueCacheKey, leagueFilename);
  }

  debug('POST: League data not in cache, fetching and waiting for completion');

  try {
    const result = await fetchAndCacheLeagueData(id, leagueCacheKey, leagueFilename, debug);
    if ('status' in result && result.status === 202) {
      return new Response(JSON.stringify(result.body), {
        status: 202,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    return new Response(JSON.stringify(result.body), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    debug('POST: Error fetching league data:', err);
    return new Response(JSON.stringify({ error: 'Failed to fetch league data' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
