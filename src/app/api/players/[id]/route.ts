import { NextRequest, NextResponse } from 'next/server';

import { fetchOpenDotaPlayer } from '@/lib/api/opendota/player-profile';
import { ProcessedPlayer, processPlayer } from '@/lib/services/player-processor';
import { ApiErrorResponse } from '@/types/api';

/**
 * Validate player ID parameter
 */
function validatePlayerId(playerId: string): ApiErrorResponse | null {
  if (!playerId || isNaN(Number(playerId))) {
    return {
      error: 'Invalid player ID',
      status: 400,
      details: 'Player ID must be a valid number'
    };
  }
  return null;
}

/**
 * Filter response data based on view parameter
 */
function filterResponseByView(processedPlayer: ProcessedPlayer, view?: string): ProcessedPlayer {
  if (view === 'profile') {
    return {
      profile: processedPlayer.profile,
      statistics: processedPlayer.statistics,
      performance: processedPlayer.performance,
      recentActivity: processedPlayer.recentActivity,
      heroes: processedPlayer.heroes,
      trends: processedPlayer.trends,
      processed: processedPlayer.processed
    };
  }
  
  if (view === 'stats') {
    return {
      profile: processedPlayer.profile,
      statistics: processedPlayer.statistics,
      performance: processedPlayer.performance,
      recentActivity: processedPlayer.recentActivity,
      heroes: processedPlayer.heroes,
      trends: processedPlayer.trends,
      processed: processedPlayer.processed
    };
  }
  
  if (view === 'recent') {
    return {
      profile: processedPlayer.profile,
      statistics: processedPlayer.statistics,
      performance: processedPlayer.performance,
      recentActivity: processedPlayer.recentActivity,
      heroes: processedPlayer.heroes,
      trends: processedPlayer.trends,
      processed: processedPlayer.processed
    };
  }
  
  return processedPlayer;
}

/**
 * Handle player API errors
 */
function handlePlayerError(error: Error, playerId: string): ApiErrorResponse {
  if (error.message.includes('Rate limited')) {
    return {
      error: 'Rate limited by OpenDota API',
      status: 429,
      details: 'Too many requests to OpenDota API. Please try again later.'
    };
  }

  if (error.message.includes('Data Not Found') || error.message.includes('Failed to load')) {
    return {
      error: 'Data Not Found',
      status: 404,
      details: `Player with ID ${playerId} could not be found.`
    };
  }

  if (error.message.includes('Invalid player')) {
    return {
      error: 'Invalid player data',
      status: 422,
      details: 'Player data is invalid or corrupted.'
    };
  }

  if (error.message.includes('Private profile')) {
    return {
      error: 'Private profile',
      status: 403,
      details: 'Player profile is private and cannot be accessed.'
    };
  }

  return {
    error: 'Failed to process player',
    status: 500,
    details: error.message
  };
}

