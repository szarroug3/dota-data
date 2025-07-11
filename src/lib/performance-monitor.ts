/**
 * Performance monitoring and metrics collection
 *
 * Provides comprehensive performance tracking for API endpoints including:
 * - Request timing and duration measurement
 * - Memory usage monitoring
 * - Error rate tracking
 * - Throughput metrics
 * - Performance logging with context
 */

export interface PerformanceMetrics {
  requestId: string;
  endpoint: string;
  method: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  memoryUsage?: NodeJS.MemoryUsage;
  statusCode?: number;
  error?: string;
  cacheHit?: boolean;
  rateLimited?: boolean;
  userAgent?: string;
  ipAddress?: string;
}

export interface PerformanceStats {
  totalRequests: number;
  averageResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  errorRate: number;
  throughput: number; // requests per second
  memoryUsage: {
    current: NodeJS.MemoryUsage;
    peak: NodeJS.MemoryUsage;
  };
  cacheHitRate: number;
  rateLimitHitRate: number;
  startTime: number;
  lastUpdated: number;
}

export interface PerformanceConfig {
  enableDetailedLogging?: boolean;
  enableMemoryTracking?: boolean;
  enableThroughputTracking?: boolean;
  logSlowRequests?: boolean;
  slowRequestThreshold?: number; // milliseconds
  maxMetricsHistory?: number;
  enableRequestIdGeneration?: boolean;
}

/**
 * Performance monitoring service
 */
