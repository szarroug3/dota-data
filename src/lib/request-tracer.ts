/**
 * Request tracing utilities
 *
 * Provides distributed tracing capabilities for API requests
 * with span management, logging, and performance monitoring.
 */

import { NextRequest } from 'next/server';

// Define specific types for metadata and tags
export type TraceMetadata = Record<string, string | number | boolean | undefined>;
export type SpanTags = Record<string, string | number | boolean | undefined>;
export type LogData = Record<string, string | number | boolean | undefined>;

export interface RequestTrace {
  requestId: string;
  correlationId: string;
  parentId?: string;
  startTime: number;
  endpoint: string;
  method: string;
  userAgent?: string;
  ipAddress?: string;
  userId?: string;
  sessionId?: string;
  metadata: TraceMetadata;
  spans: RequestSpan[];
}

export interface RequestSpan {
  spanId: string;
  parentSpanId?: string;
  operation: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  tags: SpanTags;
  logs: SpanLog[];
  status: 'success' | 'error' | 'timeout';
  error?: string;
}

export interface SpanLog {
  timestamp: number;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  data?: LogData;
}

export interface TracingConfig {
  enableTracing?: boolean;
  enableSpanLogging?: boolean;
  maxSpansPerRequest?: number;
  maxLogsPerSpan?: number;
  enableDistributedTracing?: boolean;
  serviceName?: string;
  serviceVersion?: string;
}

export interface TraceOptions {
  requestId?: string;
  correlationId?: string;
  parentId?: string;
  userId?: string;
  sessionId?: string;
  metadata?: TraceMetadata;
}

export interface SpanOptions {
  parentSpanId?: string;
  tags?: SpanTags;
}

export interface SpanEndOptions {
  status?: 'success' | 'error' | 'timeout';
  error?: string;
  tags?: SpanTags;
}

export interface TraceCompletionOptions {
  status?: 'success' | 'error' | 'timeout';
  error?: string;
  responseStatus?: number;
  responseSize?: number;
}

export interface SpanSummary {
  spanId: string;
  operation: string;
  duration?: number;
  status: string;
  tags: SpanTags;
  logCount: number;
}

export interface TraceSummary {
  requestId: string;
  correlationId: string;
  endpoint: string;
  method: string;
  startTime: number;
  duration?: number;
  status?: string;
  spanCount: number;
  spans: SpanSummary[];
}

export interface ExportedSpan {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  operationName: string;
  startTime: number;
  duration?: number;
  tags: SpanTags;
  logs: Array<{
    timestamp: number;
    fields: {
      level: string;
      message: string;
      data?: LogData;
    };
  }>;
  process: {
    serviceName: string;
    tags: {
      version: string;
      node_env?: string;
    };
  };
}

export interface ExportedTrace {
  traceId: string;
  spans: ExportedSpan[];
}

/**
 * Request tracing utility class
 */
export class RequestTracer {
  private static instance: RequestTracer;
  private traces: Map<string, RequestTrace> = new Map();
  private config: TracingConfig;
  private cleanupInterval?: NodeJS.Timeout;

  private constructor(config: TracingConfig = {}) {
    this.config = {
      enableTracing: true,
      enableSpanLogging: false,
      maxSpansPerRequest: 50,
      maxLogsPerSpan: 100,
      enableDistributedTracing: false,
      serviceName: 'dota-data-api',
      serviceVersion: '1.0.0',
      ...config
    };

    // Set up cleanup interval
    if (this.config.enableTracing) {
      this.cleanupInterval = setInterval(() => {
        this.cleanupOldTraces();
      }, 5 * 60 * 1000); // Clean up every 5 minutes
    }
  }

  static getInstance(config?: TracingConfig): RequestTracer {
    if (!RequestTracer.instance) {
      RequestTracer.instance = new RequestTracer(config);
    }
    return RequestTracer.instance;
  }

