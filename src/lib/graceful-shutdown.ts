/**
 * Graceful shutdown handler
 *
 * Provides graceful shutdown capabilities for production deployments
 * with proper cleanup of resources and in-flight requests.
 */

import { CacheService } from './cache-service';
import { RequestQueue } from './request-queue';
import { RequestTracer } from './request-tracer';

export interface ShutdownConfig {
  gracefulTimeout?: number;
  forceTimeout?: number;
  enableLogging?: boolean;
  cleanupCallbacks?: (() => Promise<void>)[];
}

export interface ShutdownStatus {
  isShuttingDown: boolean;
  startTime?: number;
  reason?: string;
  activeRequests: number;
  cleanupCompleted: boolean;
}

/**
 * Graceful shutdown manager
 */
export class GracefulShutdown {
  private static instance: GracefulShutdown;
  private config: ShutdownConfig;
  private status: ShutdownStatus = {
    isShuttingDown: false,
    activeRequests: 0,
    cleanupCompleted: false
  };
  private activeRequests: Set<string> = new Set();
  private shutdownPromise: Promise<void> | null = null;
  private cleanupCallbacks: (() => Promise<void>)[] = [];
  private forceTimeoutId?: NodeJS.Timeout;

  private constructor(config: ShutdownConfig = {}) {
    this.config = {
      gracefulTimeout: 30000, // 30 seconds
      forceTimeout: 60000,    // 60 seconds
      enableLogging: true,
      cleanupCallbacks: [],
      ...config
    };
    this.cleanupCallbacks = [...(this.config.cleanupCallbacks || [])];
    this.setupSignalHandlers();
  }

  /**
   * Cleanup resources and clear timers
   */
  cleanup(): void {
    if (this.forceTimeoutId) {
      clearTimeout(this.forceTimeoutId);
      this.forceTimeoutId = undefined;
    }
    this.activeRequests.clear();
    this.cleanupCallbacks = [];
  }

  static getInstance(config?: ShutdownConfig): GracefulShutdown {
    if (!GracefulShutdown.instance) {
      GracefulShutdown.instance = new GracefulShutdown(config);
    }
    return GracefulShutdown.instance;
  }

  /**
   * Register a request as active
   */
  registerRequest(requestId: string): void {
    if (this.status.isShuttingDown) {
      throw new Error('Server is shutting down, cannot accept new requests');
    }

    this.activeRequests.add(requestId);
    this.status.activeRequests = this.activeRequests.size;

    if (this.config.enableLogging) {
      console.log(`[Shutdown] Registered request ${requestId} (active: ${this.status.activeRequests})`);
    }
  }

  /**
   * Unregister a request as completed
   */
  unregisterRequest(requestId: string): void {
    this.activeRequests.delete(requestId);
    this.status.activeRequests = this.activeRequests.size;

    if (this.config.enableLogging) {
      console.log(`[Shutdown] Unregistered request ${requestId} (active: ${this.status.activeRequests})`);
    }
  }

  /**
   * Check if server is shutting down
   */
  isShuttingDown(): boolean {
    return this.status.isShuttingDown;
  }

  /**
   * Get current shutdown status
   */
  getStatus(): ShutdownStatus {
    return { ...this.status };
  }

  /**
   * Add cleanup callback
   */
  addCleanupCallback(callback: () => Promise<void>): void {
    this.cleanupCallbacks.push(callback);
  }

  /**
   * Initiate graceful shutdown
   */
  async shutdown(reason: string = 'Manual shutdown'): Promise<void> {
    if (this.status.isShuttingDown) {
      return this.shutdownPromise!;
    }

    this.status.isShuttingDown = true;
    this.status.startTime = Date.now();
    this.status.reason = reason;

    if (this.config.enableLogging) {
      console.log(`[Shutdown] Initiating graceful shutdown: ${reason}`);
      console.log(`[Shutdown] Active requests: ${this.status.activeRequests}`);
    }

    this.shutdownPromise = this.performShutdown();
    return this.shutdownPromise;
  }