/**
 * @swagger
 * /api/players/{id}:
 *   get:
 *     summary: Fetch and process Dota 2 player data
 *     description: Retrieves comprehensive player data including profile, statistics, performance metrics, and recent activity. Supports different view modes for optimized data delivery.
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
 *       - in: query
 *         name: view
 *         schema:
 *           type: string
 *           enum: [full, profile, stats, recent]
 *           default: full
 *         description: Data view mode (full=all data, profile=basic info, stats=statistics, recent=recent activity)
 *       - in: query
 *         name: includeMatches
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Include recent matches data
 *       - in: query
 *         name: includeHeroes
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Include hero performance data
 *       - in: query
 *         name: includeRecent
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Include recent activity data
 *     responses:
 *       200:
 *         description: Successfully retrieved player data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     accountId:
 *                       type: string
 *                     profile:
 *                       type: object
 *                       properties:
 *                         accountId:
 *                           type: string
 *                         personaName:
 *                           type: string
 *                         avatar:
 *                           type: string
 *                         rankTier:
 *                           type: integer
 *                         leaderboardRank:
 *                           type: integer
 *                         mmrEstimate:
 *                           type: object
 *                         plus:
 *                           type: boolean
 *                     statistics:
 *                       type: object
 *                       properties:
 *                         winRate:
 *                           type: number
 *                         totalMatches:
 *                           type: integer
 *                         totalWins:
 *                           type: integer
 *                         totalLosses:
 *                           type: integer
 *                         avgKDA:
 *                           type: number
 *                         avgLastHits:
 *                           type: number
 *                         avgDenies:
 *                           type: number
 *                         avgGPM:
 *                           type: number
 *                         avgXPM:
 *                           type: number
 *                     performance:
 *                       type: object
 *                       properties:
 *                         recentPerformance:
 *                           type: string
 *                         skillLevel:
 *                           type: string
 *                         consistency:
 *                           type: string
 *                         impact:
 *                           type: string
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
 *                     includeHeroes:
 *                       type: boolean
 *                     includeRecent:
 *                       type: boolean
 *             example:
 *               data:
 *                 accountId: "12345678"
 *                 profile:
 *                   accountId: "12345678"
 *                   personaName: "Example Player"
 *                   avatar: "https://avatars.cloudflare.steamstatic.com/abc123.jpg"
 *                   rankTier: 75
 *                   leaderboardRank: 1500
 *                   mmrEstimate:
 *                     estimate: 5500
 *                   plus: true
 *                 statistics:
 *                   winRate: 0.62
 *                   totalMatches: 1250
 *                   totalWins: 775
 *                   totalLosses: 475
 *                   avgKDA: 2.8
 *                   avgLastHits: 185
 *                   avgDenies: 12
 *                   avgGPM: 520
 *                   avgXPM: 580
 *                 performance:
 *                   recentPerformance: "improving"
 *                   skillLevel: "high"
 *                   consistency: "stable"
 *                   impact: "high"
 *                 processed:
 *                   timestamp: "2024-01-01T00:00:00.000Z"
 *                   dataQuality: "high"
 *                   completeness: 0.95
 *               timestamp: "2024-01-01T00:00:00.000Z"
 *               view: "full"
 *               options:
 *                 includeMatches: false
 *                 includeHeroes: false
 *                 includeRecent: false
 *       400:
 *         description: Invalid player ID
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
 *               error: "Invalid player ID"
 *               status: 400
 *               details: "Player ID must be a valid number"
 *       403:
 *         description: Private profile
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
 *               error: "Private profile"
 *               status: 403
 *               details: "Player profile is private and cannot be accessed."
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
 *               details: "Player with ID 12345678 could not be found."
 *       422:
 *         description: Invalid player data
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
 *               error: "Invalid player data"
 *               status: 422
 *               details: "Player data is invalid or corrupted."
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
 *               error: "Failed to process player"
 *               status: 500
 *               details: "Unknown error occurred"
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const playerId = params.id;

    // Validate player ID
    const validationError = validatePlayerId(playerId);
    if (validationError) {
      return NextResponse.json(validationError, { status: validationError.status });
    }

    // Extract query parameters
    const { searchParams } = new URL(request.url);
    const force = searchParams.get('force') === 'true' || searchParams.get('force') === '1';
    const view = searchParams.get('view') as 'full' | 'profile' | 'stats' | 'recent' | undefined;
    const includeMatches = searchParams.get('includeMatches') === 'true' || searchParams.get('includeMatches') === '1';
    const includeHeroes = searchParams.get('includeHeroes') === 'true' || searchParams.get('includeHeroes') === '1';
    const includeRecent = searchParams.get('includeRecent') === 'true' || searchParams.get('includeRecent') === '1';

    // Fetch raw player data
    const openDotaPlayer = await fetchOpenDotaPlayer(playerId, force);

    // Process player through the processor
    const processedPlayer = processPlayer({
      profile: openDotaPlayer,
      matches: [],
      heroes: [],
      counts: {},
      totals: {} as import('@/types/external-apis').OpenDotaPlayerTotals,
      winLoss: { win: 0, lose: 0 },
      recentMatches: []
    });

    // Filter response based on view parameter
    const responseData = filterResponseByView(processedPlayer, view);

    // Return successful response
    return NextResponse.json({
      data: responseData,
      timestamp: new Date().toISOString(),
      view: view || 'full',
      options: {
        includeMatches,
        includeHeroes,
        includeRecent
      }
    });

  } catch (error) {
    console.error('Players API Error:', error);
    
    if (error instanceof Error) {
      const errorResponse = handlePlayerError(error, params.id);
      return NextResponse.json(errorResponse, { status: errorResponse.status });
    }

    const errorResponse: ApiErrorResponse = {
      error: 'Failed to process player',
      status: 500,
      details: 'Unknown error occurred'
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
} 