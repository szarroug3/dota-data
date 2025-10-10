import { NextRequest, NextResponse } from 'next/server';

import { fetchOpenDotaMatch } from '@/lib/api/opendota/matches';
import { apiLogger } from '@/lib/logger';
import { ApiErrorResponse } from '@/types/api';
import { schemas } from '@/types/api-zod';

/**
 * Handle match API errors
 */
function handleMatchError(error: Error, matchId: string): ApiErrorResponse {
  if (error.message.includes('429')) {
    return {
      error: 'Rate limited by OpenDota API',
      status: 429,
      details: 'Too many requests to OpenDota API. Please try again later.',
    };
  }
  if (error.message.includes('Rate limited')) {
    return {
      error: 'Rate limited by OpenDota API',
      status: 429,
      details: 'Too many requests to OpenDota API. Please try again later.',
    };
  }

  if (error.message.includes('Match not found')) {
    return {
      error: 'Match not found',
      status: 404,
      details: `Match with ID ${matchId} could not be found.`,
    };
  }

  if (error.message.includes('Failed to parse')) {
    return {
      error: 'Invalid match data',
      status: 422,
      details: 'Match data is invalid or corrupted.',
    };
  }

  return {
    error: 'Failed to fetch match',
    status: 500,
    details: error.message,
  };
}

/**
 * @swagger
 * /api/matches/{id}:
 *   get:
 *     summary: Fetch Dota 2 match data from OpenDota API
 *     description: Retrieves raw match data from OpenDota API including players, teams, and game statistics.
 *     tags:
 *       - Matches
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Match ID (numeric string)
 *       - in: query
 *         name: force
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Force refresh of cached data
 *     responses:
 *       200:
 *         description: Successfully retrieved match data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               description: Raw match data from OpenDota API
 *               example:
 *                 match_id: 8054301932
 *                 radiant_win: true
 *                 duration: 2150
 *                 start_time: 1640995200
 *                 game_mode: 1
 *                 lobby_type: 7
 *                 players:
 *                   - account_id: 123456789
 *                     hero_id: 1
 *                     kills: 8
 *                     deaths: 2
 *                     assists: 12
 *                     last_hits: 185
 *                     denies: 15
 *                     gold_per_min: 650
 *                     xp_per_min: 720
 *       404:
 *         description: Match not found
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
 *               error: "Match not found"
 *               status: 404
 *               details: "Match with ID 8054301932 could not be found."
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
 *               error: "Failed to fetch match"
 *               status: 500
 *               details: "Unknown error occurred"
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const { id: matchId } = await params;

    // Extract query parameters
    const { searchParams } = new URL(request.url);
    const force = searchParams.get('force') === 'true';

    // Fetch raw match data (handles caching, rate limiting, mock mode)
    const match = await fetchOpenDotaMatch(matchId, force);

    // Validate response shape (permissive schema)
    try {
      const validated = schemas.getApiMatches.parse(match);
      return NextResponse.json(validated);
    } catch {
      throw new Error('Failed to parse match');
    }
  } catch (error) {
    const { id } = await params;
    apiLogger.error(
      'Matches API Error',
      `Failed to fetch match data for ID: ${id} - ${error instanceof Error ? error.message : 'Unknown error'}`,
    );

    if (error instanceof Error) {
      const { id } = await params;
      const errorResponse = handleMatchError(error, id);
      return NextResponse.json(errorResponse, { status: errorResponse.status });
    }

    const errorResponse: ApiErrorResponse = {
      error: 'Failed to fetch match',
      status: 500,
      details: 'Unknown error occurred',
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
