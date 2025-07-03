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
    const requestId = `req_${++this.requestIdCounter}_${Date.now()}`;
    logWithTimestampToFile('log', `[RequestQueue] Generated request ID: ${requestId} (counter: ${this.requestIdCounter})`);
    return requestId;
  }

  // Emit queue stats event
  private emitQueueStats() {
    queueEventEmitter.emit('queueStats', this.getQueueStats());
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
    logWithTimestampToFile('log', `[RequestQueue] enqueue called for service: ${service}, requestKey: ${requestKey || 'none'}`);
    
    const requestId = this.generateRequestId();
    // Use requestKey as the signature; must be provided by the route
    const signature = requestKey;
    
    logWithTimestampToFile('log', `[RequestQueue] Generated signature: ${signature} for request ${requestId}`);
    
    if (this.activeRequests.has(signature)) {
      logWithTimestampToFile('warn', `[RequestQueue] Duplicate request detected for signature: ${signature}. Request ID: ${requestId}. Skipping.`);
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
      const wasProcessing = this.processing.get(service) || false;
      queue.push(queuedRequest);
      
      // Mark this signature as active
      this.activeRequests.add(signature);
      
      logWithTimestampToFile('log', `[RequestQueue] Enqueued request ${requestId} for ${service}. Queue length: ${queue.length}. Signature: ${signature}. Was processing: ${wasProcessing}`);
      
      // Log current queue stats for all services
      const allQueueStats = this.getQueueStats();
      logWithTimestampToFile('log', `[RequestQueue] Current queue stats after enqueue:`, allQueueStats);
      
      // Start processing if not already processing
      if (!this.processing.get(service)) {
        logWithTimestampToFile('log', `[RequestQueue] Starting queue processing for ${service}`);
        this.processQueue(service);
      } else {
        logWithTimestampToFile('log', `[RequestQueue] Queue already processing for ${service}, request ${requestId} will be processed when current request completes`);
      }
      this.emitQueueStats(); // Emit after enqueue
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
      
      // Log current queue stats for all services
      const allQueueStats = this.getQueueStats();
      logWithTimestampToFile('log', `[RequestQueue] Current queue stats during processing:`, allQueueStats);
      
      try {
        // Apply rate limiting delay before executing the request
        logWithTimestampToFile('log', `[RequestQueue] Applying rate limit delay for ${service} before request ${request.id}`);
        await this.rateLimiter.waitForRateLimit(service);
        logWithTimestampToFile('log', `[RequestQueue] Rate limit delay completed for ${service}, executing request ${request.id}`);
        
        logWithTimestampToFile('log', `[RequestQueue] Processing request ${request.id} for ${service}. Signature: ${request.signature}`);
        logWithTimestampToFile('log', `[RequestQueue] About to execute request ${request.id} for ${service}`);
        logWithTimestampToFile('log', `[RequestQueue] Calling request.execute() for ${request.id}`);
        const result = await request.execute();
        logWithTimestampToFile('log', `[RequestQueue] Request ${request.id} executed successfully, resolving`);
        
        // Record the request in the rate limiter
        await this.rateLimiter.recordRequest(service);
        logWithTimestampToFile('log', `[RequestQueue] Recorded request ${request.id} in rate limiter for ${service}`);
        
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
          logWithTimestampToFile('log', `[RequestQueue] Removed signature ${request.signature} from active requests and currently processing`);
        }
        this.emitQueueStats(); // Emit after processing each request
      }
    }

    logWithTimestampToFile('log', `[RequestQueue] Queue empty for ${service}, setting processing flag to false`);
    this.processing.set(service, false);
    logWithTimestampToFile('log', `[RequestQueue] Finished processing queue for ${service}`);
    this.emitQueueStats(); // Emit when queue is empty
  }

  getQueueStats(): Record<string, { length: number; processing: boolean; activeSignatures: number; activeSignaturesList: string[]; currentlyProcessing?: string }> {
    logWithTimestampToFile('log', '[RequestQueue] getQueueStats called');
    const stats: Record<string, { length: number; processing: boolean; activeSignatures: number; activeSignaturesList: string[]; currentlyProcessing?: string }> = {};
    
    logWithTimestampToFile('log', `[RequestQueue] queue=${JSON.stringify(this.queues, null, 2)}`)
    for (const [service, queue] of this.queues) {
      const processing = this.processing.get(service) || false;
      const currentlyProcessing = this.currentlyProcessing.get(service);
      // Only include signatures for requests in this service's queue
      const serviceSignatures = queue.map(req => req.signature).filter(Boolean) as string[];
      const activeSignatures = serviceSignatures.length;
      logWithTimestampToFile('log', `[RequestQueue] Service: ${service}`);
      logWithTimestampToFile('log', `[RequestQueue]   Queue length: ${queue.length}`);
      logWithTimestampToFile('log', `[RequestQueue]   Processing: ${processing}`);
      logWithTimestampToFile('log', `[RequestQueue]   Currently processing: ${currentlyProcessing || 'none'}`);
      logWithTimestampToFile('log', `[RequestQueue]   Signatures:`, serviceSignatures);
      logWithTimestampToFile('log', `[RequestQueue]   Active signatures count: ${activeSignatures}`);
      stats[service] = {
        length: queue.length,
        processing,
        activeSignatures,
        activeSignaturesList: serviceSignatures,
        currentlyProcessing,
      };
    }
    logWithTimestampToFile('log', '[RequestQueue] getQueueStats final stats:', stats);
    return stats;
  }

  clearQueue(service: string): void {
    logWithTimestampToFile('log', `[RequestQueue] clearQueue called for ${service}`);
    this.queues.set(service, []);
    this.processing.set(service, false);
    logWithTimestampToFile('log', `[RequestQueue] Cleared queue for ${service}`);
    this.emitQueueStats();
  }

  getActiveSignatures(): string[] {
    logWithTimestampToFile('log', '[RequestQueue] getActiveSignatures called');
    const signatures = Array.from(this.activeRequests);
    logWithTimestampToFile('log', '[RequestQueue] getActiveSignatures completed, returning:', signatures);
    return signatures;
  }
}

export default RequestQueue; 