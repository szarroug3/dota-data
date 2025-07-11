import { NextRequest, NextResponse } from 'next/server';

import { fetchOpenDotaHeroes } from '@/lib/api/opendota/heroes';
import { ErrorCreators, errorHandler } from '@/lib/error-handler';
import { gracefulShutdown } from '@/lib/graceful-shutdown';
import { performanceMonitor } from '@/lib/performance-monitor';
import type { RequestSpan } from '@/lib/request-tracer';
import { RequestTracer } from '@/lib/request-tracer';
import { ProcessedHero, processHero } from '@/lib/services/hero-processor';
import { timeoutManager } from '@/lib/timeout-manager';
import { DotaTransformers } from '@/lib/utils/data-transformation';
import { ResponseFormatter } from '@/lib/utils/response-formatter';
import { CommonSchemas, ValidationHelpers } from '@/lib/utils/validation';
import { OpenDotaHero } from '@/types/external-apis';

/**
 * Apply filtering to heroes based on query parameters
 */
function applyHeroFilters(
  heroes: ProcessedHero[],
  filters: {
    complexity?: string;
    role?: string;
    primaryAttribute?: string;
    tier?: string;
  }
): ProcessedHero[] {
  let filteredHeroes = heroes;

  if (filters.complexity) {
    filteredHeroes = filteredHeroes.filter((hero: ProcessedHero) => hero.attributes.complexity === filters.complexity);
  }

  if (filters.role) {
    filteredHeroes = filteredHeroes.filter((hero: ProcessedHero) => 
      hero.attributes.roles && hero.attributes.roles.some((r: string) => r.toLowerCase().includes(filters.role!.toLowerCase()))
    );
  }

  if (filters.primaryAttribute) {
    filteredHeroes = filteredHeroes.filter((hero: ProcessedHero) => 
      hero.attributes.primaryAttribute && hero.attributes.primaryAttribute.toLowerCase() === filters.primaryAttribute!.toLowerCase()
    );
  }

  if (filters.tier) {
    filteredHeroes = filteredHeroes.filter((hero: ProcessedHero) => hero.meta.tier === filters.tier);
  }

  return filteredHeroes;
}

// Fix parameter order in helper functions
async function validateAndExtractParams(request: NextRequest, requestTracer: RequestTracer, requestId: string, mainSpanId?: string) {
  const validationSpan = requestTracer.startSpan(requestId, 'query-validation', { parentSpanId: mainSpanId });
  const { searchParams } = new URL(request.url);
  const queryValidation = ValidationHelpers.validateQueryParams(searchParams, {
    ...CommonSchemas.forceRefreshQuery,
    ...CommonSchemas.heroFilterQuery
  });
  if (!queryValidation.isValid) {
    requestTracer.endSpan(requestId, validationSpan?.spanId || '', { status: 'error', error: queryValidation.errors.join(', ') });
    throw ErrorCreators.validationError(queryValidation.errors.join(', '), {
      requestId,
      endpoint: '/api/heroes',
      method: 'GET',
      userAgent: request.headers.get('user-agent') || undefined,
      ipAddress: request.headers.get('x-forwarded-for') || undefined
    });
  }
  requestTracer.endSpan(requestId, validationSpan?.spanId || '', { status: 'success' });
  return queryValidation.sanitizedValue;
}

async function fetchAndProcessHeroes(force: boolean, requestTracer: RequestTracer, requestId: string, mainSpanId?: string) {
  const fetchSpan = requestTracer.startSpan(requestId, 'fetch-heroes-data', { parentSpanId: mainSpanId });
  const rawHeroes = await timeoutManager.withExternalApiTimeout(
    fetchOpenDotaHeroes(force),
    {
      timeout: 15000,
      operation: 'fetch OpenDota heroes',
      service: 'OpenDota'
    }
  );
  requestTracer.endSpan(requestId, fetchSpan?.spanId || '', { status: 'success', tags: { heroCount: rawHeroes.length, cached: !force } });
  const processSpan = requestTracer.startSpan(requestId, 'process-heroes', { parentSpanId: mainSpanId });
  const processedHeroes = rawHeroes.map((hero: OpenDotaHero) => processHero({ hero, totalHeroes: rawHeroes.length })).filter(hero => hero !== null) as ProcessedHero[];
  requestTracer.endSpan(requestId, processSpan?.spanId || '', { status: 'success', tags: { processedCount: processedHeroes.length } });
  return processedHeroes;
}

function filterHeroes(processedHeroes: ProcessedHero[], filters: { complexity?: string; role?: string; primaryAttribute?: string; tier?: string }, requestTracer: RequestTracer, requestId: string, mainSpanId?: string) {
  const filterSpan = requestTracer.startSpan(requestId, 'apply-filters', { parentSpanId: mainSpanId });
  const filteredHeroes = applyHeroFilters(processedHeroes, filters);
  requestTracer.endSpan(requestId, filterSpan?.spanId || '', { status: 'success', tags: { filteredCount: filteredHeroes.length } });
  return filteredHeroes;
}

