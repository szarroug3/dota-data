import { NextRequest, NextResponse } from 'next/server';

import { fetchDotabuffLeague } from '@/lib/api/dotabuff/leagues';
import { ApiErrorResponse } from '@/types/api';
import { DotabuffLeague, DotabuffMatchSummary } from '@/types/external-apis';

/**
 * League statistics interface
 */
interface LeagueStatistics {
  totalMatches: number;
  averageDuration: number;
  radiantWins: number;
  direWins: number;
  uniqueTeams: number;
}

/**
 * Processed league data interface
 */
interface ProcessedLeague {
  leagueId: number;
  name: string;
  description?: string;
  tournamentUrl?: string;
  matches?: DotabuffMatchSummary[];
  statistics?: LeagueStatistics;
  processed: {
    timestamp: string;
    version: string;
  };
}

/**
 * Validate league ID parameter
 */
function validateLeagueId(leagueId: string): ApiErrorResponse | null {
  if (!leagueId || isNaN(Number(leagueId))) {
    return {
      error: 'Invalid league ID',
      status: 400,
      details: 'League ID must be a valid number'
    };
  }
  return null;
}

/**
 * Calculate league statistics from matches
 */
function calculateLeagueStatistics(matches: DotabuffMatchSummary[]): LeagueStatistics | undefined {
  if (!matches || matches.length === 0) {
    return undefined;
  }

  const averageDuration = matches.reduce((sum, match) => sum + match.duration, 0) / matches.length;
  const radiantWins = matches.filter(match => match.radiant_win).length;
  const direWins = matches.filter(match => !match.radiant_win).length;
  const uniqueTeams = new Set([
    ...matches.map(match => match.radiant_name),
    ...matches.map(match => match.dire_name)
  ]).size;

  return {
    totalMatches: matches.length,
    averageDuration,
    radiantWins,
    direWins,
    uniqueTeams
  };
}

/**
 * Process raw league data
 */
function processLeagueData(rawLeague: DotabuffLeague, includeMatches: boolean): ProcessedLeague {
  const statistics = calculateLeagueStatistics(rawLeague.matches || []);

  return {
    leagueId: rawLeague.league_id,
    name: rawLeague.name,
    description: rawLeague.description,
    tournamentUrl: rawLeague.tournament_url,
    matches: includeMatches ? rawLeague.matches : undefined,
    statistics,
    processed: {
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    }
  };
}

/**
 * Filter response data based on view parameter
 */
function filterResponseByView(processedLeague: ProcessedLeague, view?: string): ProcessedLeague {
  if (view === 'summary') {
    return {
      leagueId: processedLeague.leagueId,
      name: processedLeague.name,
      description: processedLeague.description,
      tournamentUrl: processedLeague.tournamentUrl,
      matches: processedLeague.matches,
      statistics: processedLeague.statistics,
      processed: processedLeague.processed
    };
  }
  
  return processedLeague;
}

/**
 * Handle league API errors
 */
function handleLeagueError(error: Error, leagueId: string): ApiErrorResponse {
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
      details: `League with ID ${leagueId} could not be found.`
    };
  }

  if (error.message.includes('Invalid league')) {
    return {
      error: 'Invalid league data',
      status: 422,
      details: 'League data is invalid or corrupted.'
    };
  }

  if (error.message.includes('Tournament not found')) {
    return {
      error: 'Tournament not found',
      status: 404,
      details: 'League tournament information could not be found.'
    };
  }

  return {
    error: 'Failed to process league',
    status: 500,
    details: error.message
  };
}

/**
 * @swagger
 * /api/leagues/{id}:
 *   get:
 *     summary: Fetch and process Dota 2 league data
 *     description: Retrieves league information including tournament details, matches, and statistics from Dotabuff. Supports different view modes for optimized data delivery.
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
 *       - in: query
 *         name: includeMatches
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Include matches data in the response
 *       - in: query
 *         name: view
 *         schema:
 *           type: string
 *           enum: [full, summary]
 *           default: full
 *         description: Data view mode (full=all data, summary=basic info)
 *     responses:
 *       200:
 *         description: Successfully retrieved league data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     leagueId:
 *                       type: string
 *                     name:
 *                       type: string
 *                     description:
 *                       type: string
 *                     tournamentUrl:
 *                       type: string
 *                     matches:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           matchId:
 *                             type: string
 *                           duration:
 *                             type: integer
 *                           radiant_win:
 *                             type: boolean
 *                           radiant_name:
 *                             type: string
 *                           dire_name:
 *                             type: string
 *                     statistics:
 *                       type: object
 *                       properties:
 *                         totalMatches:
 *                           type: integer
 *                         averageDuration:
 *                           type: number
 *                         radiantWins:
 *                           type: integer
 *                         direWins:
 *                           type: integer
 *                         uniqueTeams:
 *                           type: integer
 *                     processed:
 *                       type: object
 *                       properties:
 *                         timestamp:
 *                           type: string
 *                         version:
 *                           type: string
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
 *             example:
 *               data:
 *                 leagueId: "16435"
 *                 name: "The International 2024"
 *                 description: "The International is the premier Dota 2 tournament"
 *                 tournamentUrl: "https://www.dota2.com/esports/ti2024"
 *                 matches:
 *                   - matchId: "8054301932"
 *                     duration: 2150
 *                     radiant_win: true
 *                     radiant_name: "Team Spirit"
 *                     dire_name: "Team Secret"
 *                 statistics:
 *                   totalMatches: 156
 *                   averageDuration: 2247
 *                   radiantWins: 78
 *                   direWins: 78
 *                   uniqueTeams: 16
 *                 processed:
 *                   timestamp: "2024-01-01T00:00:00.000Z"
 *                   version: "1.0.0"
 *               timestamp: "2024-01-01T00:00:00.000Z"
 *               view: "full"
 *               options:
 *                 includeMatches: true
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
 *               error: "Failed to process league"
 *               status: 500
 *               details: "Unknown error occurred"
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const leagueId = params.id;

    // Validate league ID
    const validationError = validateLeagueId(leagueId);
    if (validationError) {
      return NextResponse.json(validationError, { status: validationError.status });
    }

    // Extract query parameters
    const { searchParams } = new URL(request.url);
    const force = searchParams.get('force') === 'true';
    const includeMatches = searchParams.get('includeMatches') === 'true';
    const view = searchParams.get('view') as 'full' | 'summary' | undefined;

    // Fetch raw league data (handles caching, rate limiting, mock mode)
    const rawLeague = await fetchDotabuffLeague(leagueId, force);

    // Process and format league data
    const processedLeague = processLeagueData(rawLeague, includeMatches);

    // Filter response based on view parameter
    const responseData = filterResponseByView(processedLeague, view);

    // Return successful response
    return NextResponse.json({
      data: responseData,
      timestamp: new Date().toISOString(),
      view: view || 'full',
      options: {
        includeMatches
      }
    });

  } catch (error) {
    console.error('Leagues API Error:', error);
    
    if (error instanceof Error) {
      const errorResponse = handleLeagueError(error, params.id);
      return NextResponse.json(errorResponse, { status: errorResponse.status });
    }

    const errorResponse: ApiErrorResponse = {
      error: 'Failed to process league',
      status: 500,
      details: 'Unknown error occurred'
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
} 