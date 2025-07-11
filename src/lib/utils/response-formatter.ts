/**
 * Response formatting utilities
 *
 * Provides consistent response formatting across all API endpoints
 * with standardized structure, metadata, and pagination support.
 */

import { NextResponse } from 'next/server';

export type Metadata = Record<string, string | number | boolean | null | undefined>;
export type FilterMap = Record<string, string | number | boolean | null | undefined>;
export type GenericObject = Record<string, string | number | boolean | null | undefined>;

export interface ApiResponse<T = GenericObject> {
  data: T;
  timestamp: string;
  requestId?: string;
  cached?: boolean;
  metadata?: Metadata;
}

export interface PaginatedResponse<T = GenericObject> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface FilteredResponse<T = GenericObject> extends ApiResponse<T[]> {
  count: number;
  totalCount: number;
  filters: FilterMap;
}

export interface ProcessedResponse<T = GenericObject> extends ApiResponse<T> {
  processed: {
    timestamp: string;
    version: string;
    dataQuality?: string;
    completeness?: number;
  };
}

export interface ResponseOptions {
  requestId?: string;
  cached?: boolean;
  headers?: Record<string, string>;
  statusCode?: number;
  metadata?: Metadata;
}

/**
 * Response formatter utility class
 */
export class ResponseFormatter {
  /**
   * Format a basic API response
   */
  static success<T = GenericObject>(data: T, options: ResponseOptions = {}): NextResponse {
    const response: ApiResponse<T> = {
      data,
      timestamp: new Date().toISOString(),
    };
    if (options.metadata) {
      response.metadata = options.metadata;
    }
    if (options.requestId) {
      response.requestId = options.requestId;
    }
    if (options.cached !== undefined) {
      response.cached = options.cached;
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (options.requestId) {
      headers['X-Request-ID'] = options.requestId;
    }

    if (options.cached) {
      headers['X-Cache-Status'] = 'HIT';
    }

    return NextResponse.json(response, {
      status: options.statusCode || 200,
      headers
    });
  }

  /**
   * Format a paginated response
   */
  static paginated<T = GenericObject>(
    data: T[],
    pagination: {
      page: number;
      limit: number;
      total: number;
    },
    options: ResponseOptions = {}
  ): NextResponse {
    const totalPages = Math.ceil(pagination.total / pagination.limit);
    
    const response: PaginatedResponse<T> = {
      data,
      timestamp: new Date().toISOString(),
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total: pagination.total,
        totalPages,
        hasNext: pagination.page < totalPages,
        hasPrev: pagination.page > 1
      }
    };
    if (options.metadata) {
      response.metadata = options.metadata;
    }
    if (options.requestId) {
      response.requestId = options.requestId;
    }
    if (options.cached !== undefined) {
      response.cached = options.cached;
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Total-Count': pagination.total.toString(),
      'X-Page': pagination.page.toString(),
      'X-Per-Page': pagination.limit.toString(),
      'X-Total-Pages': totalPages.toString(),
      ...options.headers
    };

    if (options.requestId) {
      headers['X-Request-ID'] = options.requestId;
    }

    if (options.cached) {
      headers['X-Cache-Status'] = 'HIT';
    }

    return NextResponse.json(response, {
      status: options.statusCode || 200,
      headers
    });
  }

  /**
   * Format a filtered response
   */
  static filtered<T = GenericObject>(
    data: T[],
    filtering: {
      count: number;
      totalCount: number;
      filters: FilterMap;
    },
    options: ResponseOptions = {}
  ): NextResponse {
    const response: FilteredResponse<T> = {
      data,
      count: filtering.count,
      totalCount: filtering.totalCount,
      filters: filtering.filters,
      timestamp: new Date().toISOString(),
    };
    if (options.metadata) {
      response.metadata = options.metadata;
    }
    if (options.requestId) {
      response.requestId = options.requestId;
    }
    if (options.cached !== undefined) {
      response.cached = options.cached;
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Filtered-Count': filtering.count.toString(),
      'X-Total-Count': filtering.totalCount.toString(),
      ...options.headers
    };

    if (options.requestId) {
      headers['X-Request-ID'] = options.requestId;
    }

    if (options.cached) {
      headers['X-Cache-Status'] = 'HIT';
    }

    return NextResponse.json(response, {
      status: options.statusCode || 200,
      headers
    });
  }

