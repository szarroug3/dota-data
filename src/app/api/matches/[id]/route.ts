import fs from 'fs/promises';
import path from 'path';

import { NextRequest, NextResponse } from 'next/server';

import { CacheService } from '@/lib/cache-service';
import { RateLimiter } from '@/lib/rate-limiter';
import { ProcessedMatch, processMatch } from '@/lib/services/match-processor';
import { ApiErrorResponse } from '@/types/api';
import { OpenDotaMatch } from '@/types/external-apis';

/**
 * Validate match ID parameter
 */
function validateMatchId(matchId: string): ApiErrorResponse | null {
  if (!matchId || isNaN(Number(matchId))) {
    return {
      error: 'Invalid match ID',
      status: 400,
      details: 'Match ID must be a valid number'
    };
  }
  return null;
}

/**
 * Initialize services for match processing
 */
function initializeServices(matchId: string) {
  const cacheKey = `opendota:match:${matchId}`;
  const cacheTTL = 60 * 60 * 24 * 14; // 14 days
  
  const cache = new CacheService({
    useRedis: process.env.USE_REDIS === 'true',
    redisUrl: process.env.REDIS_URL,
    fallbackToMemory: true,
  });
  
  const rateLimiter = new RateLimiter({
    useRedis: process.env.USE_REDIS === 'true',
    redisUrl: process.env.REDIS_URL,
    fallbackToMemory: true,
  });

  return { cache, rateLimiter, cacheKey, cacheTTL };
}

/**
 * Load mock match data based on parsed flag
 */
async function loadMockMatch(matchId: number, parsed: boolean): Promise<OpenDotaMatch> {
  const filename = parsed ? `match-${matchId}-parsed.json` : `match-${matchId}-unparsed.json`;
  const mockPath = path.join(process.cwd(), 'mock-data', filename);
  
  try {
    const data = await fs.readFile(mockPath, 'utf-8');
    return JSON.parse(data) as OpenDotaMatch;
  } catch (err) {
    // If parsed file not found, try unparsed
    if (parsed) {
      try {
        const unparsedPath = path.join(process.cwd(), 'mock-data', `match-${matchId}-unparsed.json`);
        const unparsedData = await fs.readFile(unparsedPath, 'utf-8');
        return JSON.parse(unparsedData) as OpenDotaMatch;
      } catch {
        throw new Error(`Failed to load match data from mock: ${err}`);
      }
    }
    throw new Error(`Failed to load match data from mock: ${err}`);
  }
}

/**
 * Fetch match from OpenDota API
 */
