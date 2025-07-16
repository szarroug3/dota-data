import { NextRequest, NextResponse } from 'next/server';

import { ApiErrorResponse } from '@/types/api';
import { QueueEnqueueResult, QueueJob } from '@/types/queue';

import { RequestQueue } from '@/lib/request-queue';

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
 * Create request queue service instance
 */
function createRequestQueue(timeout: number): RequestQueue {
  return new RequestQueue({
    useQStash: process.env.USE_QSTASH === 'true',
    qstashToken: process.env.QSTASH_TOKEN,
    qstashCurrentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY,
    qstashNextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY,
    fallbackToMemory: true,
    defaultTimeout: timeout,
    maxRetries: 3,
    baseDelay: 1000
  });
}

/**
 * Create job for match parsing
 */
function createParseJob(matchId: string, timeout: number, priority?: string): { jobId: string; job: QueueJob } {
  const jobId = `match-parse-${matchId}-${Date.now()}`;
  const job: QueueJob = {
    endpoint: `/api/matches/${matchId}/parse/process`,
    payload: {
      matchId: matchId
    },
    priority: (priority as 'low' | 'normal' | 'high') || 'normal',
    timeout,
    retries: 0
  };
  return { jobId, job };
}

/**
 * Handle match parsing in mock mode
 */
