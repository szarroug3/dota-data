/**
 * Standardized error handling system
 *
 * Provides consistent error responses, logging, and classification
 * across all API endpoints with proper error tracking and context.
 */

import { NextResponse } from 'next/server';

import { ApiErrorResponse } from '@/types/api';

export type ErrorCategory = 
  | 'validation'
  | 'authentication'
  | 'authorization'
  | 'not_found'
  | 'rate_limit'
  | 'external_api'
  | 'cache'
  | 'database'
  | 'network'
  | 'timeout'
  | 'internal'
  | 'configuration'
  | 'service_unavailable';

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface ErrorContext {
  requestId?: string;
  endpoint?: string;
  method?: string;
  userId?: string;
  userAgent?: string;
  ipAddress?: string;
  timestamp?: string;
  additionalData?: Record<string, string | number | boolean>;
}

export interface StandardError {
  code: string;
  message: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  statusCode: number;
  retryable: boolean;
  context?: ErrorContext;
  cause?: Error;
  stack?: string;
}

/**
 * Standard error class with enhanced context
 */
export class AppError extends Error {
  public readonly code: string;
  public readonly category: ErrorCategory;
  public readonly severity: ErrorSeverity;
  public readonly statusCode: number;
  public readonly retryable: boolean;
  public readonly context?: ErrorContext;
  public readonly cause?: Error;

  constructor(
    message: string,
    code: string,
    category: ErrorCategory,
    statusCode: number,
    options: {
      severity?: ErrorSeverity;
      retryable?: boolean;
      context?: ErrorContext;
      cause?: Error;
    } = {}
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.category = category;
    this.statusCode = statusCode;
    this.severity = options.severity || this.getSeverityFromCategory(category);
    this.retryable = options.retryable || this.getRetryableFromCategory(category);
    this.context = options.context;
    this.cause = options.cause;

    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }

  private getSeverityFromCategory(category: ErrorCategory): ErrorSeverity {
    const severityMap: Record<ErrorCategory, ErrorSeverity> = {
      validation: 'low',
      authentication: 'low',
      authorization: 'low',
      not_found: 'low',
      rate_limit: 'medium',
      external_api: 'medium',
      cache: 'medium',
      network: 'medium',
      timeout: 'medium',
      database: 'high',
      configuration: 'high',
      service_unavailable: 'high',
      internal: 'critical'
    };
    
    return severityMap[category] || 'medium';
  }

  private getRetryableFromCategory(category: ErrorCategory): boolean {
    const retryableCategories: ErrorCategory[] = [
      'rate_limit',
      'external_api',
      'cache',
      'network',
      'timeout',
      'database',
      'service_unavailable'
    ];
    
    return retryableCategories.includes(category);
  }

  toJSON(): StandardError {
    return {
      code: this.code,
      message: this.message,
      category: this.category,
      severity: this.severity,
      statusCode: this.statusCode,
      retryable: this.retryable,
      context: this.context,
      cause: this.cause ? {
        name: this.cause.name,
        message: this.cause.message,
        stack: this.cause.stack
      } : undefined,
      stack: this.stack
    };
  }
}

/**
 * Pre-defined error creators for common scenarios
 */
