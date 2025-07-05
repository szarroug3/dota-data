import { cacheService } from '@/lib/cache-service';
import { getCacheKeyAndFilename } from '@/lib/utils/cache-keys';
import { NextRequest } from 'next/server';

/**
 * @openapi
 * /cache/invalidate:
 *   post:
 *     tags:
 *       - Cache
 *     summary: Invalidate cache keys/files
 *     description: Invalidate one or more cache keys/files immediately (not queued).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     type:
 *                       type: string
 *                       description: The cache type (e.g. 'player', 'team', 'match', 'league')
 *                     id:
 *                       type: string
 *                       description: The id for the entity (e.g. playerId, teamId, matchId, leagueId)
 *                 description: List of cache items to invalidate
 *     responses:
 *       200:
 *         description: Cache invalidation result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 invalidated:
 *                   type: array
 *                   items:
 *                     type: string
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: string
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

async function invalidateItems(items: any[]): Promise<{ invalidated: string[]; errors: string[] }> {
  const invalidated: string[] = [];
  const errors: string[] = [];
  for (const item of items) {
    if (!item || typeof item !== 'object' || !item.type || !item.id) {
      errors.push(`Invalid item: ${JSON.stringify(item)}`);
      continue;
    }
    if ('key' in item) {
      errors.push(`Invalid contract: 'key' is not allowed. Use {type, id}`);
      continue;
    }
    try {
      const { key, filename } = getCacheKeyAndFilename(item.type, item.id);
      await cacheService.invalidate(key, filename);
      invalidated.push(`${item.type}:${item.id} (${key}, ${filename})`);
    } catch (err) {
      errors.push(`Failed to invalidate ${item.type}:${item.id}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  return { invalidated, errors };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const items = Array.isArray(body.items) ? body.items : [];
    if (!items.length) {
      return new Response(JSON.stringify({ error: 'No items provided' }), { status: 400 });
    }
    const { invalidated, errors } = await invalidateItems(items);
    return new Response(JSON.stringify({ invalidated, errors }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
} 