  /**
   * Format a processed response with metadata
   */
  static processed<T = GenericObject>(
    data: T,
    processing: {
      version?: string;
      dataQuality?: string;
      completeness?: number;
    } = {},
    options: ResponseOptions = {}
  ): NextResponse {
    const response = ResponseFormatter.buildProcessedResponse(data, processing, options);
    const headers = ResponseFormatter.buildProcessedHeaders(processing, options);
    
    return NextResponse.json(response, {
      status: options.statusCode || 200,
      headers
    });
  }

  /**
   * Helper to build headers for API responses
   */
  private static buildHeaders(
    baseHeaders: Record<string, string>,
    options: ResponseOptions,
    extraHeaders: Record<string, string> = {}
  ): Record<string, string> {
    const headers: Record<string, string> = {
      ...baseHeaders,
      ...options.headers,
      ...extraHeaders
    };
    if (options.requestId) {
      headers['X-Request-ID'] = options.requestId;
    }
    if (options.cached) {
      headers['X-Cache-Status'] = 'HIT';
    }
    return headers;
  }

  /**
   * Helper to build processed metadata
   */
  private static buildProcessedMeta(processing?: {
    version?: string;
    dataQuality?: string;
    completeness?: number;
  }): Record<string, string | number | undefined> | undefined {
    if (!processing) return undefined;
    return {
      timestamp: new Date().toISOString(),
      version: processing.version || '1.0.0',
      ...processing
    };
  }

  /**
   * Helper to build processed response
   */
  private static buildProcessedResponse<T = GenericObject>(
    data: T,
    processing: {
      version?: string;
      dataQuality?: string;
      completeness?: number;
    },
    options: ResponseOptions
  ): ProcessedResponse<T> {
    const response: ProcessedResponse<T> = {
      data,
      timestamp: new Date().toISOString(),
      processed: {
        timestamp: new Date().toISOString(),
        version: processing.version || '1.0.0',
        dataQuality: processing.dataQuality,
        completeness: processing.completeness
      }
    };
    
    if (options.metadata) {
      response.metadata = options.metadata;
    }
    if (options.requestId) {
      response.requestId = options.requestId;
    }
    if (options.cached !== undefined) {
      response.cached = options.cached;
    }
    
    return response;
  }

