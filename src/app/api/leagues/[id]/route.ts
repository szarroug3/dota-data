import { NextRequest, NextResponse } from 'next/server';

import { fetchSteamLeague } from '@/lib/api/steam/leagues';
import { ApiErrorResponse } from '@/types/api';

/**
 * Handle league API errors
 */
function handleLeagueError(error: Error, leagueId: string): ApiErrorResponse {
  if (error.message.includes('Rate limited')) {
    return {
      error: 'Rate limited by Steam API',
      status: 429,
      details: 'Too many requests to Steam API. Please try again later.',
    };
  }

  if (error.message.includes('Data Not Found') || error.message.includes('Failed to load')) {
    return {
      error: 'Data Not Found',
      status: 404,
      details: `League with ID ${leagueId} could not be found.`,
    };
  }

  if (error.message.includes('Invalid league')) {
    return {
      error: 'Invalid league data',
      status: 422,
      details: 'League data is invalid or corrupted.',
    };
  }

  if (error.message.includes('Tournament not found')) {
    return {
      error: 'Tournament not found',
      status: 404,
      details: 'League tournament information could not be found.',
    };
  }

  return {
    error: 'Failed to process league',
    status: 500,
    details: error.message,
  };
}

/**
 * @swagger
 * /api/leagues/{id}:
 *   get:
 *     summary: Fetch Steam league match history (fully aggregated)
 *     description: Retrieves league information from Steam Web API (GetMatchHistory) using league_id. The backend aggregates all pages server-side and returns a single unmodified-style Steam payload: { result: { status, num_results, total_results, results_remaining: 0, matches[] } }.
 *     tags:
 *       - Leagues
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: League ID (numeric string)
 *       - in: query
 *         name: force
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Force refresh of cached data
 *
 *     responses:
 *       200:
 *         description: Successfully retrieved league data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: integer
 *                     num_results:
 *                       type: integer
 *                     total_results:
 *                       type: integer
 *                     results_remaining:
 *                       type: integer
 *                     matches:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           match_id:
 *                             type: integer
 *                           radiant_team_id:
 *                             type: integer
 *                           dire_team_id:
 *                             type: integer
 *             example:
 *               result:
 *                 status: 1
 *                 matches:
 *                   - match_id: 8465523307
 *                     radiant_team_id: 8654939
 *                     dire_team_id: 9849961
 *       400:
 *         description: Invalid league ID
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
 *               error: "Invalid league ID"
 *               status: 400
 *               details: "League ID must be a valid number"
 *       404:
 *         description: League not found
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
 *               details: "League with ID 16435 could not be found."
 *       422:
 *         description: Invalid league data
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
 *               error: "Invalid league data"
 *               status: 422
 *               details: "League data is invalid or corrupted."
 *       429:
 *         description: Rate limited by Steam API
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
 *               error: "Rate limited by Steam API"
 *               status: 429
 *               details: "Too many requests to Steam API. Please try again later."
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
 *               error: "Failed to process league"
 *               status: 500
 *               details: "Unknown error occurred"
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id: leagueId } = await params;

  try {
    const { searchParams } = new URL(request.url);
    const force = searchParams.get('force') === 'true';
    const response = await fetchSteamLeague(leagueId, force);
    return NextResponse.json(response);
  } catch (error) {
    console.error('Leagues API Error:', error);

    if (error instanceof Error) {
      const errorResponse = handleLeagueError(error, leagueId);
      return NextResponse.json(errorResponse, { status: errorResponse.status });
    }

    const errorResponse: ApiErrorResponse = {
      error: 'Failed to process league',
      status: 500,
      details: 'Unknown error occurred',
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
