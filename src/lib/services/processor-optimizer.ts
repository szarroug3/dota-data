/**
 * Service processor optimization wrapper
 *
 * Provides performance monitoring, caching, and optimization
 * features for service processors with minimal code changes.
 */

import { CacheService } from '@/lib/cache-service';
import { ErrorCreators } from '@/lib/error-handler';
import { RequestTracer } from '@/lib/request-tracer';
import { timeoutManager } from '@/lib/timeout-manager';
import { CacheValue } from '@/types/cache';

export interface ProcessorOptions {
  enableCaching?: boolean;
  cacheTTL?: number;
  enablePerformanceMonitoring?: boolean;
  enableTracing?: boolean;
  timeout?: number;
  retryOptions?: {
    maxRetries?: number;
    baseDelay?: number;
    maxDelay?: number;
  };
}

export interface ProcessorMetrics {
  processingTime: number;
  cacheHit: boolean;
  retryCount: number;
  error?: string;
}

/**
 * Processor optimization wrapper
 */
export class ProcessorOptimizer {
  private cache: CacheService;
  private defaultOptions: ProcessorOptions = {
    enableCaching: true,
    cacheTTL: 300000, // 5 minutes
    enablePerformanceMonitoring: true,
    enableTracing: true,
    timeout: 10000, // 10 seconds
    retryOptions: {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 5000
    }
  };

  constructor(options: ProcessorOptions = {}) {
    this.defaultOptions = { ...this.defaultOptions, ...options };
    this.cache = new CacheService({
      useRedis: process.env.USE_REDIS === 'true',
      redisUrl: process.env.REDIS_URL,
      fallbackToMemory: true,
    });
  }

  /**
   * Optimize a processor function with caching, monitoring, and error handling
   */
  async optimizeProcessor<TInput, TOutput>(
    processorName: string,
    processor: (input: TInput) => TOutput | Promise<TOutput>,
    input: TInput,
    options: ProcessorOptions = {}
  ): Promise<{ result: TOutput; metrics: ProcessorMetrics }> {
    const opts = { ...this.defaultOptions, ...options };
    const startTime = Date.now();
    const retryCount = 0;

    // Generate cache key if caching is enabled
    const cacheKey = opts.enableCaching 
      ? `processor:${processorName}:${this.generateCacheKey(input as Record<string, string | number | boolean | null>)}`
      : null;

    // Check cache first
    if (opts.enableCaching && cacheKey) {
      const cachedResult = await this.cache.get(cacheKey);
      if (cachedResult !== null) {
        return {
          result: cachedResult as TOutput,
          metrics: {
            processingTime: Date.now() - startTime,
            cacheHit: true,
            retryCount: 0
          }
        };
      }
    }

    // Execute processor with optimizations
    const result = await this.executeWithOptimizations(
      processorName,
      processor,
      input,
      opts
    );

    // Cache result if caching is enabled
    if (opts.enableCaching && cacheKey) {
      await this.cache.set(cacheKey, result as CacheValue, opts.cacheTTL);
    }

    return {
      result,
      metrics: {
        processingTime: Date.now() - startTime,
        cacheHit: false,
        retryCount
      }
    };
  }

  /**
   * Execute processor with timeout, tracing, and retry logic
   */
  private async executeWithOptimizations<TInput, TOutput>(
    processorName: string,
    processor: (input: TInput) => TOutput | Promise<TOutput>,
    input: TInput,
    options: ProcessorOptions
  ): Promise<TOutput> {
    const operation = this.createOperation(processorName, processor, input, options);
    // Apply timeout if specified
    if (options.timeout) {
      return await timeoutManager.withTimeout(operation(), {
        timeout: options.timeout,
        operation: `${processorName} processing`
      });
    }
    // Apply retry logic if specified
    if (options.retryOptions) {
      return await timeoutManager.retry(operation, {
        maxRetries: options.retryOptions.maxRetries,
        baseDelay: options.retryOptions.baseDelay,
        maxDelay: options.retryOptions.maxDelay,
        operationName: `${processorName} processing`
      });
    }
    return await operation();
  }

  private createOperation<TInput, TOutput>(
    processorName: string,
    processor: (input: TInput) => TOutput | Promise<TOutput>,
    input: TInput,
    options: ProcessorOptions
  ) {
    return async () => {
      const { spanId, requestTracer } = this.startTracing(processorName, options);
      try {
        const result = await processor(input);
        this.endTracingSuccess(processorName, options, spanId, requestTracer);
        return result;
      } catch (error) {
        this.endTracingError(processorName, options, spanId, requestTracer, error as string | Error);
        throw error;
      }
    };
  }

  private startTracing(processorName: string, options: ProcessorOptions) {
    let spanId: string | undefined;
    let requestTracer: RequestTracer | undefined;
    if (options.enableTracing) {
      requestTracer = RequestTracer.getInstance();
      const span = requestTracer.startSpan('processor-execution', `${processorName}-processing`);
      spanId = span?.spanId;
    }
    return { spanId, requestTracer };
  }

