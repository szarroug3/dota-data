/**
 * @openapi
 * /matches/{id}:
 *   get:
 *     tags:
 *       - Matches
 *     summary: Get match data
 *     description: |
 *       To force a refresh and bypass the cache, add `?force=true` to the request URL. All cache invalidation and refresh is now handled via this query parameter.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Match ID
 *       - in: query
 *         name: force
 *         required: false
 *         schema:
 *           type: boolean
 *         description: Force refresh - bypass cache and fetch fresh data
 *     responses:
 *       200:
 *         description: Match data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       400:
 *         description: Invalid match id
 *       404:
 *         description: Match not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
import { getMatch } from '@/lib/api/opendota/matches';
import { cacheService } from '@/lib/cache-service';
import { logWithTimestampToFile } from '@/lib/server-logger';
import type { OpenDotaMatch } from '@/types/opendota';
import { NextRequest } from 'next/server';

const debug = (...args: unknown[]) => {
  logWithTimestampToFile('log', '[MATCH DATA POLL]', ...args);
};

async function isMatchFilePresent(matchId: string, debug: (...args: unknown[]) => void): Promise<boolean> {
  const matchCacheKey = `opendota-match-${matchId}`;
  const matchFilename = `opendota-match-${matchId}.json`;
  debug('Checking for match file:', matchFilename);
  const matchData = await cacheService.get<OpenDotaMatch>(matchCacheKey, matchFilename);
  return !!matchData;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: _id } = await params;
  if (await isMatchFilePresent(_id, debug)) {
    const matchCacheKey = `opendota-match-${_id}`;
    const matchFilename = `opendota-match-${_id}.json`;
    const matchData = await cacheService.get<OpenDotaMatch>(matchCacheKey, matchFilename);
    debug('Match file present, returning 200:', matchFilename);
    return new Response(JSON.stringify(matchData), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }
  debug('Match file missing, starting background job:', _id);
  (async () => {
    try {
      await getMatch(Number(_id), true);
      debug('Background job completed for match:', _id);
    } catch (err) {
      debug('Background job error for match:', _id, err);
    }
  })();
  return new Response(JSON.stringify({ status: 'queued', signature: _id }), { status: 202 });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: _id } = await params;
  debug('POST: Handler called for match', _id);
  const matchCacheKey = `opendota-match-${_id}`;
  const matchFilename = `opendota-match-${_id}.json`;
  const matchData = await cacheService.get<OpenDotaMatch>(matchCacheKey, matchFilename);
  if (matchData) {
    debug('POST: Match file present, returning ready');
    return new Response(JSON.stringify({ status: 'ready', signature: matchCacheKey }), { status: 200 });
  }
  // Start background job if not present
  (async () => {
    try {
      await getMatch(Number(_id), true);
      debug('POST: Background job completed for match:', _id);
    } catch (err) {
      debug('POST: Background job error for match:', _id, err);
    }
  })();
  debug('POST: Match file not present, background job started, returning queued');
  return new Response(JSON.stringify({ status: 'queued', signature: matchCacheKey }), { status: 202 });
}
