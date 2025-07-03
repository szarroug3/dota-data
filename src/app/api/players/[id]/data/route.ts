/**
 * @openapi
 * /players/{id}/data:
 *   get:
 *     tags:
 *       - Players
 *     summary: Get player data
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
 *         description: Player data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OpenDotaPlayer'
 */
import { getPlayerData } from '@/lib/api/opendota/players';
import { cacheService } from '@/lib/cache-service';
import { logWithTimestampToFile } from '@/lib/server-logger';
import type { OpenDotaPlayer } from '@/types/opendota';
import { NextRequest } from 'next/server';

// Add debug logger
const debug = (...args: unknown[]) => {
  logWithTimestampToFile('log', '[PLAYER DATA POLL]', ...args);
};

async function isPlayerFilePresent(playerId: string, debug: (...args: unknown[]) => void): Promise<boolean> {
  const playerCacheKey = `opendota-player-${playerId}`;
  const playerFilename = `opendota-player-${playerId}.json`;
  debug('Checking for player file:', playerFilename);
  const playerData = await cacheService.get<OpenDotaPlayer>(playerCacheKey, playerFilename);
  return !!playerData;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: _id } = await params;
  if (await isPlayerFilePresent(_id, debug)) {
    const playerCacheKey = `opendota-player-${_id}`;
    const playerFilename = `opendota-player-${_id}.json`;
    const playerData = await cacheService.get<OpenDotaPlayer>(playerCacheKey, playerFilename);
    debug('Player file present, returning 200:', playerFilename);
    return new Response(JSON.stringify(playerData), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }
  debug('Player file missing, starting background job:', _id);
  (async () => {
    try {
      await getPlayerData(Number(_id), true);
      debug('Background job completed for player:', _id);
    } catch (err) {
      debug('Background job error for player:', _id, err);
    }
  })();
  return new Response(JSON.stringify({ status: 'queued', signature: _id }), { status: 202 });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: _id } = await params;
  debug('POST: Handler called for player', _id);
  const playerCacheKey = `opendota-player-${_id}`;
  const playerFilename = `opendota-player-${_id}.json`;
  const playerData = await cacheService.get<OpenDotaPlayer>(playerCacheKey, playerFilename);
  if (playerData) {
    debug('POST: Player file present, returning ready');
    return new Response(JSON.stringify({ status: 'ready', signature: playerCacheKey }), { status: 200 });
  }
  // Start background job if not present
  (async () => {
    try {
      await getPlayerData(Number(_id), true);
      debug('POST: Background job completed for player:', _id);
    } catch (err) {
      debug('POST: Background job error for player:', _id, err);
    }
  })();
  debug('POST: Player file not present, background job started, returning queued');
  return new Response(JSON.stringify({ status: 'queued', signature: playerCacheKey }), { status: 202 });
}