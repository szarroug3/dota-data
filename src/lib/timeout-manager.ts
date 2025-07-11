/**
 * Timeout management system
 *
 * Provides comprehensive timeout handling for requests, operations,
 * and background tasks to prevent hanging and improve reliability.
 */

import { ErrorCreators } from './error-handler';

export interface TimeoutConfig {
  defaultTimeout?: number;
  maxTimeout?: number;
  enableLogging?: boolean;
  enableMetrics?: boolean;
}

export interface TimeoutOptions {
  timeout?: number;
  operation?: string;
  onTimeout?: (operation: string, duration: number) => void;
  onComplete?: (operation: string, duration: number) => void;
  signal?: AbortSignal;
}

export interface TimeoutMetrics {
  totalTimeouts: number;
  averageTimeout: number;
  operationTimeouts: Record<string, number>;
  recentTimeouts: Array<{
    operation: string;
    duration: number;
    timestamp: number;
  }>;
}

/**
 * Timeout manager class
 */
export class TimeoutManager {
  private static instance: TimeoutManager;
  private config: TimeoutConfig;
  private metrics: TimeoutMetrics = {
    totalTimeouts: 0,
    averageTimeout: 0,
    operationTimeouts: {},
    recentTimeouts: []
  };
  private activeTimeouts: Map<string, NodeJS.Timeout> = new Map();

  private constructor(config: TimeoutConfig = {}) {
    this.config = {
      defaultTimeout: 30000, // 30 seconds
      maxTimeout: 300000, // 5 minutes
      enableLogging: true,
      enableMetrics: true,
      ...config
    };
  }

  static getInstance(config?: TimeoutConfig): TimeoutManager {
    if (!TimeoutManager.instance) {
      TimeoutManager.instance = new TimeoutManager(config);
    }
    return TimeoutManager.instance;
  }

  /**
   * Create a timeout promise that rejects after specified duration
   */
  createTimeout(duration: number, operation: string = 'operation'): Promise<never> {
    const timeoutId = `${operation}-${Date.now()}-${Math.random()}`;
    
    return new Promise((_, reject) => {
      const timeout = setTimeout(() => {
        this.activeTimeouts.delete(timeoutId);
        
        if (this.config.enableMetrics) {
          this.recordTimeout(operation, duration);
        }
        
        if (this.config.enableLogging) {
          console.warn(`[Timeout] Operation '${operation}' timed out after ${duration}ms`);
        }
        
        reject(ErrorCreators.timeoutError(operation, duration));
      }, duration);
      
      this.activeTimeouts.set(timeoutId, timeout);
    });
  }

  /**
   * Wrap a promise with timeout
   */
  async withTimeout<T>(
    promise: Promise<T>,
    options: TimeoutOptions = {}
  ): Promise<T> {
    const timeout = this.calculateTimeout(options);
    const operation = options.operation || 'async operation';
    const startTime = Date.now();
    
    // Create abort controller if signal is provided
    if (options.signal) {
      options.signal.addEventListener('abort', () => {
        // Handle abort if needed
      });
    }

    try {
      const result = await Promise.race([
        promise,
        this.createTimeout(timeout, operation)
      ]);

      const duration = Date.now() - startTime;
      this.handleCompletion(operation, duration, timeout, options);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.handleTimeout(operation, duration, timeout, options);
      throw error;
    } finally {
      this.cleanupTimeouts(operation);
    }
  }

  /**
   * Create a timeout for HTTP requests
   */
  async withHttpTimeout<T>(
    fetchPromise: Promise<T>,
    options: TimeoutOptions & { url?: string } = {}
  ): Promise<T> {
    const operation = options.operation || `HTTP ${options.url || 'request'}`;
    const timeout = options.timeout || 15000; // 15 seconds default for HTTP
    
    return this.withTimeout(fetchPromise, {
      ...options,
      timeout,
      operation
    });
  }

  /**
   * Create a timeout for database operations
   */
  async withDatabaseTimeout<T>(
    dbPromise: Promise<T>,
    options: TimeoutOptions & { query?: string } = {}
  ): Promise<T> {
    const operation = options.operation || `Database ${options.query || 'query'}`;
    const timeout = options.timeout || 10000; // 10 seconds default for DB
    
    return this.withTimeout(dbPromise, {
      ...options,
      timeout,
      operation
    });
  }