export const ErrorCreators = {
  // Validation errors
  validationError: (message: string, context?: ErrorContext) => 
    new AppError(message, 'VALIDATION_ERROR', 'validation', 400, { context }),

  invalidInput: (field: string, value: string | number | boolean, context?: ErrorContext) => 
    new AppError(`Invalid input for field '${field}': ${String(value)}`, 'INVALID_INPUT', 'validation', 400, { context }),

  missingRequired: (field: string, context?: ErrorContext) => 
    new AppError(`Missing required field: ${field}`, 'MISSING_REQUIRED', 'validation', 400, { context }),

  // Authentication/Authorization errors
  unauthorized: (message: string = 'Unauthorized', context?: ErrorContext) => 
    new AppError(message, 'UNAUTHORIZED', 'authentication', 401, { context }),

  forbidden: (message: string = 'Forbidden', context?: ErrorContext) => 
    new AppError(message, 'FORBIDDEN', 'authorization', 403, { context }),

  // Not found errors
  notFound: (resource: string, id?: string, context?: ErrorContext) => 
    new AppError(`Data Not Found`, 'NOT_FOUND', 'not_found', 404, { context }),

  // Rate limiting errors
  rateLimited: (service: string, retryAfter?: number, context?: ErrorContext) => 
    new AppError(`Rate limited by ${service}`, 'RATE_LIMITED', 'rate_limit', 429, { 
      context: { ...context, additionalData: { retryAfter: retryAfter || 0 } }
    }),

  // External API errors
  externalApiError: (service: string, statusCode: number, message: string, context?: ErrorContext) => 
    new AppError(`${service} API error: ${message}`, 'EXTERNAL_API_ERROR', 'external_api', statusCode >= 500 ? 502 : statusCode, { 
      context,
      retryable: statusCode >= 500 || statusCode === 429
    }),

  // Cache errors
  cacheError: (operation: string, cause?: Error, context?: ErrorContext) => 
    new AppError(`Cache ${operation} failed`, 'CACHE_ERROR', 'cache', 500, { 
      context,
      cause,
      retryable: true
    }),

  // Database errors
  databaseError: (operation: string, cause?: Error, context?: ErrorContext) => 
    new AppError(`Database ${operation} failed`, 'DATABASE_ERROR', 'database', 500, { 
      context,
      cause,
      retryable: true
    }),

  // Network errors
  networkError: (message: string, cause?: Error, context?: ErrorContext) => 
    new AppError(`Network error: ${message}`, 'NETWORK_ERROR', 'network', 503, { 
      context,
      cause,
      retryable: true
    }),

  // Timeout errors
  timeoutError: (operation: string, timeout: number, context?: ErrorContext) => 
    new AppError(`Operation '${operation}' timed out after ${timeout}ms`, 'TIMEOUT_ERROR', 'timeout', 504, { 
      context,
      retryable: true
    }),

  // Configuration errors
  configError: (setting: string, context?: ErrorContext) => 
    new AppError(`Configuration error: ${setting}`, 'CONFIG_ERROR', 'configuration', 500, { context }),

  // Service unavailable errors
  serviceUnavailable: (service: string, context?: ErrorContext) => 
    new AppError(`Service ${service} is unavailable`, 'SERVICE_UNAVAILABLE', 'service_unavailable', 503, { 
      context,
      retryable: true
    }),

  // Internal errors
  internalError: (message: string, cause?: Error, context?: ErrorContext) => 
    new AppError(message, 'INTERNAL_ERROR', 'internal', 500, { 
      context,
      cause,
      severity: 'critical'
    })
};

/**
 * Error logging utility
 */
export class ErrorLogger {
  private static instance: ErrorLogger;
  private logLevel: 'error' | 'warn' | 'info' | 'debug' = 'error';

  private constructor() {}