function transformHeroes(filteredHeroes: ProcessedHero[], requestTracer: RequestTracer, requestId: string, mainSpanId?: string) {
  const transformSpan = requestTracer.startSpan(requestId, 'transform-heroes', { parentSpanId: mainSpanId });
  const transformedHeroes = filteredHeroes.map(hero => DotaTransformers.hero(hero)).filter(hero => hero !== null);
  requestTracer.endSpan(requestId, transformSpan?.spanId || '', { status: 'success', tags: { transformedCount: transformedHeroes.length } });
  return transformedHeroes;
}

function handleTracingAndMonitoringOnSuccess(requestTracer: RequestTracer, requestId: string, mainSpanId?: string) {
  if (mainSpanId) requestTracer.endSpan(requestId, mainSpanId, { status: 'success' });
  performanceMonitor.endRequest(requestId, 200);
  requestTracer.completeTrace(requestId, { status: 'success', responseStatus: 200 });
}

function handleTracingAndMonitoringOnError(requestTracer: RequestTracer, requestId: string, error: Error | string, mainSpanId?: string) {
  if (mainSpanId) {
    requestTracer.endSpan(requestId, mainSpanId, { status: 'error', error: typeof error === 'string' ? error : error instanceof Error ? error.message : 'Unknown error' });
  }
  performanceMonitor.endRequest(requestId, 500, { error: typeof error === 'string' ? error : error instanceof Error ? error.message : 'Unknown error' });
  requestTracer.completeTrace(requestId, { status: 'error', error: typeof error === 'string' ? error : error instanceof Error ? error.message : 'Unknown error', responseStatus: 500 });
}

function extractHeroFilters(params: Record<string, string | boolean | number | undefined>) {
  return {
    complexity: params.complexity as string | undefined,
    role: params.role as string | undefined,
    primaryAttribute: params.primaryAttribute as string | undefined,
    tier: params.tier as string | undefined,
  };
}

async function getParamsAndForce(request: NextRequest, requestTracer: RequestTracer, requestId: string, mainSpan: RequestSpan | null) {
  const params = await validateAndExtractParams(request, requestTracer, requestId, mainSpan?.spanId) as Record<string, string | boolean | number | undefined>;
  const force = params.force === true || params.force === 'true' || params.force === 1;
  return { params, force };
}

async function getTransformedHeroes(force: boolean, filters: ReturnType<typeof extractHeroFilters>, requestTracer: RequestTracer, requestId: string, mainSpan: RequestSpan | null) {
  const processedHeroes = await fetchAndProcessHeroes(force, requestTracer, requestId, mainSpan?.spanId);
  const filteredHeroes = filterHeroes(processedHeroes, filters, requestTracer, requestId, mainSpan?.spanId);
  return { processedHeroes, transformedHeroes: transformHeroes(filteredHeroes, requestTracer, requestId, mainSpan?.spanId) };
}

function buildResponse(transformedHeroes: ReturnType<typeof transformHeroes>, processedHeroes: ProcessedHero[], filters: ReturnType<typeof extractHeroFilters>, requestId: string, force: boolean) {
  return ResponseFormatter.filtered(
    transformedHeroes,
    {
      count: transformedHeroes.length,
      totalCount: processedHeroes.length,
      filters: {
        complexity: filters.complexity || null,
        role: filters.role || null,
        primaryAttribute: filters.primaryAttribute || null,
        tier: filters.tier || null
      }
    },
    {
      requestId,
      cached: !force,
      metadata: {
        processing_version: '1.0.0',
        data_quality: 'high',
        completeness: 1.0
      }
    }
  );
}

async function handleHeroesRequest(request: NextRequest, requestTracer: RequestTracer, requestId: string, mainSpan: RequestSpan | null): Promise<NextResponse> {
  const { params, force } = await getParamsAndForce(request, requestTracer, requestId, mainSpan);
  const filters = extractHeroFilters(params);
  const { processedHeroes, transformedHeroes } = await getTransformedHeroes(force, filters, requestTracer, requestId, mainSpan);
  handleTracingAndMonitoringOnSuccess(requestTracer, requestId, mainSpan?.spanId);
  return buildResponse(transformedHeroes, processedHeroes, filters, requestId, force);
}

