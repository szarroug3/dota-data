/**
 * @openapi
 * /players/{id}/data:
 *   post:
 *     tags:
 *       - Players
 *     summary: Get player data
 *     description: |
 *       Returns player data immediately if cached, or waits for fetch to complete.
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
 *         description: Player data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OpenDotaPlayer'
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
import { getPlayerData } from '@/lib/api/opendota/players';
import { cacheService } from '@/lib/cache-service';
import { logWithTimestampToFile } from '@/lib/server-logger';
import type { OpenDotaPlayer } from '@/types/opendota';

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



export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: _id } = await params;
  debug('POST: Handler called for player', _id);
  
  let force = false;
  try {
    const body = await request.json();
    force = body.force || false;
  } catch (err) {
    debug('POST: Failed to parse JSON body, using default force=false', err);
  }

  const playerCacheKey = `opendota-player-${_id}`;
  const playerFilename = `opendota-player-${_id}.json`;
  
  // Check cache first (unless force refresh)
  if (!force) {
    const playerData = await cacheService.get<OpenDotaPlayer>(playerCacheKey, playerFilename);
    if (playerData) {
      debug('POST: Player file present, returning data');
      return new Response(JSON.stringify(playerData), { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }
  }

  // If force refresh or not in cache, invalidate and fetch fresh data
  if (force) {
    debug('POST: Force refresh requested, invalidating cache');
    await cacheService.invalidate(playerCacheKey, playerFilename);
  }

  debug('POST: Player data not in cache, fetching and waiting for completion');
  
  try {
    // Wait for the background job to complete
    await getPlayerData(Number(_id), true);
    
    // Get the fresh data from cache
    const playerData = await cacheService.get<OpenDotaPlayer>(playerCacheKey, playerFilename);
    if (!playerData) {
      throw new Error('Failed to fetch player data');
    }
    
    debug('POST: Player data fetched successfully');
    return new Response(JSON.stringify(playerData), { 
      status: 200, 
      headers: { 'Content-Type': 'application/json' } 
    });
  } catch (err) {
    debug('POST: Error fetching player data:', err);
    return new Response(JSON.stringify({ error: 'Failed to fetch player data' }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }
}