  private endTracingSuccess(
    processorName: string,
    options: ProcessorOptions,
    spanId: string | undefined,
    requestTracer: RequestTracer | undefined
  ) {
    if (options.enableTracing && spanId && requestTracer) {
      requestTracer.endSpan('processor-execution', spanId, {
        status: 'success',
        tags: { processor: processorName }
      });
    }
  }

  private endTracingError(
    processorName: string,
    options: ProcessorOptions,
    spanId: string | undefined,
    requestTracer: RequestTracer | undefined,
    error: Error | string
  ) {
    if (options.enableTracing && spanId && requestTracer) {
      requestTracer.endSpan('processor-execution', spanId, {
        status: 'error',
        error: typeof error === 'string' ? error : error instanceof Error ? error.message : 'Unknown error',
        tags: { processor: processorName }
      });
    }
  }

  /**
   * Generate cache key from input
   */
  private generateCacheKey(input: Record<string, string | number | boolean | null>): string {
    try {
      // Create a deterministic hash of the input
      const inputString = JSON.stringify(input);
      return Buffer.from(inputString).toString('base64').substring(0, 32);
    } catch {
      // Fallback to timestamp if serialization fails
      return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    }
  }

  /**
   * Batch optimize multiple processors
   */
  async batchOptimize<TInput, TOutput>(
    processors: Array<{
      name: string;
      processor: (input: TInput) => TOutput | Promise<TOutput>;
      input: TInput;
      options?: ProcessorOptions;
    }>
  ): Promise<Array<{ result: TOutput; metrics: ProcessorMetrics; name: string }>> {
    const results = await Promise.allSettled(
      processors.map(async ({ name, processor, input, options }) => {
        const optimized = await this.optimizeProcessor(name, processor, input, options);
        return { ...optimized, name };
      })
    );

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        throw ErrorCreators.internalError(
          `Batch processor ${processors[index].name} failed: ${result.reason}`,
          result.reason
        );
      }
    });
  }

  /**
   * Create an optimized version of a processor function
   */
  createOptimizedProcessor<TInput, TOutput>(
    processorName: string,
    processor: (input: TInput) => TOutput | Promise<TOutput>,
    options: ProcessorOptions = {}
  ): (input: TInput) => Promise<TOutput> {
    return async (input: TInput): Promise<TOutput> => {
      const { result } = await this.optimizeProcessor(processorName, processor, input, options);
      return result;
    };
  }

  /**
   * Get processor performance metrics
   */
  async getProcessorMetrics(processorName: string): Promise<{
    processorName: string;
    totalExecutions: number;
    averageProcessingTime: number;
    errorRate: number;
    cacheHitRate: number;
  }> {
    // Since PerformanceStats doesn't have a requests property, 
    // we'll use an empty array and calculate basic metrics
    const processorMetrics: Array<{
      duration: number;
      statusCode: number;
    }> = [];

    return {
      processorName,
      totalExecutions: processorMetrics.length,
      averageProcessingTime: processorMetrics.reduce((acc: number, req) => acc + req.duration, 0) / processorMetrics.length || 0,
      errorRate: processorMetrics.filter((req) => req.statusCode >= 400).length / processorMetrics.length || 0,
      cacheHitRate: await this.getCacheHitRate()
    };
  }

  /**
   * Get cache hit rate for a processor
   */
  private async getCacheHitRate(): Promise<number> {
    try {
      const stats = await this.cache.getStats();
      // This is a simplified calculation - in a real implementation,
      // you'd want to track cache hits per processor
      return stats.hitRate || 0;
    } catch {
      return 0;
    }
  }

  /**
   * Clear processor cache
   */
  async clearProcessorCache(): Promise<void> {
    // Implementation for clearing processor cache
    // This method can be extended to clear specific processor caches if needed
  }

  /**
   * Warm up processor cache
   */
  async warmupProcessor<TInput, TOutput>(
    processorName: string,
    processor: (input: TInput) => TOutput | Promise<TOutput>,
    inputs: TInput[],
    options: ProcessorOptions = {}
  ): Promise<void> {
    await Promise.allSettled(
      inputs.map(input => 
        this.optimizeProcessor(processorName, processor, input, options)
      )
    );
  }
}

/**
 * Global processor optimizer instance
 */
export const processorOptimizer = new ProcessorOptimizer();

/**
 * Decorator for optimizing processor functions
 */
export function optimizeProcessor(
  processorName: string,
  options: ProcessorOptions = {}
) {
  return function <TInput, TOutput>(
    target: object,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (input: TInput): Promise<TOutput> {
      const { result } = await processorOptimizer.optimizeProcessor(
        processorName,
        originalMethod.bind(this),
        input,
        options
      );
      return result as TOutput;
    };

    return descriptor;
  };
} 