export class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetrics> = new Map();
  private stats: PerformanceStats;
  private config: PerformanceConfig;
  private requestCount = 0;
  private errorCount = 0;
  private cacheHits = 0;
  private rateLimitHits = 0;
  private responseTimes: number[] = [];
  private peakMemory: NodeJS.MemoryUsage;
  private cleanupInterval?: NodeJS.Timeout;

  constructor(config: PerformanceConfig = {}) {
    this.config = {
      enableDetailedLogging: true,
      enableMemoryTracking: true,
      enableThroughputTracking: true,
      logSlowRequests: true,
      slowRequestThreshold: 1000, // 1 second
      maxMetricsHistory: 1000,
      enableRequestIdGeneration: true,
      ...config
    };

    const currentMemory = process.memoryUsage();
    this.peakMemory = { ...currentMemory };
    
    this.stats = {
      totalRequests: 0,
      averageResponseTime: 0,
      minResponseTime: Infinity,
      maxResponseTime: 0,
      errorRate: 0,
      throughput: 0,
      memoryUsage: {
        current: currentMemory,
        peak: { ...currentMemory }
      },
      cacheHitRate: 0,
      rateLimitHitRate: 0,
      startTime: Date.now(),
      lastUpdated: Date.now()
    };

    // Clean up old metrics periodically
    if (this.config.maxMetricsHistory) {
      this.cleanupInterval = setInterval(() => {
        this.cleanupOldMetrics();
      }, 60000); // Clean every minute
    }
  }

  /**
   * Cleanup resources and clear timers
   */
  cleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = undefined;
    }
    this.metrics.clear();
    this.responseTimes = [];
  }

  /**
   * Start performance tracking for a request
   */
  startRequest(endpoint: string, method: string, options: {
    userAgent?: string;
    ipAddress?: string;
    requestId?: string;
  } = {}): string {
    const requestId = options.requestId || this.generateRequestId();
    const startTime = Date.now();
    
    const metrics: PerformanceMetrics = {
      requestId,
      endpoint,
      method,
      startTime,
      userAgent: options.userAgent,
      ipAddress: options.ipAddress
    };

    if (this.config.enableMemoryTracking) {
      metrics.memoryUsage = process.memoryUsage();
    }

    this.metrics.set(requestId, metrics);
    this.requestCount++;

    if (this.config.enableDetailedLogging) {
      console.log(`[Performance] Started request ${requestId} - ${method} ${endpoint}`);
    }

    return requestId;
  }

  /**
   * End performance tracking for a request
   */
  endRequest(requestId: string, statusCode: number, options: {
    error?: string;
    cacheHit?: boolean;
    rateLimited?: boolean;
  } = {}): PerformanceMetrics | null {
    const metrics = this.metrics.get(requestId);
    if (!metrics) {
      console.warn(`[Performance] Request ${requestId} not found for ending`);
      return null;
    }

    const endTime = Date.now();
    const duration = endTime - metrics.startTime;

    // Update metrics
    metrics.endTime = endTime;
    metrics.duration = duration;
    metrics.statusCode = statusCode;
    metrics.error = options.error;
    metrics.cacheHit = options.cacheHit;
    metrics.rateLimited = options.rateLimited;

    // Update statistics
    this.updateStats(metrics);

    // Log performance details
    if (this.config.enableDetailedLogging) {
      this.logRequestCompletion(metrics);
    }

    // Check for slow requests
    if (this.config.logSlowRequests && duration > (this.config.slowRequestThreshold || 1000)) {
      this.logSlowRequest(metrics);
    }

    return metrics;
  }

  /**
   * Get current performance statistics
   */
  getStats(): PerformanceStats {
    this.updateCurrentStats();
    return { ...this.stats };
  }

  /**
   * Get metrics for a specific request
   */
  getRequestMetrics(requestId: string): PerformanceMetrics | null {
    return this.metrics.get(requestId) || null;
  }

  /**
   * Get recent metrics
   */
  getRecentMetrics(limit: number = 100): PerformanceMetrics[] {
    const allMetrics = Array.from(this.metrics.values());
    return allMetrics
      .filter(m => m.endTime !== undefined)
      .sort((a, b) => (b.endTime || 0) - (a.endTime || 0))
      .slice(0, limit);
  }

  /**
   * Clear all metrics and reset statistics
   */
  reset(): void {
    this.metrics.clear();
    this.requestCount = 0;
    this.errorCount = 0;
    this.cacheHits = 0;
    this.rateLimitHits = 0;
    this.responseTimes = [];
    
    const currentMemory = process.memoryUsage();
    this.peakMemory = { ...currentMemory };
    
    this.stats = {
      totalRequests: 0,
      averageResponseTime: 0,
      minResponseTime: Infinity,
      maxResponseTime: 0,
      errorRate: 0,
      throughput: 0,
      memoryUsage: {
        current: currentMemory,
        peak: { ...currentMemory }
      },
      cacheHitRate: 0,
      rateLimitHitRate: 0,
      startTime: Date.now(),
      lastUpdated: Date.now()
    };
  }

  /**
   * Generate a unique request ID
   */
  private generateRequestId(): string {
    if (!this.config.enableRequestIdGeneration) {
      return `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    
    return `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Update performance statistics
   */
  private updateStats(metrics: PerformanceMetrics): void {
    if (!metrics.duration) return;

    this.stats.totalRequests++;
    this.responseTimes.push(metrics.duration);

    // Update response time statistics
    this.stats.minResponseTime = Math.min(this.stats.minResponseTime, metrics.duration);
    this.stats.maxResponseTime = Math.max(this.stats.maxResponseTime, metrics.duration);
    this.stats.averageResponseTime = this.responseTimes.reduce((sum, time) => sum + time, 0) / this.responseTimes.length;

    // Update error rate
    if (metrics.error || (metrics.statusCode && metrics.statusCode >= 400)) {
      this.errorCount++;
    }
    this.stats.errorRate = this.errorCount / this.stats.totalRequests;

    // Update cache hit rate
    if (metrics.cacheHit) {
      this.cacheHits++;
    }
    this.stats.cacheHitRate = this.cacheHits / this.stats.totalRequests;

    // Update rate limit hit rate
    if (metrics.rateLimited) {
      this.rateLimitHits++;
    }
    this.stats.rateLimitHitRate = this.rateLimitHits / this.stats.totalRequests;

    // Update memory usage
    if (this.config.enableMemoryTracking) {
      const currentMemory = process.memoryUsage();
      this.stats.memoryUsage.current = currentMemory;
      
      // Track peak memory usage
      if (currentMemory.heapUsed > this.peakMemory.heapUsed) {
        this.peakMemory = { ...currentMemory };
        this.stats.memoryUsage.peak = { ...currentMemory };
      }
    }

    // Update throughput
    if (this.config.enableThroughputTracking) {
      const elapsedSeconds = (Date.now() - this.stats.startTime) / 1000;
      this.stats.throughput = this.stats.totalRequests / elapsedSeconds;
    }

    this.stats.lastUpdated = Date.now();
  }

  /**
   * Update current statistics without new metrics
   */
  private updateCurrentStats(): void {
    if (this.config.enableMemoryTracking) {
      this.stats.memoryUsage.current = process.memoryUsage();
    }

    if (this.config.enableThroughputTracking) {
      const elapsedSeconds = (Date.now() - this.stats.startTime) / 1000;
      this.stats.throughput = this.stats.totalRequests / elapsedSeconds;
    }

    this.stats.lastUpdated = Date.now();
  }

  /**
   * Log request completion details
   */
  private logRequestCompletion(metrics: PerformanceMetrics): void {
    const status = metrics.statusCode || 0;
    const duration = metrics.duration || 0;
    const cacheStatus = metrics.cacheHit ? 'HIT' : 'MISS';
    const rateLimitStatus = metrics.rateLimited ? 'LIMITED' : 'OK';
    
    console.log(`[Performance] Completed ${metrics.requestId} - ${metrics.method} ${metrics.endpoint} - ${status} - ${duration}ms - Cache: ${cacheStatus} - Rate: ${rateLimitStatus}`);
    
    if (metrics.error) {
      console.log(`[Performance] Error: ${metrics.error}`);
    }

    if (this.config.enableMemoryTracking && metrics.memoryUsage) {
      const memMB = Math.round(metrics.memoryUsage.heapUsed / 1024 / 1024);
      console.log(`[Performance] Memory: ${memMB}MB heap used`);
    }
  }

  /**
   * Log slow request details
   */
  private logSlowRequest(metrics: PerformanceMetrics): void {
    const duration = metrics.duration || 0;
    const threshold = this.config.slowRequestThreshold || 1000;
    
    console.warn(`[Performance] SLOW REQUEST: ${metrics.requestId} - ${metrics.method} ${metrics.endpoint} - ${duration}ms (threshold: ${threshold}ms)`);
    
    if (metrics.memoryUsage) {
      const memMB = Math.round(metrics.memoryUsage.heapUsed / 1024 / 1024);
      console.warn(`[Performance] Memory at request: ${memMB}MB heap used`);
    }
  }

  /**
   * Clean up old metrics to prevent memory leaks
   */
  private cleanupOldMetrics(): void {
    if (!this.config.maxMetricsHistory) return;

    const allMetrics = Array.from(this.metrics.entries());
    if (allMetrics.length <= this.config.maxMetricsHistory) return;

    // Sort by start time and keep only the most recent
    const sortedMetrics = allMetrics.sort((a, b) => b[1].startTime - a[1].startTime);
    const toKeep = sortedMetrics.slice(0, this.config.maxMetricsHistory);
    
    this.metrics.clear();
    toKeep.forEach(([id, metrics]) => {
      this.metrics.set(id, metrics);
    });

    console.log(`[Performance] Cleaned up old metrics, kept ${toKeep.length} recent entries`);
  }
}

/**
 * Global performance monitor instance
 */
export const performanceMonitor = new PerformanceMonitor();

/**
 * Static cleanup method for the global instance
 */
export function cleanupPerformanceMonitor(): void {
  performanceMonitor.cleanup();
}

/**
 * Utility function to measure execution time of async operations
 */
export async function measureAsync<T>(
  operation: () => Promise<T>,
  label: string = 'operation'
): Promise<{ result: T; duration: number }> {
  const startTime = Date.now();
  try {
    const result = await operation();
    const duration = Date.now() - startTime;
    console.log(`[Performance] ${label} completed in ${duration}ms`);
    return { result, duration };
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[Performance] ${label} failed after ${duration}ms:`, error);
    throw error;
  }
}

/**
 * Utility function to measure execution time of synchronous operations
 */
export function measureSync<T>(
  operation: () => T,
  label: string = 'operation'
): { result: T; duration: number } {
  const startTime = Date.now();
  try {
    const result = operation();
    const duration = Date.now() - startTime;
    console.log(`[Performance] ${label} completed in ${duration}ms`);
    return { result, duration };
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[Performance] ${label} failed after ${duration}ms:`, error);
    throw error;
  }
} 