/**
 * @openapi
 * /players/{id}/stats:
 *   get:
 *     tags:
 *       - Players
 *     summary: Get player stats
 *     description: |
 *       To force a refresh and bypass the cache, add `?force=true` to the request URL. All cache invalidation and refresh is now handled via this query parameter.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Player ID
 *       - in: query
 *         name: force
 *         required: false
 *         schema:
 *           type: boolean
 *         description: Force refresh - bypass cache and fetch fresh data
 *     responses:
 *       200:
 *         description: Player stats
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PlayerStats'
 */
import { getPlayerStats as getPlayerStatsFromOpendota } from '@/lib/api/opendota/players';
import { cacheService } from '@/lib/cache-service';
import { corsOptionsHandler } from '@/lib/cors';
import { logWithTimestampToFile } from '@/lib/server-logger';
import { getPlayerStats as getPlayerStatsFromService } from '@/lib/services/player-stats-service';
import type { PlayerStats } from '@/lib/types/data-service';
import { NextRequest } from 'next/server';

const debug = (...args: unknown[]) => {
  logWithTimestampToFile('log', '[PLAYER STATS POLL]', ...args);
};

async function isPlayerStatsFilePresent(playerId: string, debug: (...args: unknown[]) => void): Promise<boolean> {
  const statsCacheKey = `opendota-player-stats-${playerId}`;
  const statsFilename = `opendota-player-stats-${playerId}.json`;
  debug('Checking for player stats file:', statsFilename);
  const statsData = await cacheService.get<PlayerStats>(statsCacheKey, statsFilename);
  return !!statsData;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: _id } = await params;
  if (await isPlayerStatsFilePresent(_id, debug)) {
    const statsCacheKey = `opendota-player-stats-${_id}`;
    const statsFilename = `opendota-player-stats-${_id}.json`;
    const statsData = await cacheService.get<PlayerStats>(statsCacheKey, statsFilename);
    debug('Player stats file present, returning 200:', statsFilename);
    return new Response(JSON.stringify(statsData), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }
  debug('Player stats file missing, starting background job:', _id);
  (async () => {
    try {
      await getPlayerStatsFromOpendota(Number(_id), true);
      debug('Background job completed for player stats:', _id);
    } catch (err) {
      debug('Background job error for player stats:', _id, err);
    }
  })();
  return new Response(JSON.stringify({ status: 'queued', signature: _id }), { status: 202 });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: _id } = await params;
  debug('POST: Handler called for player stats', _id);
  const statsCacheKey = `opendota-player-stats-${_id}`;
  const statsFilename = `opendota-player-stats-${_id}.json`;
  const statsData = await cacheService.get<PlayerStats>(statsCacheKey, statsFilename);
  if (statsData) {
    debug('POST: Player stats file present, returning ready');
    return new Response(JSON.stringify({ status: 'ready', signature: statsCacheKey }), { status: 200 });
  }
  // Start background job if not present
  (async () => {
    try {
      await getPlayerStatsFromService(Number(_id));
      debug('POST: Background job completed for player stats:', _id);
    } catch (err) {
      debug('POST: Background job error for player stats:', _id, err);
    }
  })();
  debug('POST: Player stats file not present, background job started, returning queued');
  return new Response(JSON.stringify({ status: 'queued', signature: statsCacheKey }), { status: 202 });
}

export async function OPTIONS() {
  return corsOptionsHandler();
}