  /**
   * Perform the actual shutdown process
   */
  private async performShutdown(): Promise<void> {
    const startTime = Date.now();

    try {
      // Phase 1: Stop accepting new requests (already done by setting isShuttingDown)
      if (this.config.enableLogging) {
        console.log('[Shutdown] Phase 1: Stopped accepting new requests');
      }

      // Phase 2: Wait for active requests to complete
      if (this.config.enableLogging) {
        console.log(`[Shutdown] Phase 2: Waiting for ${this.status.activeRequests} active requests to complete`);
      }

      await this.waitForActiveRequests();

      // Phase 3: Run cleanup callbacks
      if (this.config.enableLogging) {
        console.log(`[Shutdown] Phase 3: Running ${this.cleanupCallbacks.length} cleanup callbacks`);
      }

      await this.runCleanupCallbacks();

      // Phase 4: Cleanup core services
      if (this.config.enableLogging) {
        console.log('[Shutdown] Phase 4: Cleaning up core services');
      }

      await this.cleanupCoreServices();

      this.status.cleanupCompleted = true;
      const duration = Date.now() - startTime;

      if (this.config.enableLogging) {
        console.log(`[Shutdown] Graceful shutdown completed in ${duration}ms`);
      }

    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`[Shutdown] Graceful shutdown failed after ${duration}ms:`, error);
      throw error;
    }
  }

  /**
   * Wait for active requests to complete
   */
  private async waitForActiveRequests(): Promise<void> {
    const startTime = Date.now();
    const timeout = this.config.gracefulTimeout!;

    while (this.status.activeRequests > 0) {
      const elapsed = Date.now() - startTime;
      
      if (elapsed >= timeout) {
        console.warn(`[Shutdown] Timeout waiting for requests (${this.status.activeRequests} still active)`);
        break;
      }

      // Wait a bit before checking again
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    if (this.status.activeRequests === 0) {
      console.log('[Shutdown] All active requests completed');
    }
  }

  /**
   * Run cleanup callbacks
   */
  private async runCleanupCallbacks(): Promise<void> {
    const results = await Promise.allSettled(
      this.cleanupCallbacks.map(async (callback, index) => {
        try {
          await callback();
          if (this.config.enableLogging) {
            console.log(`[Shutdown] Cleanup callback ${index + 1} completed`);
          }
        } catch (error) {
          console.error(`[Shutdown] Cleanup callback ${index + 1} failed:`, error);
          throw error;
        }
      })
    );

    const failed = results.filter(result => result.status === 'rejected');
    if (failed.length > 0) {
      console.error(`[Shutdown] ${failed.length} cleanup callbacks failed`);
    }
  }

  /**
   * Cleanup core services
   */
  private async cleanupCoreServices(): Promise<void> {
    const cleanupTasks = [];

    // Cleanup request tracer
    try {
      RequestTracer.getInstance();
      // Request tracer cleanup is handled by its internal interval
      if (this.config.enableLogging) {
        console.log('[Shutdown] Request tracer cleanup initiated');
      }
    } catch (error) {
      console.error('[Shutdown] Request tracer cleanup failed:', error);
    }

    // Cleanup cache service
    cleanupTasks.push(
      (async () => {
        try {
          const cache = new CacheService({
            useRedis: process.env.USE_REDIS === 'true',
            redisUrl: process.env.REDIS_URL,
            fallbackToMemory: true,
          });
          await cache.disconnect();
          if (this.config.enableLogging) {
            console.log('[Shutdown] Cache service disconnected');
          }
        } catch (error) {
          console.error('[Shutdown] Cache service cleanup failed:', error);
        }
      })()
    );

    // Cleanup request queue
    cleanupTasks.push(
      (async () => {
        try {
          const queue = new RequestQueue({
            useQStash: process.env.USE_QSTASH === 'true',
            qstashToken: process.env.QSTASH_TOKEN,
            qstashCurrentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY,
            qstashNextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY,
            fallbackToMemory: true,
            defaultTimeout: 30000,
            maxRetries: 3,
            baseDelay: 1000
          });
          await queue.disconnect();
          if (this.config.enableLogging) {
            console.log('[Shutdown] Request queue disconnected');
          }
        } catch (error) {
          console.error('[Shutdown] Request queue cleanup failed:', error);
        }
      })()
    );

    await Promise.allSettled(cleanupTasks);
  }

  /**
   * Setup signal handlers for graceful shutdown
   */
  private setupSignalHandlers(): void {
    // Handle SIGTERM (Docker, Kubernetes)
    process.on('SIGTERM', async () => {
      console.log('[Shutdown] Received SIGTERM signal');
      try {
        await this.shutdown('SIGTERM signal received');
        process.exit(0);
      } catch (error) {
        console.error('[Shutdown] Graceful shutdown failed:', error);
        process.exit(1);
      }
    });

    // Handle SIGINT (Ctrl+C)
    process.on('SIGINT', async () => {
      console.log('[Shutdown] Received SIGINT signal');
      try {
        await this.shutdown('SIGINT signal received');
        process.exit(0);
      } catch (error) {
        console.error('[Shutdown] Graceful shutdown failed:', error);
        process.exit(1);
      }
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', async (error) => {
      console.error('[Shutdown] Uncaught exception:', error);
      try {
        await this.shutdown('Uncaught exception');
        process.exit(1);
      } catch (shutdownError) {
        console.error('[Shutdown] Graceful shutdown failed:', shutdownError);
        process.exit(1);
      }
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', async (reason, promise) => {
      console.error('[Shutdown] Unhandled promise rejection:', reason, 'at:', promise);
      try {
        await this.shutdown('Unhandled promise rejection');
        process.exit(1);
      } catch (shutdownError) {
        console.error('[Shutdown] Graceful shutdown failed:', shutdownError);
        process.exit(1);
      }
    });

    // Force shutdown after timeout
    this.forceTimeoutId = setTimeout(() => {
      if (this.status.isShuttingDown && !this.status.cleanupCompleted) {
        console.error('[Shutdown] Force shutdown timeout reached');
        process.exit(1);
      }
    }, this.config.forceTimeout!);
  }
}

/**
 * Middleware for request tracking
 */
export function withGracefulShutdown(handler: (req: Request, res: Response) => Promise<Response>) {
  return async (req: Request, res: Response) => {
    const shutdown = GracefulShutdown.getInstance();
    
    if (shutdown.isShuttingDown()) {
      return new Response('Server is shutting down', { status: 503 });
    }

    const requestId = req.headers.get('x-request-id') || `req-${Date.now()}`;
    
    try {
      shutdown.registerRequest(requestId);
      return await handler(req, res);
    } finally {
      shutdown.unregisterRequest(requestId);
    }
  };
}

/**
 * Global graceful shutdown instance
 */
export const gracefulShutdown = GracefulShutdown.getInstance(); 