  /**
   * Helper to build processed headers
   */
  private static buildProcessedHeaders(
    processing: {
      version?: string;
      dataQuality?: string;
      completeness?: number;
    },
    options: ResponseOptions
  ): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Data-Version': processing.version || '1.0.0',
      ...options.headers
    };

    if (options.requestId) {
      headers['X-Request-ID'] = options.requestId;
    }

    if (options.cached) {
      headers['X-Cache-Status'] = 'HIT';
    }

    return headers;
  }

  static collection<T = GenericObject>(
    data: T | Partial<T>,
    metadata: {
      view?: string;
      options?: Metadata;
      processing?: {
        version?: string;
        dataQuality?: string;
        completeness?: number;
      };
    } = {},
    options: ResponseOptions = {}
  ): NextResponse {
    const response: Record<string, string | number | boolean | T | Partial<T> | Metadata | Record<string, string | number | undefined>> = {
      data: data as T | Partial<T>,
      timestamp: new Date().toISOString(),
    };
    if (metadata.options) {
      response.options = metadata.options;
    }
    const processed = this.buildProcessedMeta(metadata.processing);
    if (processed) {
      response.processed = processed;
    }
    if (options.requestId) {
      response.requestId = options.requestId;
    }
    if (options.cached !== undefined) {
      response.cached = options.cached;
    }
    const baseHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
    const extraHeaders: Record<string, string> = {};
    if (metadata.view) {
      extraHeaders['X-View'] = metadata.view;
    }
    const headers = this.buildHeaders(baseHeaders, options, extraHeaders);
    return NextResponse.json(response, {
      status: options.statusCode || 200,
      headers
    });
  }

  static async<T = GenericObject>(
    result: {
      jobId: string;
      status: 'queued' | 'processing' | 'completed' | 'failed' | 'timeout';
      data?: T;
      error?: string;
      estimatedTime?: number;
      processingTime?: number;
    },
    options: ResponseOptions = {}
  ): NextResponse {
    const response: Record<string, string | number | boolean | T | undefined> = {
      jobId: result.jobId,
      status: result.status,
      timestamp: new Date().toISOString(),
    };
    if (result.data) {
      response.data = result.data;
    }
    if (result.error) {
      response.error = result.error;
    }
    if (result.estimatedTime) {
      response.estimatedTime = result.estimatedTime;
    }
    if (result.processingTime) {
      response.processingTime = result.processingTime;
    }
    if (options.requestId) {
      response.requestId = options.requestId;
    }
    if (options.cached !== undefined) {
      response.cached = options.cached;
    }
    const baseHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Job-Status': result.status
    };
    const extraHeaders: Record<string, string> = {};
    if (result.estimatedTime) {
      extraHeaders['X-Estimated-Time'] = result.estimatedTime.toString();
    }
    const headers = this.buildHeaders(baseHeaders, options, extraHeaders);
    return NextResponse.json(response, {
      status: options.statusCode || 200,
      headers
    });
  }

  /**
   * Format a health check response
   */
  static health(
    status: 'healthy' | 'unhealthy' | 'degraded',
    data: Metadata,
    options: ResponseOptions = {}
  ): NextResponse {
    const response: Record<string, string | number | boolean | Metadata> = {
      status,
      timestamp: new Date().toISOString(),
      ...data,
    };
    if (options.metadata) {
      response.metadata = options.metadata;
    }
    if (options.requestId) {
      response.requestId = options.requestId;
    }
    if (options.cached !== undefined) {
      response.cached = options.cached;
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Health-Status': status,
      ...options.headers
    };

    if (options.requestId) {
      headers['X-Request-ID'] = options.requestId;
    }

    if (options.cached) {
      headers['X-Cache-Status'] = 'HIT';
    }

    return NextResponse.json(response, {
      status: options.statusCode || 200,
      headers
    });
  }

  /**
   * Add performance headers to response
   */
  static addPerformanceHeaders(
    response: NextResponse,
    metrics: {
      duration?: number;
      memoryUsage?: number;
      cacheHit?: boolean;
      rateLimited?: boolean;
    }
  ): NextResponse {
    const headers = new Headers(response.headers);

    if (metrics.duration) {
      headers.set('X-Response-Time', `${metrics.duration}ms`);
    }

    if (metrics.memoryUsage) {
      headers.set('X-Memory-Usage', `${metrics.memoryUsage}MB`);
    }

    if (metrics.cacheHit) {
      headers.set('X-Cache-Status', 'HIT');
    }

    if (metrics.rateLimited) {
      headers.set('X-Rate-Limited', 'true');
    }

    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers
    });
  }

  /**
   * Add CORS headers to response
   */
  static addCorsHeaders(
    response: NextResponse,
    options: {
      origin?: string;
      methods?: string[];
      headers?: string[];
      credentials?: boolean;
    } = {}
  ): NextResponse {
    const headers = new Headers(response.headers);

    headers.set('Access-Control-Allow-Origin', options.origin || '*');
    headers.set('Access-Control-Allow-Methods', (options.methods || ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']).join(', '));
    headers.set('Access-Control-Allow-Headers', (options.headers || ['Content-Type', 'Authorization']).join(', '));

    if (options.credentials) {
      headers.set('Access-Control-Allow-Credentials', 'true');
    }

    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers
    });
  }

  /**
   * Add security headers to response
   */
  static addSecurityHeaders(response: NextResponse): NextResponse {
    const headers = new Headers(response.headers);

    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('X-Frame-Options', 'DENY');
    headers.set('X-XSS-Protection', '1; mode=block');
    headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers
    });
  }
}

/**
 * View filtering utilities
 */
export class ViewFilter {
  /**
   * Filter data based on view type
   */
  static filterByView<T = GenericObject>(data: T, view: string, viewMap: Record<string, (keyof T)[]>): Partial<T> {
    const fields = viewMap[view];
    if (!fields) return data;

    const filtered: Partial<T> = {};
    for (const field of fields) {
      if (data[field] !== undefined) {
        filtered[field] = data[field];
      }
    }
    return filtered;
  }

  /**
   * Create a view map from field definitions
   */
  static createViewMap<T = GenericObject>(fullFields: (keyof T)[]): Record<string, (keyof T)[]> {
    return {
      full: fullFields,
      summary: fullFields.slice(0, Math.ceil(fullFields.length / 2)),
      minimal: fullFields.slice(0, 3)
    };
  }
} 