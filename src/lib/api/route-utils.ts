import { NextRequest, NextResponse } from 'next/server';
import { withCORS } from '../cors';
import { logWithTimestampToFile } from '../server-logger';

/**
 * ServiceName represents the set of supported external data providers for the routing layer.
 * Used to route requests and manage cache/queue per service.
 */
export type ServiceName = 'dotabuff' | 'opendota' | 'stratz' | 'dota2protracker';

/**
 * Helper: parse request body if needed
 */
async function parseRequestBody(request: NextRequest, bodyParams: string[]): Promise<Record<string, unknown>> {
  if (bodyParams.length === 0) return {};
  try {
    return await request.json();
  } catch {
    return {};
  }
}

/**
 * Helper: validate required parameters
 */
function getMissingParams<Params extends Record<string, string>>(
  allParams: Params,
  requiredParams: (keyof Params)[]
): string[] {
  const missing: string[] = [];
  for (const param of requiredParams) {
    if (!allParams[param] || typeof allParams[param] !== 'string') {
      missing.push(param as string);
    }
  }
  return missing;
}

/**
 * Helper: format queued response
 */
function formatQueuedResponse(): NextResponse {
  return withCORS(
    NextResponse.json(
      { status: 'queued' },
      { status: 202 }
    )
  );
}

// Helper: type guard for queued result
function isQueuedResult(obj: unknown): obj is { status: string } {
  return (
    !!obj &&
    typeof obj === 'object' &&
    'status' in obj &&
    (obj as { status?: string }).status === 'queued'
  );
}

/**
 * Standardized route handler for API endpoints that require polling, parameter validation, and async queueing.
 *
 * This handler performs the following steps:
 * 1. Checks if the request is a polling request (by `signature` query param) and returns the appropriate status if so.
 * 2. Validates required parameters from path/query/body (merged).
 * 3. Calls the provided helper function with all parameters and a forceRefresh flag.
 * 4. Returns a 202 response if the result is queued, or 200 with the data if ready.
 * 5. Adds CORS headers to all responses.
 *
 * @template T - The type of the response data.
 * @template Params - The type of the merged parameters object.
 * @param request - The Next.js API request object.
 * @param params - A promise resolving to the path/query parameters.
 * @param service - The service name (for cache/queue management).
 * @param helperFunction - The function to call to fetch/process the data.
 * @param requiredParams - List of required parameter keys (from path/query/body).
 * @param bodyParams - List of parameter keys expected in the request body (for POST/PUT).
 * @returns A NextResponse with the result, queued status, or error.
 */
export async function createStandardRouteHandler<T, Params extends Record<string, string> = Record<string, string>>(
  request: NextRequest,
  params: Promise<Params>,
  service: ServiceName,
  helperFunction: (params: Params, forceRefresh?: boolean) => Promise<T>,
  requiredParams: (keyof Params)[] = [],
  bodyParams: string[] = []
): Promise<NextResponse> {
  logWithTimestampToFile('log', `[ROUTE] ===== STARTING ${service.toUpperCase()} REQUEST =====`);
  
  try {
    const resolvedParams = await params;
    const { searchParams } = new URL(request.url);
    const body = await parseRequestBody(request, bodyParams);
    const allParams = { ...resolvedParams, ...body } as Params;
    const missingParams = getMissingParams(allParams, requiredParams);
    if (missingParams.length > 0) {
      logWithTimestampToFile('warn', `[ROUTE] Missing required parameters: ${missingParams.join(', ')}`);
      return withCORS(NextResponse.json(
        { error: `Missing required parameters: ${missingParams.join(', ')}` },
        { status: 400 }
      ));
    }
    const forceRefresh = searchParams.get('force') === 'true';
    const result = await helperFunction(allParams, forceRefresh);
    if (isQueuedResult(result)) {
      return formatQueuedResponse();
    }
    return withCORS(NextResponse.json(result));
  } catch (error) {
    logWithTimestampToFile('error', `[ROUTE] Error during ${service} request:`, error);
    return withCORS(NextResponse.json(
      { error: `An error occurred while processing the request` },
      { status: 500 }
    ));
  }
}

/**
 * Simple route handler for GET endpoints that do not require polling or parameter validation.
 *
 * This handler:
 * - Calls the provided helper function with a forceRefresh flag (from query string).
 * - Handles queued/async responses if returned by the helper.
 * - Adds CORS headers to all responses.
 *
 * @template T - The type of the response data.
 * @param request - The Next.js API request object.
 * @param helperFunction - The function to call to fetch/process the data.
 * @returns A NextResponse with the result, queued status, or error.
 */
export async function createSimpleRouteHandler<T>(
  request: NextRequest,
  helperFunction: (forceRefresh?: boolean) => Promise<T>
): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get('force') === 'true';
    
    const result = await helperFunction(forceRefresh);
    
    if (result && typeof result === 'object' && 'status' in result && result.status === 'queued') {
      return withCORS(NextResponse.json(
        { status: 'queued' }, 
        { status: 202 }
      ));
    }
    
    return withCORS(NextResponse.json(result));
    
  } catch (error) {
    logWithTimestampToFile('error', '[ROUTE] Error during request:', error);
    return withCORS(NextResponse.json(
      { error: 'An error occurred while processing the request' }, 
      { status: 500 }
    ));
  }
} 