  /**
   * Create a timeout for cache operations
   */
  async withCacheTimeout<T>(
    cachePromise: Promise<T>,
    options: TimeoutOptions & { key?: string } = {}
  ): Promise<T> {
    const operation = options.operation || `Cache ${options.key || 'operation'}`;
    const timeout = options.timeout || 5000; // 5 seconds default for cache
    
    return this.withTimeout(cachePromise, {
      ...options,
      timeout,
      operation
    });
  }

  /**
   * Create a timeout for external API calls
   */
  async withExternalApiTimeout<T>(
    apiPromise: Promise<T>,
    options: TimeoutOptions & { service?: string } = {}
  ): Promise<T> {
    const operation = options.operation || `External API ${options.service || 'call'}`;
    const timeout = options.timeout || 20000; // 20 seconds default for external APIs
    
    return this.withTimeout(apiPromise, {
      ...options,
      timeout,
      operation
    });
  }

  /**
   * Create a racing timeout between multiple promises
   */
  async raceWithTimeout<T>(
    promises: Promise<T>[],
    options: TimeoutOptions = {}
  ): Promise<T> {
    const operation = options.operation || 'race operation';
    const timeout = options.timeout || this.config.defaultTimeout!;
    
    return this.withTimeout(
      Promise.race(promises),
      { ...options, timeout, operation }
    );
  }

  /**
   * Create a timeout for all promises to complete
   */
  async allWithTimeout<T>(
    promises: Promise<T>[],
    options: TimeoutOptions = {}
  ): Promise<T[]> {
    const operation = options.operation || 'all operation';
    const timeout = options.timeout || this.config.defaultTimeout!;
    
    return this.withTimeout(
      Promise.all(promises),
      { ...options, timeout, operation }
    );
  }

  /**
   * Delay execution with timeout
   */
  async delay(ms: number, options: { signal?: AbortSignal } = {}): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(resolve, ms);
      