async function fetchMatchFromApi(matchId: number): Promise<OpenDotaMatch> {
  const url = `${process.env.OPENDOTA_API_BASE_URL || 'https://api.opendota.com/api'}/matches/${matchId}`;
  const timeout = Number(process.env.OPENDOTA_API_TIMEOUT) || 10000;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, { signal: controller.signal });
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Data Not Found');
      }
      throw new Error(`OpenDota API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data as OpenDotaMatch;
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw new Error(`Failed to fetch match from OpenDota: ${err}`);
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Fetch match data from cache or API
 */
async function fetchMatchData(
  matchId: number,
  parsed: boolean,
  force: boolean,
  cache: CacheService,
  rateLimiter: RateLimiter,
  cacheKey: string,
  cacheTTL: number
): Promise<OpenDotaMatch> {
  // Mock mode
  if (process.env.USE_MOCK_API === 'true') {
    return await loadMockMatch(matchId, parsed);
  }

  // Check cache first
  if (!force) {
    const cached = await cache.get(cacheKey);
    if (cached && typeof cached === 'string') {
      try {
        return JSON.parse(cached) as OpenDotaMatch;
      } catch {
        // Cache invalid, will fetch fresh data
      }
    }
  }

  // Check rate limit
  const rateResult = await rateLimiter.checkServiceLimit('opendota', 'matches');
  if (!rateResult.allowed) {
    throw new Error('Rate limited by OpenDota API');
  }

  // Fetch from API
  const rawMatch = await fetchMatchFromApi(matchId);
  
  // Cache the result
  await cache.set(cacheKey, JSON.stringify(rawMatch), cacheTTL);
  
  return rawMatch;
}

/**
 * Filter response data based on view parameter
 */
function filterResponseByView(processedMatch: ProcessedMatch, view?: string): Partial<ProcessedMatch> {
  if (view === 'summary') {
    return {
      matchId: processedMatch.matchId,
      startTime: processedMatch.startTime,
      duration: processedMatch.duration,
      radiantWin: processedMatch.radiantWin,
      gameMode: processedMatch.gameMode,
      lobbyType: processedMatch.lobbyType,
      averageRank: processedMatch.averageRank,
      statistics: processedMatch.statistics,
      teams: processedMatch.teams,
      processed: processedMatch.processed
    };
  }
  
  if (view === 'players') {
    return {
      matchId: processedMatch.matchId,
      teams: processedMatch.teams,
      processed: processedMatch.processed
    };
  }
  
  if (view === 'teams') {
    return {
      matchId: processedMatch.matchId,
      teams: processedMatch.teams,
      processed: processedMatch.processed
    };
  }
  
  return processedMatch;
}

/**
 * Handle match API errors
 */
function handleMatchError(error: Error, matchId: string): ApiErrorResponse {
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
      details: `Match with ID ${matchId} could not be found.`
    };
  }

  if (error.message.includes('Invalid match')) {
    return {
      error: 'Invalid match data',
      status: 422,
      details: 'Match data is invalid or corrupted.'
    };
  }

  return {
    error: 'Failed to process match',
    status: 500,
    details: error.message
  };
}

/**
 * @swagger
 * /api/matches/{id}:
 *   get:
 *     summary: Fetch and process Dota 2 match data
 *     description: Retrieves detailed match information including players, teams, statistics, and game events. Supports both parsed and unparsed match data with different view modes for optimized data delivery.
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
 *       - in: query
 *         name: parsed
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Return parsed match data with detailed statistics
 *       - in: query
 *         name: view
 *         schema:
 *           type: string
 *           enum: [full, summary, players, teams]
 *           default: full
 *         description: Data view mode (full=all data, summary=basic info, players=player focus, teams=team focus)
 *     responses:
 *       200:
 *         description: Successfully retrieved match data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     matchId:
 *                       type: string
 *                     startTime:
 *                       type: string
 *                       format: date-time
 *                     duration:
 *                       type: integer
 *                     radiantWin:
 *                       type: boolean
 *                     gameMode:
 *                       type: string
 *                     lobbyType:
 *                       type: string
 *                     averageRank:
 *                       type: integer
 *                     statistics:
 *                       type: object
 *                       properties:
 *                         totalKills:
 *                           type: integer
 *                         radiantScore:
 *                           type: integer
 *                         direScore:
 *                           type: integer
 *                         firstBlood:
 *                           type: integer
 *                         avgGPM:
 *                           type: number
 *                         avgXPM:
 *                           type: number
 *                     teams:
 *                       type: object
 *                       properties:
 *                         radiant:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               accountId:
 *                                 type: string
 *                               heroId:
 *                                 type: integer
 *                               kills:
 *                                 type: integer
 *                               deaths:
 *                                 type: integer
 *                               assists:
 *                                 type: integer
 *                               lastHits:
 *                                 type: integer
 *                               denies:
 *                                 type: integer
 *                               gpm:
 *                                 type: number
 *                               xpm:
 *                                 type: number
 *                         dire:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               accountId:
 *                                 type: string
 *                               heroId:
 *                                 type: integer
 *                               kills:
 *                                 type: integer
 *                               deaths:
 *                                 type: integer
 *                               assists:
 *                                 type: integer
 *                               lastHits:
 *                                 type: integer
 *                               denies:
 *                                 type: integer
 *                               gpm:
 *                                 type: number
 *                               xpm:
 *                                 type: number
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
 *                 parsed:
 *                   type: boolean
 *                 cached:
 *                   type: boolean
 *             example:
 *               data:
 *                 matchId: "8054301932"
 *                 startTime: "2024-01-01T00:00:00.000Z"
 *                 duration: 2150
 *                 radiantWin: true
 *                 gameMode: "All Pick"
 *                 lobbyType: "Ranked"
 *                 averageRank: 75
 *                 statistics:
 *                   totalKills: 45
 *                   radiantScore: 28
 *                   direScore: 17
 *                   firstBlood: 120
 *                   avgGPM: 520
 *                   avgXPM: 580
 *                 teams:
 *                   radiant:
 *                     - accountId: "123456789"
 *                       heroId: 1
 *                       kills: 8
 *                       deaths: 2
 *                       assists: 12
 *                       lastHits: 185
 *                       denies: 15
 *                       gpm: 650
 *                       xpm: 720
 *                   dire:
 *                     - accountId: "987654321"
 *                       heroId: 2
 *                       kills: 3
 *                       deaths: 6
 *                       assists: 8
 *                       lastHits: 125
 *                       denies: 8
 *                       gpm: 420
 *                       xpm: 480
 *                 processed:
 *                   timestamp: "2024-01-01T00:00:00.000Z"
 *                   dataQuality: "high"
 *                   completeness: 0.95
 *               timestamp: "2024-01-01T00:00:00.000Z"
 *               view: "full"
 *               parsed: false
 *               cached: true
 *       400:
 *         description: Invalid match ID
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
 *               error: "Invalid match ID"
 *               status: 400
 *               details: "Match ID must be a valid number"
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
 *               error: "Data Not Found"
 *               status: 404
 *               details: "Match with ID 8054301932 could not be found."
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
 *               details: "Match data is invalid or corrupted."
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
 *               error: "Failed to process match"
 *               status: 500
 *               details: "Unknown error occurred"
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const matchId = params.id;

    // Validate match ID
    const validationError = validateMatchId(matchId);
    if (validationError) {
      return NextResponse.json(validationError, { status: validationError.status });
    }

    // Extract query parameters
    const { searchParams } = new URL(request.url);
    const force = searchParams.get('force') === 'true';
    const parsed = searchParams.get('parsed') === 'true';
    const view = searchParams.get('view') as 'full' | 'summary' | 'players' | 'teams' | undefined;

    // Initialize services
    const { cache, rateLimiter, cacheKey, cacheTTL } = initializeServices(matchId);

    // Fetch match data
    const rawMatch = await fetchMatchData(
      Number(matchId),
      parsed,
      force,
      cache,
      rateLimiter,
      cacheKey,
      cacheTTL
    );

    // Process match through the processor
    const processedMatch = processMatch(rawMatch);

    // Filter response based on view parameter
    const responseData = filterResponseByView(processedMatch, view);

    // Return successful response
    return NextResponse.json({
      data: responseData,
      timestamp: new Date().toISOString(),
      view: view || 'full',
      parsed,
      cached: !force
    });

  } catch (error) {
    console.error('Matches API Error:', error);
    
    if (error instanceof Error) {
      const errorResponse = handleMatchError(error, params.id);
      return NextResponse.json(errorResponse, { status: errorResponse.status });
    }

    const errorResponse: ApiErrorResponse = {
      error: 'Failed to process match',
      status: 500,
      details: 'Unknown error occurred'
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
} 