import mitt from 'mitt';
import { logWithTimestampToFile } from './server-logger';

export interface QueuedRequest {
  id: string;
  service: string;
  execute: () => Promise<unknown>;
  resolve: (value: unknown) => void;
  reject: (error: unknown) => void;
  timestamp: number;
  signature?: string;
}

export const queueEventEmitter = mitt<{ queueStats: Record<string, { length: number; processing: boolean; activeSignatures: number }> }>();

class RequestQueue {
  private queues: Map<string, QueuedRequest[]> = new Map();
  private processing: Map<string, boolean> = new Map();
  private requestIdCounter = 0;
  private activeRequests: Set<string> = new Set();
  private rateLimiter: { waitForRateLimit: (service: string) => Promise<void>; recordRequest: (service: string) => Promise<void> };
  private currentlyProcessing: Map<string, string> = new Map(); // Track currently processing signature per service

  constructor(rateLimiter: { waitForRateLimit: (service: string) => Promise<void>; recordRequest: (service: string) => Promise<void> }) {
    this.rateLimiter = rateLimiter;
  }

  private generateRequestId(): string {
    return `req_${++this.requestIdCounter}_${Date.now()}`;
  }

  /**
   * Enqueue a request. If a duplicate signature is detected, returns { status: 'already_queued', signature }.
   * The signature (requestKey) must be provided explicitly by the route.
   */
  async enqueue(service: string, execute: () => Promise<unknown>, requestKey: string): Promise<unknown> {
    logWithTimestampToFile('log', `[RequestQueue] enqueue called with requestKey=${requestKey}`);
    if (requestKey !== undefined && typeof requestKey !== 'string') {
      throw new Error(`[RequestQueue] requestKey must be a string, got: ${typeof requestKey} (${String(requestKey)})`);
    }
    
    const requestId = this.generateRequestId();
    // Use requestKey as the signature; must be provided by the route
    const signature = requestKey;
    
    if (this.activeRequests.has(signature)) {
      return { status: 'already_queued', signature };
    }
    
    return new Promise<unknown>((resolve, reject) => {
      const queuedRequest: QueuedRequest = {
        id: requestId,
        service,
        execute,
        resolve,
        reject,
        timestamp: Date.now(),
        signature
      };

      // Initialize queue for service if it doesn't exist
      if (!this.queues.has(service)) {
        logWithTimestampToFile('log', `[RequestQueue] Initializing new queue for service: ${service}`);
        this.queues.set(service, []);
        this.processing.set(service, false);
      }

      const queue = this.queues.get(service)!;
      queue.push(queuedRequest);
      
      // Mark this signature as active
      this.activeRequests.add(signature);
      
      // Start processing if not already processing
      if (!this.processing.get(service)) {
        this.processQueue(service);
      }
    });
  }

  private async processQueue(service: string): Promise<void> {
    logWithTimestampToFile('log', `[RequestQueue] processQueue called for ${service}`);
    
    if (this.processing.get(service)) {
      logWithTimestampToFile('log', `[RequestQueue] Already processing queue for ${service}, skipping`);
      return; // Already processing
    }

    logWithTimestampToFile('log', `[RequestQueue] Setting processing flag to true for ${service}`);
    this.processing.set(service, true);
    const queue = this.queues.get(service)!;

    logWithTimestampToFile('log', `[RequestQueue] Starting to process queue for ${service}. Queue length: ${queue.length}`);

    while (queue.length > 0) {
      const request = queue.shift()!;
      logWithTimestampToFile('log', `[RequestQueue] Processing next request in queue for ${service}. Remaining in queue: ${queue.length}`);
      
      // Mark this request as currently processing
      if (request.signature) {
        this.currentlyProcessing.set(service, request.signature);
        logWithTimestampToFile('log', `[RequestQueue] Marked ${request.signature} as currently processing for ${service}`);
      }
      
      try {
        // Apply rate limiting delay before executing the request
        logWithTimestampToFile('log', `[RequestQueue] Applying rate limit delay for ${service} before request ${request.id}`);
        await this.rateLimiter.waitForRateLimit(service);
        const result = await request.execute();
        
        // Record the request in the rate limiter
        await this.rateLimiter.recordRequest(service);
        
        request.resolve(result);
        logWithTimestampToFile('log', `[RequestQueue] Completed request ${request.id} for ${service}`);
      } catch (error) {
        logWithTimestampToFile('error', `[RequestQueue] Failed request ${request.id} for ${service}:`, error);
        request.reject(error);
      } finally {
        // Remove the signature from active requests and currently processing
        if (request.signature) {
          this.activeRequests.delete(request.signature);
          this.currentlyProcessing.delete(service);
        }
      }
    }

    this.processing.set(service, false);
  }

  clearQueue(service: string): void {
    this.queues.set(service, []);
    this.processing.set(service, false);
  }
}

export default RequestQueue; 