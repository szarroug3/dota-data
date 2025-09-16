import { NextRequest, NextResponse } from 'next/server';

import { fetchOpenDotaPlayer } from '@/lib/api/opendota/players';
import { ApiErrorResponse } from '@/types/api';
import { schemas } from '@/types/api-zod';

/**
 * Handle player API errors
 */
function handlePlayerError(error: Error, playerId: string): ApiErrorResponse {
  if (error.message.includes('Rate limited')) {
    return {
      error: 'Rate limited by OpenDota API',
      status: 429,
      details: 'Too many requests to OpenDota API. Please try again later.',
    };
  }

  if (error.message.includes('Player not found') || error.message.includes('Failed to fetch')) {
    return {
      error: 'Data Not Found',
      status: 404,
      details: `Player with ID ${playerId} could not be found.`,
    };
  }

  if (error.message.includes('Invalid player')) {
    return {
      error: 'Invalid player data',
      status: 422,
      details: 'Player data is invalid or corrupted.',
    };
  }

  if (error.message.includes('Private profile')) {
    return {
      error: 'Private profile',
      status: 403,
      details: 'Player profile is private and cannot be accessed.',
    };
  }

  return {
    error: 'Failed to fetch player',
    status: 500,
    details: error.message,
  };
}

/**
 * @swagger
 * /api/players/{id}:
 *   get:
 *     summary: Fetch comprehensive Dota 2 player data from all OpenDota endpoints
 *     description: Retrieves complete player data including profile, statistics, heroes, counts, totals, win/loss, recent matches, rankings, ratings, and ward map. Includes rate limiting with delays between API calls.
 *     tags:
 *       - Players
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Player account ID (numeric string)
 *       - in: query
 *         name: force
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Force refresh of cached data
 *     responses:
 *       200:
 *         description: Successfully retrieved comprehensive player data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               description: Comprehensive player data from OpenDota API
 *       404:
 *         description: Player not found
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
 *               error: "Data Not Found"
 *               status: 404
 *               details: "Player with ID 40927904 could not be found."
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
 *               error: "Failed to fetch player"
 *               status: 500
 *               details: "Unknown error occurred"
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const { id: playerId } = await params;

    // Extract query parameters
    const { searchParams } = new URL(request.url);
    const force = searchParams.get('force') === 'true';

    // Fetch comprehensive player data (handles caching, rate limiting, mock mode)
    const player = await fetchOpenDotaPlayer(playerId, force);

    // Validate response shape (permissive unknown in schema, still parse for consistency)
    try {
      const validated = schemas.getApiPlayers.parse(player);
      return NextResponse.json(validated);
    } catch {
      throw new Error('Invalid player data');
    }
  } catch (error) {
    console.error('Players API Error:', error);

    if (error instanceof Error) {
      const { id } = await params;
      const errorResponse = handlePlayerError(error, id);
      return NextResponse.json(errorResponse, { status: errorResponse.status });
    }

    const errorResponse: ApiErrorResponse = {
      error: 'Failed to fetch player',
      status: 500,
      details: 'Unknown error occurred',
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
