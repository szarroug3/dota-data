/**
 * @openapi
 * /teams/{id}/match-history:
 *   get:
 *     tags:
 *       - Teams
 *     summary: Get match history for a team
 *     description: |
 *       Returns processed match history data for the team's players.
 *       To force a refresh and bypass the cache, add `?force=true` to the request URL.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Team ID
 *       - in: query
 *         name: accountIds
 *         required: true
 *         schema:
 *           type: string
 *         description: Comma-separated list of player account IDs
 *       - in: query
 *         name: force
 *         required: false
 *         schema:
 *           type: boolean
 *         description: Force refresh - bypass cache and fetch fresh data
 *     responses:
 *       200:
 *         description: Match history data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 summary:
 *                   type: object
 *                 matches:
 *                   type: array
 *                   items:
 *                     type: object
 *                 trends:
 *                   type: array
 *                   items:
 *                     type: object
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
 *       500:
 *         description: Server error
 */
import { logWithTimestampToFile } from '@/lib/server-logger';
import { getMatchHistory } from '@/lib/services/match-history-service';
import { NextRequest } from 'next/server';

const debug = (...args: unknown[]) => {
  logWithTimestampToFile('log', '[MATCH HISTORY]', ...args);
};

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { searchParams } = new URL(request.url);
  const accountIdsParam = searchParams.get('accountIds');
  const force = searchParams.get('force') === 'true';
  
  if (!accountIdsParam) {
    debug('Missing accountIds query parameter');
    return new Response(JSON.stringify({ error: 'Missing accountIds query parameter' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const accountIds = accountIdsParam.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
  
  if (accountIds.length === 0) {
    debug('No valid account IDs provided');
    return new Response(JSON.stringify({ error: 'No valid account IDs provided' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  debug('Processing match history request', { accountIds, force });

  try {
    const result = await getMatchHistory(accountIds);
    
    debug('Match history result:', {
      hasResult: !!result,
      resultType: typeof result,
      resultKeys: result && typeof result === 'object' ? Object.keys(result) : null,
      isQueued: result && typeof result === 'object' && 'status' in result,
      status: result && typeof result === 'object' && 'status' in result ? (result as any).status : null
    });
    
    if (result && typeof result === 'object' && 'status' in result) {
      // Return queued status
      debug('Returning queued status');
      return new Response(JSON.stringify(result), { 
        status: 202, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }
    
    // Return match history data
    debug('Returning match history data');
    return new Response(JSON.stringify(result), { 
      status: 200, 
      headers: { 'Content-Type': 'application/json' } 
    });
    
  } catch (error) {
    debug('Error processing match history request:', error);
    return new Response(JSON.stringify({ error: 'Failed to process match history request' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
} 