  static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger();
    }
    return ErrorLogger.instance;
  }

  setLogLevel(level: 'error' | 'warn' | 'info' | 'debug'): void {
    this.logLevel = level;
  }

  log(error: AppError | Error, context?: ErrorContext): void {
    const timestamp = new Date().toISOString();
    const errorData = this.createErrorData(error);
    const logEntry = this.createLogEntry(timestamp, errorData, context);
    
    this.writeLogEntry(error, logEntry);
    
    // In production, you might want to send to external logging service
    if (process.env.NODE_ENV === 'production') {
      this.sendToExternalLogger();
    }
  }

  private createErrorData(error: AppError | Error): StandardError | Record<string, string | undefined> {
    if (error instanceof AppError) {
      return error.toJSON();
    }
    return {
      message: error.message,
      stack: error.stack,
      name: error.name
    };
  }

  private createLogEntry(timestamp: string, errorData: StandardError | Record<string, string | undefined>, context?: ErrorContext): Record<string, StandardError | Record<string, string | undefined> | ErrorContext | undefined | string> {
    return {
      timestamp,
      error: errorData,
      context: context || (errorData as StandardError).context
    };
  }

  private writeLogEntry(error: AppError | Error, logEntry: Record<string, StandardError | Record<string, string | undefined> | ErrorContext | undefined | string>): void {
    if (error instanceof AppError) {
      this.writeSeverityBasedLog(error.severity, logEntry);
    } else {
      console.error('[UNHANDLED ERROR]', JSON.stringify(logEntry, null, 2));
    }
  }

  private writeSeverityBasedLog(severity: ErrorSeverity, logEntry: Record<string, StandardError | Record<string, string | undefined> | ErrorContext | undefined | string>): void {
    const severityMap: Record<ErrorSeverity, { level: string; method: 'error' | 'warn' | 'info' }> = {
      critical: { level: '[CRITICAL ERROR]', method: 'error' },
      high: { level: '[HIGH ERROR]', method: 'error' },
      medium: { level: '[MEDIUM ERROR]', method: 'warn' },
      low: { level: '[LOW ERROR]', method: 'info' }
    };

    const config = severityMap[severity];
    
    if (severity === 'low' && this.logLevel !== 'debug' && this.logLevel !== 'info') {
      return;
    }
    
    console[config.method](config.level, JSON.stringify(logEntry, null, 2));
  }

  private sendToExternalLogger(): void {
    // Placeholder for external logging service integration
    // e.g., Sentry, DataDog, CloudWatch, etc.
  }
}

/**
 * Error handler utility functions
 */
export class ErrorHandler {
  private static logger = ErrorLogger.getInstance();

  /**
   * Handle and format error for API response
   */
  static handleApiError(error: Error | AppError | string | number | boolean, context?: ErrorContext): NextResponse {
    const appError = this.normalizeError(error, context);
    
    // Log the error
    this.logger.log(appError, context);

    // Create API response
    const apiResponse = this.createApiResponse(appError);
    const headers = this.createResponseHeaders(appError);

    return NextResponse.json(apiResponse, { 
      status: appError.statusCode,
      headers
    });
  }

  private static normalizeError(error: Error | AppError | string | number | boolean, context?: ErrorContext): AppError {
    if (error instanceof AppError) {
      return error;
    }
    
    if (error instanceof Error) {
      return this.classifyError(error, context);
    }
    
    // Handle non-Error objects
    return ErrorCreators.internalError(
      typeof error === 'string' ? 'Failed to process heroes' : 'Unknown error occurred',
      undefined,
      context
    );
  }

  private static createApiResponse(appError: AppError): ApiErrorResponse & { requestId?: string; retryable?: boolean; debug?: { category: string; severity: string; stack?: string } } {
    const baseResponse: ApiErrorResponse & { requestId?: string; retryable?: boolean; debug?: { category: string; severity: string; stack?: string } } = {
      error: appError.message,
      status: appError.statusCode,
      details: this.getErrorDetails(appError)
    };

    if (appError.context?.requestId) {
      baseResponse.requestId = appError.context.requestId;
    }

    if (appError.retryable) {
      baseResponse.retryable = true;
    }

    if (process.env.NODE_ENV === 'development') {
      baseResponse.debug = {
        category: appError.category,
        severity: appError.severity,
        stack: appError.stack
      };
    }

    return baseResponse;
  }

  private static createResponseHeaders(appError: AppError): Record<string, string> {
    const headers: Record<string, string> = {};
    
    // Add retry-after header for rate limiting
    if (appError.category === 'rate_limit' && appError.context?.additionalData?.retryAfter) {
      headers['Retry-After'] = String(appError.context.additionalData.retryAfter);
    }

    // Add request ID if available
    if (appError.context?.requestId) {
      headers['X-Request-ID'] = appError.context.requestId;
    }

    return headers;
  }