      if (options.signal) {
        options.signal.addEventListener('abort', () => {
          clearTimeout(timeout);
          reject(new Error('Delay aborted'));
        });
      }
    });
  }

  /**
   * Retry operation with timeout
   */
  async retry<T>(
    operation: () => Promise<T>,
    options: {
      maxRetries?: number;
      baseDelay?: number;
      maxDelay?: number;
      timeout?: number;
      operationName?: string;
      backoffMultiplier?: number;
      signal?: AbortSignal;
    } = {}
  ): Promise<T> {
    const retryConfig = this.createRetryConfig(options);
    let lastError: Error;
    
    for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
      try {
        return await this.withTimeout(operation(), {
          timeout: retryConfig.timeout,
          operation: `${retryConfig.operationName} (attempt ${attempt + 1})`
        });
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === retryConfig.maxRetries) {
          break;
        }
        
        const delay = this.calculateRetryDelay(attempt, retryConfig);
        this.logRetryAttempt(retryConfig.operationName, attempt, retryConfig.maxRetries, delay, error instanceof Error ? error : String(error));
        await this.delay(delay, { signal: retryConfig.signal });
      }
    }
    
    throw lastError!;
  }

  /**
   * Get timeout metrics
   */
  getMetrics(): TimeoutMetrics {
    return { ...this.metrics };
  }

  /**
   * Reset timeout metrics
   */
  resetMetrics(): void {
    this.metrics = {
      totalTimeouts: 0,
      averageTimeout: 0,
      operationTimeouts: {},
      recentTimeouts: []
    };
  }

  /**
   * Clear all active timeouts
   */
  clearAllTimeouts(): void {
    for (const [id, timeout] of this.activeTimeouts.entries()) {
      clearTimeout(timeout);
      this.activeTimeouts.delete(id);
    }
    
    if (this.config.enableLogging) {
      console.log('[Timeout] Cleared all active timeouts');
    }
  }

  /**
   * Get count of active timeouts
   */
  getActiveTimeoutCount(): number {
    return this.activeTimeouts.size;
  }

  /**
   * Record timeout for metrics
   */
  private recordTimeout(operation: string, duration: number): void {
    this.metrics.totalTimeouts++;
    this.metrics.operationTimeouts[operation] = (this.metrics.operationTimeouts[operation] || 0) + 1;
    
    // Calculate running average
    this.metrics.averageTimeout = (
      (this.metrics.averageTimeout * (this.metrics.totalTimeouts - 1)) + duration
    ) / this.metrics.totalTimeouts;
    
    // Add to recent timeouts (keep last 100)
    this.metrics.recentTimeouts.push({
      operation,
      duration,
      timestamp: Date.now()
    });
    
    if (this.metrics.recentTimeouts.length > 100) {
      this.metrics.recentTimeouts.shift();
    }
  }

  /**
   * Clean up timeouts for specific operation
   */
  private cleanupTimeouts(operation: string): void {
    const toDelete: string[] = [];
    
    for (const [id, timeout] of this.activeTimeouts.entries()) {
      if (id.startsWith(operation)) {
        clearTimeout(timeout);
        toDelete.push(id);
      }
    }
    
    toDelete.forEach(id => this.activeTimeouts.delete(id));
  }

  private calculateTimeout(options: TimeoutOptions): number {
    return Math.min(
      options.timeout || this.config.defaultTimeout!,
      this.config.maxTimeout!
    );
  }

  private createAbortController(signal?: AbortSignal): AbortController {
    const abortController = new AbortController();
    if (signal) {
      signal.addEventListener('abort', () => {
        abortController.abort();
      });
    }
    return abortController;
  }

  private handleCompletion(operation: string, duration: number, timeout: number, options: TimeoutOptions): void {
    if (options.onComplete) {
      options.onComplete(operation, duration);
    }
    
    if (this.config.enableLogging && duration > timeout * 0.8) {
      console.warn(`[Timeout] Operation '${operation}' took ${duration}ms (${Math.round(duration/timeout*100)}% of timeout)`);
    }
  }

  private handleTimeout(operation: string, duration: number, timeout: number, options: TimeoutOptions): void {
    if (options.onTimeout && duration >= timeout) {
      options.onTimeout(operation, duration);
    }
  }

  private createRetryConfig(options: {
    maxRetries?: number;
    baseDelay?: number;
    maxDelay?: number;
    timeout?: number;
    operationName?: string;
    backoffMultiplier?: number;
    signal?: AbortSignal;
  }) {
    return {
      maxRetries: options.maxRetries || 3,
      baseDelay: options.baseDelay || 1000,
      maxDelay: options.maxDelay || 10000,
      timeout: options.timeout || this.config.defaultTimeout!,
      operationName: options.operationName || 'retry operation',
      backoffMultiplier: options.backoffMultiplier || 2,
      signal: options.signal
    };
  }

  private calculateRetryDelay(attempt: number, config: ReturnType<typeof this.createRetryConfig>): number {
    return Math.min(
      config.baseDelay * Math.pow(config.backoffMultiplier, attempt),
      config.maxDelay
    );
  }

  private logRetryAttempt(operationName: string, attempt: number, maxRetries: number, delay: number, error: Error | string): void {
    if (this.config.enableLogging) {
      console.warn(`[Timeout] ${operationName} failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms:`, error);
    }
  }
}

/**
 * Timeout utility functions
 */
export const TimeoutUtils = {
  /**
   * Create a promise that resolves after specified time
   */
  sleep: (ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  /**
   * Check if error is a timeout error
   */
  isTimeoutError: (error: Error): boolean => {
    return error.message.includes('timed out') || 
           error.message.includes('timeout') ||
           error.name === 'TimeoutError';
  },

  /**
   * Get timeout duration from environment or default
   */
  getTimeoutFromEnv: (envVar: string, defaultValue: number): number => {
    const value = process.env[envVar];
    if (!value) return defaultValue;
    
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
  },

  /**
   * Create abort controller with timeout
   */
  createAbortController: (timeoutMs: number): AbortController => {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), timeoutMs);
    return controller;
  }
};

/**
 * Global timeout manager instance
 */
export const timeoutManager = TimeoutManager.getInstance(); 