  /**
   * Generate a unique request ID
   */
  generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate a unique correlation ID
   */
  generateCorrelationId(): string {
    return `corr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate a unique span ID
   */
  generateSpanId(): string {
    return `span_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Start a new trace for a request
   */
  startTrace(request: NextRequest, options: TraceOptions = {}): RequestTrace {
    if (!this.config.enableTracing) {
      return this.createDummyTrace();
    }

    const requestId = options.requestId || this.generateRequestId();
    const correlationId = options.correlationId || this.generateCorrelationId();
    const url = new URL(request.url);

    const trace: RequestTrace = {
      requestId,
      correlationId,
      parentId: options.parentId,
      startTime: Date.now(),
      endpoint: url.pathname,
      method: request.method,
      userAgent: request.headers.get('user-agent') || undefined,
      ipAddress: this.extractIpAddress(request),
      userId: options.userId,
      sessionId: options.sessionId,
      metadata: {
        ...options.metadata,
        'service.name': this.config.serviceName,
        'service.version': this.config.serviceVersion
      },
      spans: []
    };

    this.traces.set(requestId, trace);

    if (this.config.enableSpanLogging) {
      console.log(`[Trace] Started request ${requestId} - ${request.method} ${url.pathname}`);
    }

    return trace;
  }

  /**
   * Get a trace by request ID
   */
  getTrace(requestId: string): RequestTrace | null {
    return this.traces.get(requestId) || null;
  }

  /**
   * Start a new span within a trace
   */
  startSpan(requestId: string, operation: string, options: SpanOptions = {}): RequestSpan | null {
    if (!this.config.enableTracing) return null;

    const trace = this.traces.get(requestId);
    if (!trace) return null;

    if (trace.spans.length >= (this.config.maxSpansPerRequest || 50)) {
      console.warn(`[Trace] Max spans per request reached for ${requestId}`);
      return null;
    }

    const span: RequestSpan = {
      spanId: this.generateSpanId(),
      parentSpanId: options.parentSpanId,
      operation,
      startTime: Date.now(),
      tags: {
        ...options.tags,
        'service.name': this.config.serviceName,
        'service.version': this.config.serviceVersion
      },
      logs: [],
      status: 'success'
    };

    trace.spans.push(span);

    if (this.config.enableSpanLogging) {
      console.log(`[Trace] Started span ${span.spanId} - ${operation} in ${requestId}`);
    }

    return span;
  }

  /**
   * End a span
   */
  endSpan(requestId: string, spanId: string, options: SpanEndOptions = {}): void {
    if (!this.config.enableTracing) return;

    const trace = this.traces.get(requestId);
    if (!trace) return;

    const span = trace.spans.find(s => s.spanId === spanId);
    if (!span) return;

    span.endTime = Date.now();
    span.duration = span.endTime - span.startTime;
    span.status = options.status || 'success';
    span.error = options.error;

    if (options.tags) {
      span.tags = { ...span.tags, ...options.tags };
    }

    if (this.config.enableSpanLogging) {
      console.log(`[Trace] Ended span ${spanId} - ${span.operation} (${span.duration}ms)`);
    }
  }

  /**
   * Add a log entry to a span
   */
  addSpanLog(requestId: string, spanId: string, log: Omit<SpanLog, 'timestamp'>): void {
    if (!this.config.enableTracing) return;

    const trace = this.traces.get(requestId);
    if (!trace) return;

    const span = trace.spans.find(s => s.spanId === spanId);
    if (!span) return;

    if (span.logs.length >= (this.config.maxLogsPerSpan || 100)) {
      console.warn(`[Trace] Max logs per span reached for ${spanId}`);
      return;
    }

    span.logs.push({
      ...log,
      timestamp: Date.now()
    });
  }

  /**
   * Add metadata to a trace
   */
  addTraceMetadata(requestId: string, metadata: TraceMetadata): void {
    if (!this.config.enableTracing) return;

    const trace = this.traces.get(requestId);
    if (!trace) return;

    trace.metadata = { ...trace.metadata, ...metadata };
  }

  /**
   * Complete a trace
   */
  completeTrace(requestId: string, options: TraceCompletionOptions = {}): RequestTrace | null {
    const trace = this.traces.get(requestId);
    if (!trace) return null;

    // Add completion metadata
    this.addTraceMetadata(requestId, {
      endTime: Date.now(),
      duration: Date.now() - trace.startTime,
      status: options.status || 'success',
      error: options.error,
      responseStatus: options.responseStatus,
      responseSize: options.responseSize
    });

    if (this.config.enableSpanLogging) {
      const duration = Date.now() - trace.startTime;
      console.log(`[Trace] Completed request ${requestId} - ${duration}ms (${options.status || 'success'})`);
    }

    return trace;
  }

  /**
   * Get trace summary
   */
  getTraceSummary(requestId: string): TraceSummary | null {
    const trace = this.traces.get(requestId);
    if (!trace) return null;

    const spans: SpanSummary[] = trace.spans.map(span => ({
      spanId: span.spanId,
      operation: span.operation,
      duration: span.duration,
      status: span.status,
      tags: span.tags,
      logCount: span.logs.length
    }));

    return {
      requestId: trace.requestId,
      correlationId: trace.correlationId,
      endpoint: trace.endpoint,
      method: trace.method,
      startTime: trace.startTime,
      duration: trace.metadata.duration as number | undefined,
      status: trace.metadata.status as string | undefined,
      spanCount: spans.length,
      spans
    };
  }

  /**
   * Export trace data for external systems
   */
  exportTrace(requestId: string): ExportedTrace | null {
    const trace = this.traces.get(requestId);
    if (!trace) return null;

    const spans: ExportedSpan[] = trace.spans.map(span => ({
      traceId: trace.correlationId,
      spanId: span.spanId,
      parentSpanId: span.parentSpanId,
      operationName: span.operation,
      startTime: span.startTime,
      duration: span.duration,
      tags: {
        ...span.tags,
        'service.name': this.config.serviceName,
        'service.version': this.config.serviceVersion,
        'http.method': trace.method,
        'http.url': trace.endpoint,
        'user.id': trace.userId,
        'user.agent': trace.userAgent,
        'client.ip': trace.ipAddress
      },
      logs: span.logs.map(log => ({
        timestamp: log.timestamp,
        fields: {
          level: log.level,
          message: log.message,
          ...(log.data && { data: log.data })
        }
      })),
      process: {
        serviceName: this.config.serviceName || 'dota-data-api',
        tags: {
          version: this.config.serviceVersion || '1.0.0',
          node_env: process.env.NODE_ENV
        }
      }
    }));

    return {
      traceId: trace.correlationId,
      spans
    };
  }

  /**
   * Clean up old traces to prevent memory leaks
   */
  private cleanupOldTraces(): void {
    const cutoffTime = Date.now() - (60 * 60 * 1000); // 1 hour ago
    const toDelete: string[] = [];

    for (const [requestId, trace] of this.traces.entries()) {
      if (trace.startTime < cutoffTime) {
        toDelete.push(requestId);
      }
    }

    toDelete.forEach(requestId => {
      this.traces.delete(requestId);
    });

    if (toDelete.length > 0) {
      console.log(`[Trace] Cleaned up ${toDelete.length} old traces`);
    }
  }

  /**
   * Extract IP address from request
   */
  private extractIpAddress(request: NextRequest): string | undefined {
    const headers = [
      'x-forwarded-for',
      'x-real-ip',
      'x-client-ip',
      'cf-connecting-ip'
    ];

    for (const header of headers) {
      const value = request.headers.get(header);
      if (value) {
        return value.split(',')[0].trim();
      }
    }

    return undefined;
  }

  /**
   * Create a dummy trace for when tracing is disabled
   */
  private createDummyTrace(): RequestTrace {
    return {
      requestId: 'disabled',
      correlationId: 'disabled',
      startTime: Date.now(),
      endpoint: '',
      method: '',
      metadata: {},
      spans: []
    };
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.traces.clear();
  }

  /**
   * Extract request ID from headers
   */
  extractRequestId(request: NextRequest): string | undefined {
    return request.headers.get('x-request-id') || undefined;
  }

  /**
   * Extract correlation ID from headers
   */
  extractCorrelationId(request: NextRequest): string | undefined {
    return request.headers.get('x-correlation-id') || undefined;
  }

  /**
   * Create tracing headers for downstream requests
   */
  createTracingHeaders(requestId: string, correlationId: string): Record<string, string> {
    return {
      'x-request-id': requestId,
      'x-correlation-id': correlationId
    };
  }
} 