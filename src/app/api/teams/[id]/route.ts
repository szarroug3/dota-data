import { NextRequest, NextResponse } from 'next/server';

import { fetchDotabuffTeam } from '@/lib/api/dotabuff/teams';
import { ApiErrorResponse } from '@/types/api';

/**
 * Handle team API errors
 */
function handleTeamError(error: Error, teamId: string): ApiErrorResponse {
  if (error.message.includes('Rate limited')) {
    return {
      error: 'Rate limited by Dotabuff API',
      status: 429,
      details: 'Too many requests to Dotabuff API. Please try again later.'
    };
  }

  if (error.message.includes('Data Not Found') || error.message.includes('Failed to load')) {
    return {
      error: 'Data Not Found',
      status: 404,
      details: `Team with ID ${teamId} could not be found.`
    };
  }

  if (error.message.includes('Invalid team')) {
    return {
      error: 'Invalid team data',
      status: 422,
      details: 'Team data is invalid or corrupted.'
    };
  }

  return {
    error: 'Failed to process team',
    status: 500,
    details: error.message
  };
}

/**
 * @swagger
 * /api/teams/{id}:
 *   get:
 *     summary: Fetch and process Dota 2 team data for Dota Scout Assistant
 *     description: Retrieves comprehensive team data including statistics, performance metrics, and roster information from Dotabuff. Supports different view modes for optimized data delivery.
 *     tags:
 *       - Teams
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Team ID (numeric string)
 *       - in: query
 *         name: force
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Force refresh of cached data
 *       - in: query
 *         name: view
 *         schema:
 *           type: string
 *           enum: [full, summary]
 *           default: full
 *         description: Data view mode (full=all data, summary=basic statistics)
 *       - in: query
 *         name: includeMatches
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Include recent matches data
 *       - in: query
 *         name: includeRoster
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Include team roster information
 *     responses:
 *       200:
 *         description: Successfully retrieved team data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     teamId:
 *                       type: string
 *                     name:
 *                       type: string
 *                     tag:
 *                       type: string
 *                     performance:
 *                       type: object
 *                       properties:
 *                         recentForm:
 *                           type: string
 *                         strength:
 *                           type: string
 *                         consistency:
 *                           type: string
 *                     statistics:
 *                       type: object
 *                       properties:
 *                         totalMatches:
 *                           type: integer
 *                         wins:
 *                           type: integer
 *                         losses:
 *                           type: integer
 *                         winRate:
 *                           type: number
 *                         rating:
 *                           type: number
 *                         lastMatchTime:
 *                           type: string
 *                         averageMatchDuration:
 *                           type: number
 *                     processed:
 *                       type: object
 *                       properties:
 *                         timestamp:
 *                           type: string
 *                         dataQuality:
 *                           type: string
 *                         completeness:
 *                           type: number
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 view:
 *                   type: string
 *                 options:
 *                   type: object
 *                   properties:
 *                     includeMatches:
 *                       type: boolean
 *                     includeRoster:
 *                       type: boolean
 *             example:
 *               data:
 *                 teamId: "9517508"
 *                 name: "Team Spirit"
 *                 tag: "TS"
 *                 performance:
 *                   recentForm: "strong"
 *                   strength: "high"
 *                   consistency: "stable"
 *                 statistics:
 *                   totalMatches: 150
 *                   wins: 95
 *                   losses: 55
 *                   winRate: 0.633
 *                   rating: 1850
 *                   lastMatchTime: "2024-01-01T00:00:00.000Z"
 *                   averageMatchDuration: 2400
 *                 processed:
 *                   timestamp: "2024-01-01T00:00:00.000Z"
 *                   dataQuality: "high"
 *                   completeness: 0.9
 *               timestamp: "2024-01-01T00:00:00.000Z"
 *               view: "full"
 *               options:
 *                 includeMatches: false
 *                 includeRoster: false
 *       400:
 *         description: Invalid team ID
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
 *               error: "Invalid team ID"
 *               status: 400
 *               details: "Team ID must be a valid number"
 *       404:
 *         description: Team not found
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
 *               details: "Team with ID 9517508 could not be found."
 *       422:
 *         description: Invalid team data
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
 *               error: "Invalid team data"
 *               status: 422
 *               details: "Team data is invalid or corrupted."
 *       429:
 *         description: Rate limited by Dotabuff API
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
 *               error: "Rate limited by Dotabuff API"
 *               status: 429
 *               details: "Too many requests to Dotabuff API. Please try again later."
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
 *               error: "Failed to process team"
 *               status: 500
 *               details: "Unknown error occurred"
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id: teamId } = await params;

    // Extract query parameters
    const { searchParams } = new URL(request.url);
    const force = searchParams.get('force') === 'true';

    // Fetch raw team data (handles caching, rate limiting, mock mode)
    const team = await fetchDotabuffTeam(teamId, force);

    // Return successful response
    return NextResponse.json(team);
  } catch (error) {
    console.error('Teams API Error:', error);
    
    if (error instanceof Error) {
      const { id } = await params;
      const errorResponse = handleTeamError(error, id);
      return NextResponse.json(errorResponse, { status: errorResponse.status });
    }

    const errorResponse: ApiErrorResponse = {
      error: 'Failed to process team',
      status: 500,
      details: 'Unknown error occurred'
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
} 