/**
 * @swagger
 * /api/heroes:
 *   get:
 *     summary: Fetch and process Dota 2 heroes data
 *     description: Retrieves all Dota 2 heroes with optional filtering by complexity, role, primary attribute, and tier. Supports caching and rate limiting with comprehensive performance monitoring.
 *     tags:
 *       - Heroes
 *     parameters:
 *       - in: query
 *         name: force
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Force refresh of cached data
 *       - in: query
 *         name: complexity
 *         schema:
 *           type: string
 *           enum: [beginner, intermediate, advanced]
 *         description: Filter heroes by complexity level
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *         description: Filter heroes by role (partial match)
 *       - in: query
 *         name: primaryAttribute
 *         schema:
 *           type: string
 *           enum: [strength, agility, intelligence, universal]
 *         description: Filter heroes by primary attribute
 *       - in: query
 *         name: tier
 *         schema:
 *           type: string
 *           enum: [S, A, B, C, D]
 *         description: Filter heroes by tier ranking
 *     responses:
 *       200:
 *         description: Successfully retrieved heroes data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       localizedName:
 *                         type: string
 *                       primaryAttribute:
 *                         type: string
 *                       attackType:
 *                         type: string
 *                       roles:
 *                         type: array
 *                         items:
 *                           type: string
 *                       complexity:
 *                         type: string
 *                       tier:
 *                         type: string
 *                       image:
 *                         type: string
 *                       icon:
 *                         type: string
 *                 count:
 *                   type: integer
 *                   description: Number of heroes in filtered results
 *                 totalCount:
 *                   type: integer
 *                   description: Total number of heroes available
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 requestId:
 *                   type: string
 *                   description: Unique request identifier for tracing
 *                 cached:
 *                   type: boolean
 *                   description: Whether the response was served from cache
 *                 filters:
 *                   type: object
 *                   properties:
 *                     complexity:
 *                       type: string
 *                       nullable: true
 *                     role:
 *                       type: string
 *                       nullable: true
 *                     primaryAttribute:
 *                       type: string
 *                       nullable: true
 *                     tier:
 *                       type: string
 *                       nullable: true
 *             example:
 *               data:
 *                 - id: 1
 *                   name: "npc_dota_hero_antimage"
 *                   localizedName: "Anti-Mage"
 *                   primaryAttribute: "agility"
 *                   attackType: "Melee"
 *                   roles: ["Carry", "Escape", "Nuker"]
 *                   complexity: "intermediate"
 *                   tier: "A"
 *                   image: "https://cdn.dota2.com/apps/dota2/images/heroes/antimage_full.png"
 *                   icon: "https://cdn.dota2.com/apps/dota2/images/heroes/antimage_icon.png"
 *               count: 1
 *               totalCount: 123
 *               timestamp: "2024-01-01T00:00:00.000Z"
 *               requestId: "req-1640995200000-abc123"
 *               cached: true
 *               filters:
 *                 complexity: null
 *                 role: null
 *                 primaryAttribute: null
 *                 tier: null
 *       400:
 *         description: Invalid request parameters
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
 *                 requestId:
 *                   type: string
 *             example:
 *               error: "Invalid input for field 'complexity': invalid_value"
 *               status: 400
 *               details: "INVALID_INPUT"
 *               requestId: "req-1640995200000-abc123"
 *       404:
 *         description: Heroes data not found
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
 *                 requestId:
 *                   type: string
 *             example:
 *               error: "Data Not Found"
 *               status: 404
 *               details: "Heroes data could not be found or loaded."
 *               requestId: "req-1640995200000-abc123"
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
 *                 requestId:
 *                   type: string
 *                 retryable:
 *                   type: boolean
 *             example:
 *               error: "Rate limited by OpenDota API"
 *               status: 429
 *               details: "Too many requests to OpenDota API. Please try again later."
 *               requestId: "req-1640995200000-abc123"
 *               retryable: true
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
 *                 requestId:
 *                   type: string
 *             example:
 *               error: "Failed to process heroes"
 *               status: 500
 *               details: "Unknown error occurred"
 *               requestId: "req-1640995200000-abc123"
 *       503:
 *         description: Service unavailable (shutting down)
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
 *               error: "Service unavailable"
 *               status: 503
 *               details: "Server is shutting down"
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  if (gracefulShutdown.isShuttingDown()) {
    return NextResponse.json({ error: 'Service unavailable', status: 503, details: 'Server is shutting down' }, { status: 503 });
  }
  const requestTracer = RequestTracer.getInstance();
  const trace = requestTracer.startTrace(request);
  const requestId = trace.requestId;
  let mainSpan: RequestSpan | null;
  try {
    gracefulShutdown.registerRequest(requestId);
    performanceMonitor.startRequest('/api/heroes', 'GET', {
      requestId,
      userAgent: request.headers.get('user-agent') || undefined,
      ipAddress: request.headers.get('x-forwarded-for') || undefined
    });
    mainSpan = requestTracer.startSpan(requestId, 'heroes-processing');
    try {
      return await handleHeroesRequest(request, requestTracer, requestId, mainSpan);
    } catch (error) {
      handleTracingAndMonitoringOnError(requestTracer, requestId, error as string | Error, mainSpan?.spanId);
      throw error;
    }
  } catch (error) {
    console.error('Heroes API Error:', error);
    return errorHandler.handleApiError(error as Error, {
      requestId,
      endpoint: '/api/heroes',
      method: 'GET',
      userAgent: request.headers.get('user-agent') || undefined,
      ipAddress: request.headers.get('x-forwarded-for') || undefined
    });
  } finally {
    gracefulShutdown.unregisterRequest(requestId);
  }
} 