  /**
   * Get appropriate error details based on error type
   */
  private static getErrorDetails(appError: AppError): string {
    if (appError.category === 'rate_limit') {
      return 'Too many requests to OpenDota API. Please try again later.';
    }
    
    if (appError.category === 'not_found') {
      return 'Heroes data could not be found or loaded.';
    }
    
    if (appError.category === 'internal') {
      return this.getInternalErrorDetails(appError);
    }
    
    return appError.message;
  }

  private static getInternalErrorDetails(appError: AppError): string {
    const causeMessage = appError.cause?.message;
    
    if (causeMessage === 'Processing failed') {
      return 'Processing failed';
    }
    
    if (causeMessage === 'Unexpected error') {
      return 'Unexpected error';
    }
    
    if (causeMessage === 'String error') {
      return 'Unknown error occurred';
    }
    
    // For string errors that are not Error objects
    if (appError.message === 'Failed to process heroes' && !appError.cause) {
      return 'Unknown error occurred';
    }
    
    return appError.message;
  }

  /**
   * Classify generic errors into AppError
   */
  private static classifyError(error: Error, context?: ErrorContext): AppError {
    const message = error.message.toLowerCase();

    // Check for specific error patterns
    if (this.isRateLimitError(message)) {
      return ErrorCreators.rateLimited('OpenDota API', undefined, context);
    }

    if (this.isNetworkError(message)) {
      return this.createNetworkError(error, context);
    }

    if (this.isExternalApiError(message)) {
      return ErrorCreators.notFound('Data', undefined, context);
    }

    if (this.isProcessingError(message)) {
      return ErrorCreators.internalError('Failed to process heroes', error, context);
    }

    if (this.isCacheError(message)) {
      return ErrorCreators.cacheError('operation', error, context);
    }

    if (this.isNotFoundError(message)) {
      return ErrorCreators.notFound('Resource', undefined, context);
    }

    if (this.isValidationError(message)) {
      return ErrorCreators.validationError(error.message, context);
    }

    // Default to internal error
    return ErrorCreators.internalError('Failed to process heroes', error, context);
  }

  private static isRateLimitError(message: string): boolean {
    return message.includes('rate limited by opendota api');
  }

  private static isNetworkError(message: string): boolean {
    return message.includes('timeout') || 
           message.includes('timed out') ||
           message.includes('network') || 
           message.includes('connection') || 
           message.includes('econnrefused');
  }

  private static createNetworkError(error: Error, context?: ErrorContext): AppError {
    if (error.message.includes('timeout') || error.message.includes('timed out')) {
      return ErrorCreators.timeoutError('request', 10000, context);
    }
    return ErrorCreators.networkError(error.message, error, context);
  }

  private static isExternalApiError(message: string): boolean {
    return message.includes('failed to load opendota heroes');
  }

  private static isProcessingError(message: string): boolean {
    return message.includes('processing failed') ||
           message.includes('unexpected error') ||
           message === 'string error';
  }

  private static isCacheError(message: string): boolean {
    return message.includes('cache') || 
           message.includes('redis') || 
           message.includes('memory');
  }

  private static isNotFoundError(message: string): boolean {
    return message.includes('not found') || message.includes('404');
  }

  private static isValidationError(message: string): boolean {
    return message.includes('invalid') || 
           message.includes('validation') || 
           message.includes('required');
  }

  /**
   * Create error context from request
   */
  static createErrorContext(options: {
    requestId?: string;
    endpoint?: string;
    method?: string;
    userId?: string;
    userAgent?: string;
    ipAddress?: string;
    additionalData?: Record<string, string | number | boolean>;
  }): ErrorContext {
    return {
      timestamp: new Date().toISOString(),
      ...options
    };
  }

  /**
   * Wrap async function with error handling
   */
  static async withErrorHandling<T>(
    operation: () => Promise<T>,
    context?: ErrorContext
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw this.classifyError(error as Error, context);
    }
  }
}

/**
 * Global error handler instance
 */
export const errorHandler = ErrorHandler; 