/**
 * @openapi
 * /players/{id}/stats:
 *   post:
 *     tags:
 *       - Players
 *     summary: Get player stats
 *     description: |
 *       Returns player statistics immediately if cached, or waits for fetch to complete.
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
 *         description: Player stats
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PlayerStats'
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
import { corsOptionsHandler } from '@/lib/cors';
import { logWithTimestampToFile } from '@/lib/server-logger';
import { getPlayerStats as getPlayerStatsFromService } from '@/lib/services/player-stats-service';
import { PlayerStatsRequest, PlayerStatsResponse, ApiErrorResponse } from '@/types/api';

const debug = (...args: unknown[]) => {
  logWithTimestampToFile('log', '[PLAYER STATS POLL]', ...args);
};



export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: _id } = await params;
  debug('POST: Handler called for player stats', _id);
  
  let _force = false;
  try {
    const body = await request.json();
    const requestBody = body as PlayerStatsRequest;
    _force = requestBody.force || false;
  } catch (err) {
    debug('POST: Failed to parse JSON body, using default force=false', err);
  }

  try {
    const statsData = await getPlayerStatsFromService(Number(_id));
    if (!statsData || (typeof statsData === 'object' && 'status' in statsData && statsData.status === 'error')) {
      throw new Error('Failed to fetch player stats');
    }
    debug('POST: Player stats fetched and combined successfully');
    return new Response(JSON.stringify(statsData as PlayerStatsResponse), { 
      status: 200, 
      headers: { 'Content-Type': 'application/json' } 
    });
  } catch (err) {
    debug('POST: Error fetching player stats:', err);
    return new Response(JSON.stringify({ error: 'Failed to fetch player stats' } as ApiErrorResponse), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }
}

export async function OPTIONS() {
  return corsOptionsHandler();
}
