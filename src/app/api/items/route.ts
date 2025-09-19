import { NextRequest, NextResponse } from 'next/server';

import { fetchOpenDotaItems } from '@/lib/api/opendota/items';
import { ApiErrorResponse } from '@/types/api';
import { schemas } from '@/types/api-zod';

/**
 * Handle items API errors
 */
function handleItemsError(error: Error): ApiErrorResponse {
  if (error.message.includes('Rate limited')) {
    return {
      error: 'Rate limited by OpenDota API',
      status: 429,
      details: 'Too many requests to OpenDota API. Please try again later.',
    };
  }

  if (error.message.includes('Failed to parse')) {
    return {
      error: 'Invalid items data',
      status: 422,
      details: 'Items data is invalid or corrupted.',
    };
  }

  return {
    error: 'Failed to fetch items',
    status: 500,
    details: error.message,
  };
}

/**
 * @swagger
 * /api/items:
 *   get:
 *     summary: Fetch Dota 2 items data from OpenDota API
 *     description: Retrieves raw items data from OpenDota API including item attributes, abilities, and statistics.
 *     tags:
 *       - Items
 *     parameters:
 *       - in: query
 *         name: force
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Force refresh of cached data
 *     responses:
 *       200:
 *         description: Successfully retrieved items data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               additionalProperties:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   img:
 *                     type: string
 *                   dname:
 *                     type: string
 *                   qual:
 *                     type: string
 *                   cost:
 *                     type: integer
 *                   behavior:
 *                     oneOf:
 *                       - type: string
 *                       - type: array
 *                         items:
 *                           type: string
 *                       - type: boolean
 *                   target_team:
 *                     oneOf:
 *                       - type: string
 *                       - type: array
 *                         items:
 *                           type: string
 *                   target_type:
 *                     oneOf:
 *                       - type: string
 *                       - type: array
 *                         items:
 *                           type: string
 *                   notes:
 *                     type: string
 *                   attrib:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         key:
 *                           type: string
 *                         value:
 *                           oneOf:
 *                             - type: string
 *                             - type: number
 *                         display:
 *                           type: string
 *                   mc:
 *                     oneOf:
 *                       - type: integer
 *                       - type: boolean
 *                   hc:
 *                     oneOf:
 *                       - type: integer
 *                       - type: boolean
 *                   cd:
 *                     oneOf:
 *                       - type: integer
 *                       - type: boolean
 *                   lore:
 *                     type: string
 *                   components:
 *                     oneOf:
 *                       - type: array
 *                         items:
 *                           type: string
 *                       - type: null
 *                   created:
 *                     type: boolean
 *                   charges:
 *                     oneOf:
 *                       - type: integer
 *                       - type: boolean
 *                   abilities:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         type:
 *                           type: string
 *                         title:
 *                           type: string
 *                         description:
 *                           type: string
 *                   hint:
 *                     type: array
 *                     items:
 *                       type: string
 *                   dispellable:
 *                     type: string
 *                   dmg_type:
 *                     type: string
 *                   bkbpierce:
 *                     type: string
 *                   tier:
 *                     type: integer
 *             example:
 *               blink:
 *                 id: 1
 *                 img: "/apps/dota2/images/dota_react/items/blink.png?t=1593393829403"
 *                 dname: "Blink Dagger"
 *                 qual: "component"
 *                 cost: 2250
 *                 behavior: "Point Target"
 *                 notes: "Self-casting will cause you to teleport in the direction of your team's fountain."
 *                 attrib:
 *                   - key: "blink_range"
 *                     value: "1200"
 *                   - key: "blink_damage_cooldown"
 *                     value: "3.0"
 *                   - key: "blink_range_clamp"
 *                     value: "960"
 *                 mc: false
 *                 hc: false
 *                 cd: 15
 *                 lore: "The fabled dagger used by the fastest assassin ever to walk the lands."
 *                 components: null
 *                 created: false
 *                 charges: false
 *                 abilities:
 *                   - type: "active"
 *                     title: "Blink"
 *                     description: "Teleport to a target point up to 1200 units away. \n\nBlink Dagger cannot be used for 3 seconds after taking damage from an enemy hero or Roshan."
 *       429:
 *         description: Rate limited by OpenDota API
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                 status:
 *                   type: integer
 *                 details:
 *                   type: string
 *             example:
 *               error: "Rate limited by OpenDota API"
 *               status: 429
 *               details: "Too many requests to OpenDota API. Please try again later."
 *       422:
 *         description: Invalid items data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                 status:
 *                   type: integer
 *                 details:
 *                   type: string
 *             example:
 *               error: "Invalid items data"
 *               status: 422
 *               details: "Items data is invalid or corrupted."
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                 status:
 *                   type: integer
 *                 details:
 *                   type: string
 *             example:
 *               error: "Failed to fetch items"
 *               status: 500
 *               details: "Unknown error occurred"
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Extract query parameters
    const { searchParams } = new URL(request.url);
    const force = searchParams.get('force') === 'true';

    // Fetch raw items data (handles caching, rate limiting, mock mode)
    const items = await fetchOpenDotaItems(force);
    console.log(items);

    try {
      const validated = schemas.getApiItems.parse(items);
      return NextResponse.json(validated);
    } catch {
      // Normalize validation errors to our 422 handler branch
      throw new Error('Failed to parse items data');
    }
  } catch (error) {
    console.error('Items API Error:', error);

    if (error instanceof Error) {
      const errorResponse = handleItemsError(error);
      return NextResponse.json(errorResponse, { status: errorResponse.status });
    }

    const errorResponse: ApiErrorResponse = {
      error: 'Failed to fetch items',
      status: 500,
      details: 'Unknown error occurred',
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
