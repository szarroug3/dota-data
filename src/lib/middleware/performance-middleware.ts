/**
 * Performance monitoring middleware for Next.js API routes
 *
 * Provides automatic performance tracking integration for API endpoints
 * with minimal code changes required in route handlers.
 */

import { NextRequest, NextResponse } from 'next/server';

import { performanceMonitor } from '@/lib/performance-monitor';

export interface PerformanceMiddlewareConfig {
  enableDetailedLogging?: boolean;
  enableMemoryTracking?: boolean;
  slowRequestThreshold?: number;
  extractUserAgent?: boolean;
  extractIpAddress?: boolean;
  enableRequestIdHeader?: boolean;
  requestIdHeader?: string;
}

export interface ApiRouteContext {
  requestId: string;
  startTime: number;
  endpoint: string;
  method: string;
}

/**
 * Performance middleware wrapper for API routes
 * 
 * @param handler - The API route handler function
 * @param config - Configuration options for the middleware
 * @returns Enhanced handler with performance monitoring
 */
export function withPerformanceMonitoring(
  handler: (request: NextRequest, ...args: string[]) => Promise<NextResponse>,
  config: PerformanceMiddlewareConfig = {}
) {
  const {
    enableMemoryTracking = false,
    extractUserAgent = true,
    extractIpAddress = true,
    enableRequestIdHeader = true,
    requestIdHeader = 'X-Request-ID'
  } = config;

  return async (request: NextRequest, ...args: string[]): Promise<NextResponse> => {
    const startTime = Date.now();
    const requestId = getRequestId(request, requestIdHeader, startTime);
    const { endpoint, method, userAgent, ipAddress } = extractRequestInfo(request, extractUserAgent, extractIpAddress);
    performanceMonitor.startRequest(endpoint, method, {
      requestId,
      userAgent: userAgent || undefined,
      ipAddress: ipAddress || undefined
    });
    try {
      const response = await handler(request, ...args);
      const responseTime = Date.now() - startTime;
      performanceMonitor.endRequest(requestId, response.status);
      setPerformanceHeaders(response, responseTime, enableRequestIdHeader, requestIdHeader, requestId, enableMemoryTracking);
      return response;
    } catch (error) {
      performanceMonitor.endRequest(requestId, 500, {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  };
}

function getRequestId(request: NextRequest, requestIdHeader: string, startTime: number): string {
  return request.headers.get(requestIdHeader) || `req-${startTime}-${Math.random().toString(36).substring(2, 15)}`;
}

function extractRequestInfo(request: NextRequest, extractUserAgent: boolean, extractIpAddress: boolean) {
  const endpoint = new URL(request.url).pathname;
  const method = request.method;
  const userAgent = extractUserAgent ? request.headers.get('user-agent') : undefined;
  const ipAddress = extractIpAddress ? request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') : undefined;
  return { endpoint, method, userAgent, ipAddress };
}

function setPerformanceHeaders(
  response: NextResponse,
  responseTime: number,
  enableRequestIdHeader: boolean,
  requestIdHeader: string,
  requestId: string,
  enableMemoryTracking: boolean
) {
  if (enableRequestIdHeader) {
    response.headers.set(requestIdHeader, requestId);
  }
  response.headers.set('X-Response-Time', `${responseTime}ms`);
  if (enableMemoryTracking) {
    const memoryUsage = process.memoryUsage();
    response.headers.set('X-Memory-Usage', `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`);
  }
}

/**
 * Simple request ID middleware
 */
export function withRequestId(
  handler: (request: NextRequest, ...args: string[]) => Promise<NextResponse>,
  config: PerformanceMiddlewareConfig = {}
) {
  const { requestIdHeader = 'X-Request-ID' } = config;

  return async (request: NextRequest, ...args: string[]): Promise<NextResponse> => {
    const requestId = request.headers.get(requestIdHeader) || `req-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    
    const response = await handler(request, ...args);
    response.headers.set(requestIdHeader, requestId);
    return response;
  };
}

/**
 * Create a route module with performance monitoring
 */
export function createPerformanceRoute(
  handlers: Record<string, (request: NextRequest, ...args: string[]) => Promise<NextResponse>>,
  config: PerformanceMiddlewareConfig = {}
) {
  const routeModule: Record<string, (request: NextRequest, ...args: string[]) => Promise<NextResponse>> = {};

  for (const [method, handler] of Object.entries(handlers)) {
    routeModule[method] = withPerformanceMonitoring(handler, config);
  }

  return routeModule;
} 