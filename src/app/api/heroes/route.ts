import { NextRequest, NextResponse } from 'next/server';

import { fetchOpenDotaHeroes } from '@/lib/api/opendota/heroes';
import { ApiErrorResponse, ApiHeroSummary } from '@/types/api';
import { schemas } from '@/types/api-zod';

/**
 * Handle heroes API errors
 */
function handleHeroesError(error: Error): ApiErrorResponse {
  if (error.message.includes('Rate limited')) {
    return {
      error: 'Rate limited by OpenDota API',
      status: 429,
      details: 'Too many requests to OpenDota API. Please try again later.',
    };
  }

  if (error.message.includes('Failed to parse')) {
    return {
      error: 'Invalid heroes data',
      status: 422,
      details: 'Heroes data is invalid or corrupted.',
    };
  }

  return {
    error: 'Failed to fetch heroes',
    status: 500,
    details: error.message,
  };
}

/**
 * @swagger
 * /api/heroes:
 *   get:
 *     summary: Fetch Dota 2 heroes data from OpenDota API
 *     description: Retrieves raw heroes data from OpenDota API including hero attributes, roles, and statistics.
 *     tags:
 *       - Heroes
 *     parameters:
 *       - in: query
 *         name: force
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Force refresh of cached data
 *     responses:
 *       200:
 *         description: Successfully retrieved heroes data
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   name:
 *                     type: string
 *                   localized_name:
 *                     type: string
 *                   primary_attr:
 *                     type: string
 *                   attack_type:
 *                     type: string
 *                   roles:
 *                     type: array
 *                     items:
 *                       type: string
 *                   img:
 *                     type: string
 *                   icon:
 *                     type: string
 *                   base_health:
 *                     type: integer
 *                   base_mana:
 *                     type: integer
 *                   base_armor:
 *                     type: integer
 *                   base_attack_min:
 *                     type: integer
 *                   base_attack_max:
 *                     type: integer
 *                   move_speed:
 *                     type: integer
 *                   base_attack_time:
 *                     type: number
 *                   attack_point:
 *                     type: number
 *                   attack_range:
 *                     type: integer
 *                   projectile_speed:
 *                     type: integer
 *                   turn_rate:
 *                     type: number
 *                   cm_enabled:
 *                     type: boolean
 *                   legs:
 *                     type: integer
 *                   day_vision:
 *                     type: integer
 *                   night_vision:
 *                     type: integer
 *                   hero_id:
 *                     type: integer
 *                   turbo_picks:
 *                     type: integer
 *                   turbo_wins:
 *                     type: integer
 *                   pro_ban:
 *                     type: integer
 *                   pro_win:
 *                     type: integer
 *                   pro_pick:
 *                     type: integer
 *               example:
 *                 - id: 1
 *                   name: "antimage"
 *                   localized_name: "Anti-Mage"
 *                   primary_attr: "agi"
 *                   attack_type: "Melee"
 *                   roles: ["Carry", "Escape", "Nuker"]
 *                   img: "/apps/dota2/images/dota_react/heroes/antimage.png"
 *                   icon: "/apps/dota2/images/dota_react/heroes/icons/antimage.png"
 *                   base_health: 200
 *                   base_mana: 75
 *                   base_armor: 0
 *                   base_attack_min: 29
 *                   base_attack_max: 33
 *                   move_speed: 310
 *                   base_attack_time: 1.4
 *                   attack_point: 0.3
 *                   attack_range: 150
 *                   projectile_speed: 0
 *                   turn_rate: 0.8
 *                   cm_enabled: true
 *                   legs: 2
 *                   day_vision: 1800
 *                   night_vision: 800
 *                   hero_id: 1
 *                   turbo_picks: 12345
 *                   turbo_wins: 6789
 *                   pro_ban: 123
 *                   pro_win: 45
 *                   pro_pick: 67
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
 *         description: Invalid heroes data
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
 *               error: "Invalid heroes data"
 *               status: 422
 *               details: "Heroes data is invalid or corrupted."
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
 *               error: "Failed to fetch heroes"
 *               status: 500
 *               details: "Unknown error occurred"
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Extract query parameters
    const { searchParams } = new URL(request.url);
    const force = searchParams.get('force') === 'true';

    // Fetch raw heroes data (handles caching, rate limiting, mock mode)
    const heroes = await fetchOpenDotaHeroes(force);

    // Trim to summary and validate output shape against Zod schema before responding
    try {
      const summaries: ApiHeroSummary[] = (heroes || []).map((h) => ({
        id: h.id,
        name: h.name,
        localized_name: h.localized_name,
        primary_attr: h.primary_attr,
        attack_type: h.attack_type,
        roles: h.roles,
      }));
      const validated = schemas.getApiHeroes.parse(summaries);
      return NextResponse.json(validated);
    } catch {
      // Normalize validation errors to our 422 handler branch
      throw new Error('Failed to parse heroes data');
    }
  } catch (error) {
    console.error('Heroes API Error:', error);

    if (error instanceof Error) {
      const errorResponse = handleHeroesError(error);
      return NextResponse.json(errorResponse, { status: errorResponse.status });
    }

    const errorResponse: ApiErrorResponse = {
      error: 'Failed to fetch heroes',
      status: 500,
      details: 'Unknown error occurred',
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
