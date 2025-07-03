import { getLeagueName } from '@/lib/api/dotabuff/leagues';
import { cacheService } from '@/lib/cache-service';
import { logWithTimestampToFile } from '@/lib/server-logger';
import { getLeagueCacheFilename, getLeagueCacheKey } from '@/lib/utils/cache-keys';
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

/**
 * @openapi
 * /leagues/{id}:
 *   get:
 *     tags:
 *       - League
 *     summary: Get league name from Dotabuff
 *     description: |
 *       This endpoint uses an async/polling pattern. If the data is not available yet, it will queue the fetch and return a 202 response with `{ status: 'queued', signature }`. The client should poll this endpoint until a 200 response with the data is returned.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: League ID
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
 *       202:
 *         description: Data is being fetched; client should poll until 200 is returned.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: queued
 *                 signature:
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
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const leagueCacheKey = getLeagueCacheKey(id);
  const leagueFilename = getLeagueCacheFilename(id);
  const leagueHtml = await cacheService.get<string>(leagueCacheKey, leagueFilename);
  if (leagueHtml) {
    debug('League file present, returning 200:', leagueFilename);
    const parsed = parseLeagueNameHtml(leagueHtml, id);
    return new Response(JSON.stringify(parsed), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }
  debug('League file missing, starting background job:', id);
  (async () => {
    try {
      await getLeagueName(id, true);
      debug('Background job completed for league:', id);
    } catch (err) {
      debug('Background job error for league:', id, err);
    }
  })();
  return new Response(JSON.stringify({ status: 'queued', signature: id }), { status: 202 });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: _id } = await params;
  debug('POST: Handler called for league', _id);
  const leagueCacheKey = getLeagueCacheKey(_id);
  const leagueFilename = getLeagueCacheFilename(_id);
  const leagueHtml = await cacheService.get<string>(leagueCacheKey, leagueFilename);
  if (leagueHtml) {
    debug('POST: League file present, returning ready');
    return new Response(JSON.stringify({ status: 'ready', signature: leagueCacheKey }), { status: 200 });
  }
  // Start background job if not present
  (async () => {
    try {
      await getLeagueName(_id, true);
      debug('POST: Background job completed for league:', _id);
    } catch (err) {
      debug('POST: Background job error for league:', _id, err);
    }
  })();
  debug('POST: League file not present, background job started, returning queued');
  return new Response(JSON.stringify({ status: 'queued', signature: leagueCacheKey }), { status: 202 });
}
