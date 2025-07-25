import { NextRequest, NextResponse } from 'next/server';

import { CacheService } from '@/lib/cache-service';
import { ApiErrorResponse, CacheInvalidateRequest, CacheInvalidateResponse } from '@/types/api';

/**
 * Validate cache invalidation request body
 */
function validateInvalidationRequest(body: CacheInvalidateRequest): ApiErrorResponse | null {
  if (!body.pattern && !body.key) {
    return {
      error: 'Missing invalidation criteria',
      status: 400,
      details: 'Either pattern or key must be provided'
    };
  }

  if (body.pattern && body.key) {
    return {
      error: 'Invalid invalidation criteria',
      status: 400,
      details: 'Cannot specify both pattern and key, choose one'
    };
  }

  return null;
}

/**
 * Create cache service instance
 */
function createCacheService(): CacheService {
  return new CacheService({
    useRedis: process.env.USE_REDIS === 'true',
    redisUrl: process.env.REDIS_URL,
    fallbackToMemory: true,
  });
}

/**
 * Handle pattern-based cache invalidation
 */
async function handlePatternInvalidation(
  cache: CacheService,
  pattern: string
): Promise<NextResponse> {
  try {
    const invalidatedCount = await cache.invalidatePattern(pattern);
    
    const response: CacheInvalidateResponse = {
      invalidated: invalidatedCount,
      pattern: pattern
    };

    return NextResponse.json({
      data: response,
      timestamp: new Date().toISOString(),
      backend: cache.getBackendType(),
      details: {
        pattern,
        invalidatedCount,
        operation: 'pattern-invalidation'
      }
    });
  } catch (error) {
    console.error('Pattern invalidation error:', error);
    const errorResponse: ApiErrorResponse = {
      error: 'Pattern invalidation failed',
      status: 500,
      details: error instanceof Error ? error.message : 'Unknown error occurred'
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

/**
 * Handle key-based cache invalidation
 */
async function handleKeyInvalidation(
  cache: CacheService,
  key: string
): Promise<NextResponse> {
  try {
    const keyExists = await cache.exists(key);
    let invalidatedCount = 0;
    
    if (keyExists) {
      const deleted = await cache.delete(key);
      invalidatedCount = deleted ? 1 : 0;
    }

    const response: CacheInvalidateResponse = {
      invalidated: invalidatedCount
    };

    return NextResponse.json({
      data: response,
      timestamp: new Date().toISOString(),
      backend: cache.getBackendType(),
      details: {
        key,
        existed: keyExists,
        invalidated: invalidatedCount > 0,
        operation: 'key-invalidation'
      }
    });
  } catch (error) {
    console.error('Key invalidation error:', error);
    const errorResponse: ApiErrorResponse = {
      error: 'Key invalidation failed',
      status: 500,
      details: error instanceof Error ? error.message : 'Unknown error occurred'
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

/**
 * Handle specific cache service errors
 */
function handleCacheServiceError(error: Error): ApiErrorResponse {
  if (error.message.includes('Cache backend unavailable')) {
    return {
      error: 'Cache backend unavailable',
      status: 503,
      details: 'Cache service is temporarily unavailable'
    };
  }

  if (error.message.includes('Invalid pattern')) {
    return {
      error: 'Invalid cache pattern',
      status: 400,
      details: 'Cache pattern is invalid or malformed'
    };
  }

  if (error.message.includes('Permission denied')) {
    return {
      error: 'Permission denied',
      status: 403,
      details: 'Insufficient permissions to invalidate cache'
    };
  }

  return {
    error: 'Failed to invalidate cache',
    status: 500,
    details: error.message
  };
}

/**
 * @swagger
 * /api/cache/invalidate:
 *   post:
 *     summary: Invalidate cache entries by pattern or key
 *     description: Invalidates cache entries either by pattern matching or by specific key. Supports both Redis and memory cache backends with automatic fallback.
 *     tags:
 *       - Cache
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               pattern:
 *                 type: string
 *                 description: Pattern to match cache keys (cannot be used with key)
 *               key:
 *                 type: string
 *                 description: Specific cache key to invalidate (cannot be used with pattern)
 *             example:
 *               pattern: "opendota:*"
 *           examples:
 *             pattern:
 *               summary: Invalidate by pattern
 *               value:
 *                 pattern: "opendota:heroes:*"
 *             key:
 *               summary: Invalidate by key
 *               value:
 *                 key: "opendota:heroes"
 *     responses:
 *       200:
 *         description: Cache invalidation successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     invalidated:
 *                       type: integer
 *                       description: Number of cache entries invalidated
 *                     pattern:
 *                       type: string
 *                       description: Pattern used for invalidation (pattern-based only)
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 backend:
 *                   type: string
 *                   enum: [redis, memory]
 *                 details:
 *                   type: object
 *                   properties:
 *                     pattern:
 *                       type: string
 *                     key:
 *                       type: string
 *                     invalidatedCount:
 *                       type: integer
 *                     existed:
 *                       type: boolean
 *                     invalidated:
 *                       type: boolean
 *                     operation:
 *                       type: string
 *                       enum: [pattern-invalidation, key-invalidation]
 *             example:
 *               data:
 *                 invalidated: 15
 *                 pattern: "opendota:heroes:*"
 *               timestamp: "2024-01-01T00:00:00.000Z"
 *               backend: "redis"
 *               details:
 *                 pattern: "opendota:heroes:*"
 *                 invalidatedCount: 15
 *                 operation: "pattern-invalidation"
 *       400:
 *         description: Invalid request
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
 *             examples:
 *               missing_criteria:
 *                 summary: Missing invalidation criteria
 *                 value:
 *                   error: "Missing invalidation criteria"
 *                   status: 400
 *                   details: "Either pattern or key must be provided"
 *               invalid_criteria:
 *                 summary: Invalid invalidation criteria
 *                 value:
 *                   error: "Invalid invalidation criteria"
 *                   status: 400
 *                   details: "Cannot specify both pattern and key, choose one"
 *               invalid_body:
 *                 summary: Invalid request body
 *                 value:
 *                   error: "Invalid request body"
 *                   status: 400
 *                   details: "Request body must be valid JSON"
 *               invalid_pattern:
 *                 summary: Invalid cache pattern
 *                 value:
 *                   error: "Invalid cache pattern"
 *                   status: 400
 *                   details: "Cache pattern is invalid or malformed"
 *       403:
 *         description: Permission denied
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
 *               error: "Permission denied"
 *               status: 403
 *               details: "Insufficient permissions to invalidate cache"
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
 *               error: "Failed to invalidate cache"
 *               status: 500
 *               details: "Unknown error occurred"
 *       503:
 *         description: Cache backend unavailable
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
 *               error: "Cache backend unavailable"
 *               status: 503
 *               details: "Cache service is temporarily unavailable"
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Parse and validate request body
    let body: CacheInvalidateRequest;
    try {
      body = await request.json() as CacheInvalidateRequest;
    } catch {
      const errorResponse: ApiErrorResponse = {
        error: 'Invalid request body',
        status: 400,
        details: 'Request body must be valid JSON'
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Validate request parameters
    const validationError = validateInvalidationRequest(body);
    if (validationError) {
      return NextResponse.json(validationError, { status: validationError.status });
    }

    // Initialize cache service
    const cache = createCacheService();

    // Perform invalidation based on request type
    if (body.pattern) {
      return await handlePatternInvalidation(cache, body.pattern);
    } else if (body.key) {
      return await handleKeyInvalidation(cache, body.key);
    }

    // This should not be reached due to validation above
    const errorResponse: ApiErrorResponse = {
      error: 'Invalid invalidation request',
      status: 400,
      details: 'Unable to process invalidation request'
    };
    return NextResponse.json(errorResponse, { status: 400 });

  } catch (error) {
    console.error('Cache Invalidate API Error:', error);
    
    if (error instanceof Error) {
      const errorResponse = handleCacheServiceError(error);
      return NextResponse.json(errorResponse, { status: errorResponse.status });
    }

    const errorResponse: ApiErrorResponse = {
      error: 'Failed to invalidate cache',
      status: 500,
      details: 'Unknown error occurred'
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

/**
 * @swagger
 * /api/cache/invalidate:
 *   get:
 *     summary: Get cache invalidation status and statistics
 *     description: Retrieves cache backend information, health status, statistics, and available invalidation endpoints. Useful for monitoring cache performance and understanding available operations.
 *     tags:
 *       - Cache
 *     responses:
 *       200:
 *         description: Successfully retrieved cache status and statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     backend:
 *                       type: string
 *                       enum: [redis, memory]
 *                       description: Current cache backend in use
 *                     healthy:
 *                       type: boolean
 *                       description: Cache backend health status
 *                     statistics:
 *                       type: object
 *                       properties:
 *                         hits:
 *                           type: integer
 *                           description: Number of cache hits
 *                         misses:
 *                           type: integer
 *                           description: Number of cache misses
 *                         keys:
 *                           type: integer
 *                           description: Total number of cached keys
 *                         hitRate:
 *                           type: number
 *                           description: Cache hit rate percentage
 *                     endpoints:
 *                       type: object
 *                       properties:
 *                         invalidatePattern:
 *                           type: object
 *                           properties:
 *                             method:
 *                               type: string
 *                             description:
 *                               type: string
 *                             example:
 *                               type: object
 *                               properties:
 *                                 pattern:
 *                                   type: string
 *                         invalidateKey:
 *                           type: object
 *                           properties:
 *                             method:
 *                               type: string
 *                             description:
 *                               type: string
 *                             example:
 *                               type: object
 *                               properties:
 *                                 key:
 *                                   type: string
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *             example:
 *               data:
 *                 backend: "redis"
 *                 healthy: true
 *                 statistics:
 *                   hits: 1250
 *                   misses: 185
 *                   keys: 423
 *                   hitRate: 0.871
 *                 endpoints:
 *                   invalidatePattern:
 *                     method: "POST"
 *                     description: "Invalidate cache entries by pattern"
 *                     example:
 *                       pattern: "opendota:*"
 *                   invalidateKey:
 *                     method: "POST"
 *                     description: "Invalidate single cache entry by key"
 *                     example:
 *                       key: "opendota:heroes"
 *               timestamp: "2024-01-01T00:00:00.000Z"
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
 *               error: "Failed to get cache status"
 *               status: 500
 *               details: "Unknown error occurred"
 */
export async function GET(): Promise<NextResponse> {
  try {
    const cache = createCacheService();
    const stats = await cache.getStats();
    const isHealthy = await cache.isHealthy();

    return NextResponse.json({
      data: {
        backend: cache.getBackendType(),
        healthy: isHealthy,
        statistics: stats,
        endpoints: {
          invalidatePattern: {
            method: 'POST',
            description: 'Invalidate cache entries by pattern',
            example: {
              pattern: 'opendota:*'
            }
          },
          invalidateKey: {
            method: 'POST',
            description: 'Invalidate single cache entry by key',
            example: {
              key: 'opendota:heroes'
            }
          }
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Cache Status API Error:', error);
    
    const errorResponse: ApiErrorResponse = {
      error: 'Failed to get cache status',
      status: 500,
      details: error instanceof Error ? error.message : 'Unknown error occurred'
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
} 