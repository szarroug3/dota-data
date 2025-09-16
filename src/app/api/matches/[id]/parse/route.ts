import { NextRequest, NextResponse } from 'next/server';

import { parseOpenDotaMatchWithJobPolling } from '@/lib/api/opendota/matches';
import { ApiErrorResponse } from '@/types/api';
import { schemas } from '@/types/api-zod';

/**
 * Handle match parsing errors
 */
function handleMatchParsingError(error: Error, matchId: string): ApiErrorResponse {
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
      details: `Match with ID ${matchId} could not be found for parsing.`,
    };
  }

  if (error.message.includes('Match parsing timed out')) {
    return {
      error: 'Match parsing timed out',
      status: 408,
      details: 'Match parsing took too long to complete. Please try again later.',
    };
  }

  if (error.message.includes('Failed to parse')) {
    return {
      error: 'Invalid match data',
      status: 422,
      details: 'Match data is invalid and cannot be parsed.',
    };
  }

  return {
    error: 'Failed to parse match',
    status: 500,
    details: error.message,
  };
}

/**
 * @swagger
 * /api/matches/{id}/parse:
 *   post:
 *     summary: Parse a Dota 2 match
 *     description: Initiates match parsing through OpenDota API and polls for completion. Returns parsed match data when complete.
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
 *         name: timeout
 *         schema:
 *           type: integer
 *           default: 60000
 *         description: Maximum time to wait for parsing completion (in milliseconds)
 *     responses:
 *       200:
 *         description: Match parsing completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               description: Parsed match data from OpenDota API
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
 *                 teamfights:
 *                   - start: 600
 *                     end: 900
 *                     last_death: 850
 *                     deaths: 3
 *                     players: []
 *                 picks_bans:
 *                   - is_pick: true
 *                     hero_id: 1
 *                     team: 0
 *                     order: 0
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
 *               details: "Match with ID 8054301932 could not be found for parsing."
 *       408:
 *         description: Match parsing timed out
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
 *               error: "Match parsing timed out"
 *               status: 408
 *               details: "Match parsing took too long to complete. Please try again later."
 *       422:
 *         description: Invalid match data
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
 *               error: "Invalid match data"
 *               status: 422
 *               details: "Match data is invalid and cannot be parsed."
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
 *               error: "Failed to parse match"
 *               status: 500
 *               details: "Unknown error occurred"
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
  try {
    const matchId = params.id;

    // Extract query parameters
    const { searchParams } = new URL(request.url);
    const timeout = Number(searchParams.get('timeout')) || 60000; // 1 minute default

    // Parse match using the library function
    const parsedMatch = await parseOpenDotaMatchWithJobPolling(matchId, timeout);

    // Validate response
    try {
      const validated = schemas.getApiMatches.parse(parsedMatch);
      return NextResponse.json(validated);
    } catch {
      throw new Error('Invalid match data');
    }
  } catch (error) {
    console.error('Match Parse API Error:', error);

    if (error instanceof Error) {
      const errorResponse = handleMatchParsingError(error, params.id);
      return NextResponse.json(errorResponse, { status: errorResponse.status });
    }

    const errorResponse: ApiErrorResponse = {
      error: 'Failed to parse match',
      status: 500,
      details: 'Unknown error occurred',
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