async function handleMockModeProcessing(
  queue: RequestQueue,
  matchId: string,
  jobId: string,
  job: QueueJob,
  request: NextRequest
): Promise<NextResponse> {
  try {
    // Enqueue the job (for consistency with the queue system)
    await queue.enqueue(jobId, job);
    
    // Immediately call the internal matches endpoint with parsed flag
    const matchesUrl = new URL(`/api/matches/${matchId}`, request.url);
    matchesUrl.searchParams.set('parsed', 'true');
    
    const matchResponse = await fetch(matchesUrl.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!matchResponse.ok) {
      throw new Error('Failed to fetch parsed match data');
    }

    const matchData = await matchResponse.json();

    return NextResponse.json({
      jobId,
      status: 'completed',
      matchId: Number(matchId),
      parsed: true,
      mockMode: true,
      data: matchData.data,
      timestamp: new Date().toISOString(),
      processingTime: 0
    });
  } catch (error) {
    return NextResponse.json({
      jobId,
      status: 'failed',
      matchId: Number(matchId),
      error: error instanceof Error ? error.message : 'Unknown error',
      mockMode: true,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Poll for job completion and return result
 */
async function pollForJobCompletion(
  queue: RequestQueue,
  jobId: string,
  matchId: string,
  timeout: number,
  request: NextRequest,
  startTime: number,
  enqueueResult: QueueEnqueueResult
): Promise<NextResponse> {
  const pollInterval = 2000; // 2 seconds
  
  while (Date.now() - startTime < timeout) {
    // Check job status
    const jobStatus = await queue.getJobStatus(jobId);
    
    if (jobStatus.status === 'completed') {
      // Job completed, fetch the parsed match data
      const matchesUrl = new URL(`/api/matches/${matchId}`, request.url);
      matchesUrl.searchParams.set('parsed', 'true');
      
      const matchResponse = await fetch(matchesUrl.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!matchResponse.ok) {
        throw new Error('Failed to fetch parsed match data');
      }

      const matchData = await matchResponse.json();

      return NextResponse.json({
        jobId,
        status: 'completed',
        matchId: Number(matchId),
        parsed: true,
        data: matchData.data,
        timestamp: new Date().toISOString(),
        processingTime: Date.now() - startTime,
        backend: enqueueResult.backend
      });
    }
    
    if (jobStatus.status === 'failed') {
      return NextResponse.json({
        jobId,
        status: 'failed',
        matchId: Number(matchId),
        error: 'Match parsing failed',
        timestamp: new Date().toISOString(),
        processingTime: Date.now() - startTime
      });
    }
    
    // Wait before next poll
    await new Promise(resolve => setTimeout(resolve, pollInterval));
  }
  
  // Timeout reached
  return NextResponse.json({
    jobId,
    status: 'timeout',
    matchId: Number(matchId),
    error: 'Match parsing timed out',
    timestamp: new Date().toISOString(),
    processingTime: Date.now() - startTime
  });
}

/**
 * Handle match parsing in real mode
 */
async function handleRealModeProcessing(
  queue: RequestQueue,
  matchId: string,
  jobId: string,
  job: QueueJob,
  timeout: number,
  request: NextRequest
): Promise<NextResponse> {
  try {
    // Enqueue the parsing job
    const enqueueResult = await queue.enqueue(jobId, job);
    
    // Start polling for completion
    const startTime = Date.now();
    
    return await pollForJobCompletion(
      queue,
      jobId,
      matchId,
      timeout,
      request,
      startTime,
      enqueueResult
    );
    
  } catch (error) {
    console.error('Match Parse API Error:', error);
    
    const errorResponse: ApiErrorResponse = {
      error: 'Failed to enqueue match parsing job',
      status: 500,
      details: error instanceof Error ? error.message : 'Unknown error occurred'
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

/**
 * Handle specific match parsing errors
 */
function handleMatchParsingError(error: Error, matchId: string): ApiErrorResponse {
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
      details: `Match with ID ${matchId} could not be found for parsing.`
    };
  }

  if (error.message.includes('Invalid match')) {
    return {
      error: 'Invalid match data',
      status: 422,
      details: 'Match data is invalid and cannot be parsed.'
    };
  }

  return {
    error: 'Failed to parse match',
    status: 500,
    details: error.message
  };
}

/**
 * @swagger
 * /api/matches/{id}/parse:
 *   post:
 *     summary: Parse a Dota 2 match
 *     description: Initiates match parsing through a background job queue. Returns immediately with job status and polls for completion within the timeout period. Supports both QStash and in-memory queue backends.
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
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, normal, high]
 *           default: normal
 *         description: Job priority in the queue
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
 *               properties:
 *                 jobId:
 *                   type: string
 *                   description: Unique job identifier
 *                 status:
 *                   type: string
 *                   enum: [completed, failed, timeout]
 *                   description: Final job status
 *                 matchId:
 *                   type: integer
 *                   description: Match ID that was parsed
 *                 parsed:
 *                   type: boolean
 *                   description: Whether the match was successfully parsed
 *                 data:
 *                   type: object
 *                   description: Parsed match data (when status is completed)
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 processingTime:
 *                   type: integer
 *                   description: Time taken to complete parsing (in milliseconds)
 *                 backend:
 *                   type: string
 *                   enum: [qstash, memory]
 *                   description: Queue backend used for processing
 *                 error:
 *                   type: string
 *                   description: Error message (when status is failed or timeout)
 *                 mockMode:
 *                   type: boolean
 *                   description: Whether mock mode was used for processing
 *             examples:
 *               completed:
 *                 summary: Successfully parsed match
 *                 value:
 *                   jobId: "match-parse-8054301932-1640995200000"
 *                   status: "completed"
 *                   matchId: 8054301932
 *                   parsed: true
 *                   data:
 *                     matchId: "8054301932"
 *                     startTime: "2024-01-01T00:00:00.000Z"
 *                     duration: 2150
 *                     radiantWin: true
 *                     gameMode: "All Pick"
 *                     statistics:
 *                       totalKills: 45
 *                       radiantScore: 28
 *                       direScore: 17
 *                   timestamp: "2024-01-01T00:00:00.000Z"
 *                   processingTime: 5000
 *                   backend: "qstash"
 *               failed:
 *                 summary: Failed to parse match
 *                 value:
 *                   jobId: "match-parse-8054301932-1640995200000"
 *                   status: "failed"
 *                   matchId: 8054301932
 *                   error: "Match parsing failed"
 *                   timestamp: "2024-01-01T00:00:00.000Z"
 *                   processingTime: 15000
 *               timeout:
 *                 summary: Parsing timed out
 *                 value:
 *                   jobId: "match-parse-8054301932-1640995200000"
 *                   status: "timeout"
 *                   matchId: 8054301932
 *                   error: "Match parsing timed out"
 *                   timestamp: "2024-01-01T00:00:00.000Z"
 *                   processingTime: 60000
 *               mock:
 *                 summary: Mock mode processing
 *                 value:
 *                   jobId: "match-parse-8054301932-1640995200000"
 *                   status: "completed"
 *                   matchId: 8054301932
 *                   parsed: true
 *                   mockMode: true
 *                   data:
 *                     matchId: "8054301932"
 *                     startTime: "2024-01-01T00:00:00.000Z"
 *                     duration: 2150
 *                   timestamp: "2024-01-01T00:00:00.000Z"
 *                   processingTime: 0
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
 *               details: "Match with ID 8054301932 could not be found for parsing."
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
export async function POST(
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
    const priority = searchParams.get('priority');
    const timeout = Number(searchParams.get('timeout')) || 60000; // 1 minute default

    // Initialize queue service
    const queue = createRequestQueue(timeout);

    // Create job for match parsing
    const { jobId, job } = createParseJob(matchId, timeout, priority || undefined);

    // Handle based on mode
    if (process.env.USE_MOCK_API === 'true') {
      return await handleMockModeProcessing(queue, matchId, jobId, job, request);
    } else {
      return await handleRealModeProcessing(queue, matchId, jobId, job, timeout, request);
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
      details: 'Unknown error occurred'
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
} 