import { logWithTimestamp } from '@/lib/utils';
import { shouldWriteMockData, writeMockData } from '../mock-data-writer';

const BASE_URLS = {
  opendota: "https://api.opendota.com/api",
  stratz: "https://api.stratz.com/api/v1",
  d2pt: "https://dota2protracker.com/api",
  dotabuff: "https://www.dotabuff.com",
};

type ServiceName = keyof typeof BASE_URLS;

/**
 * Utility function to determine which service an endpoint belongs to.
 * Used for routing, caching, and queueing logic.
 * @param endpoint - The endpoint URL or path.
 * @returns The service name (e.g., 'opendota', 'dotabuff').
 */
export function getServiceFromEndpoint(endpoint: string): ServiceName {
  if (endpoint.includes('api.opendota.com') || endpoint.startsWith('/api/') || endpoint.startsWith('/heroes') || endpoint.startsWith('/matches') || endpoint.startsWith('/players')) {
    return 'opendota';
  }
  if (endpoint.includes('dotabuff.com') || endpoint.startsWith('/esports/')) {
    return 'dotabuff';
  }
  if (endpoint.includes('stratz.com')) {
    return 'stratz';
  }
  if (endpoint.includes('dota2protracker.com')) {
    return 'd2pt';
  }
  
  // Default to opendota for relative endpoints
  return 'opendota';
}

/**
 * Fetches JSON data from an external API, with support for caching and mock data.
 * @template T
 * @param service - The service name (for base URL selection).
 * @param endpoint - The endpoint path (relative to the service base URL).
 * @param cacheKey - The cache key for storing/retrieving the result.
 * @param options - Optional fetch options.
 * @param method - HTTP method (default 'GET').
 * @param body - Optional request body (for POST/PUT).
 * @returns The fetched and parsed JSON data.
 */
export async function fetchAPI<T>(
  service: ServiceName,
  endpoint: string,
  cacheKey: string,
  options?: RequestInit,
  method: string = 'GET',
  body?: unknown,
): Promise<T> {
  const baseUrl = BASE_URLS[service];
  if (!baseUrl) throw new Error(`Unknown or unsupported service: ${service}`);
  const fetchOptions: RequestInit = {
    ...options,
    method,
    body: body ? JSON.stringify(body) : undefined,
    headers: {
      ...(options?.headers || {}),
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
  };

  const res = await fetch(`${baseUrl}${endpoint}`, fetchOptions);
  if (!res.ok) {
    throw new Error(`HTTP error! status: ${res.status}`);
  }

  const json = await res.json();
  
  // Write to mock files if enabled
  if (shouldWriteMockData({ isReal: true })) {
    await writeMockData(`${cacheKey}.json`, json, `${baseUrl}${endpoint}`);
  }

  return json;
}

/**
 * Fetches raw HTML/text from an external API, with support for caching and mock data.
 * @param service - The service name (for base URL selection).
 * @param cacheKey - The cache key for storing/retrieving the result.
 * @param endpoint - The endpoint path (relative to the service base URL).
 * @param options - Optional fetch options.
 * @returns The fetched text data.
 */
export async function fetchPage(
  service: ServiceName,
  cacheKey: string,
  endpoint: string,
  options?: RequestInit,
): Promise<string> {
  const baseUrl = BASE_URLS[service];
  if (!baseUrl) throw new Error(`Unknown or unsupported service: ${service}`);
  
  const res = await fetch(`${baseUrl}${endpoint}`, options);
  if (!res.ok) {
    throw new Error(`HTTP error! status: ${res.status}`);
  }

  const text = await res.text();
  
  // Write to mock files if enabled
  if (shouldWriteMockData({ isReal: true })) {
    await writeMockData(`${cacheKey}.html`, text, `${baseUrl}${endpoint}`);
  }
  
  return text;
}

// Helper: parse JSON response safely
async function safeJson(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

// Helper: wait for a given time
function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Helper: handle polling response
function handlePollResponse(
  pollResponse: Response,
  attempt: number,
  signature: string,
  onProgress?: (status: 'queued' | 'processing', attempt: number) => void
): Promise<'continue' | 'success' | 'notfound' | 'error'> {
  return pollResponse.text().then(async (text) => {
    if (pollResponse.status === 200) {
      return 'success';
    }
    if (pollResponse.status === 202) {
      const pollData = text ? JSON.parse(text) : {};
      logWithTimestamp('log', `[pollEndpoint] Still processing on attempt ${attempt}, status: ${pollData.status}`);
      onProgress?.(pollData.status as 'queued' | 'processing', attempt);
      return 'continue';
    }
    if (pollResponse.status === 404) {
      logWithTimestamp('error', `[pollEndpoint] Request not found on attempt ${attempt} for signature: ${signature}`);
      return 'notfound';
    }
    logWithTimestamp('error', `[pollEndpoint] Polling failed on attempt ${attempt} for signature: ${signature}, status: ${pollResponse.status}`);
    return 'error';
  });
}

// Helper: perform the initial polling request
async function performInitialPollingRequest(endpoint: string, body: unknown): Promise<{ signature: string; status: string } | { data: unknown }> {
  const initialResponse = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (initialResponse.status === 200) {
    return { data: await initialResponse.json() };
  }
  if (initialResponse.status !== 202) {
    const errorText = await initialResponse.text();
    logWithTimestamp('error', `[pollEndpoint] Initial request failed for endpoint: ${endpoint}, status: ${initialResponse.status}, error: ${errorText}`);
    throw new Error(`Initial request failed: ${initialResponse.status} - ${errorText}`);
  }
  const { signature, status } = await initialResponse.json();
  if (!signature) {
    throw new Error('No signature received in 202 response');
  }
  return { signature, status };
}

// Helper: polling loop
async function pollingLoop<T>(endpoint: string, body: unknown, signature: string, status: string, maxAttempts: number, pollInterval: number, onProgress?: (status: 'queued' | 'processing', attempt: number) => void, onError?: (error: unknown) => void): Promise<T> {
  logWithTimestamp('log', `[pollEndpoint] Got signature: ${signature}, status: ${status}`);
  onProgress?.(status as 'queued' | 'processing', 0);
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    logWithTimestamp('log', `[pollEndpoint] Polling attempt ${attempt}/${maxAttempts} for signature: ${signature}`);
    if (attempt > 1) await wait(pollInterval);
    try {
      const pollResponse = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const pollResult = await handlePollResponse(pollResponse, attempt, signature, onProgress);
      if (pollResult === 'success') return await safeJson(pollResponse) as T;
      if (pollResult === 'notfound') throw new Error('Request not found or failed');
      if (pollResult === 'error') throw new Error('Polling failed');
      // else continue
    } catch (error) {
      logWithTimestamp('error', `[pollEndpoint] Error during polling attempt ${attempt} for signature: ${signature}:`, error);
      onError?.(error);
      if (attempt === maxAttempts) throw error;
      continue;
    }
  }
  const timeoutError = new Error(`Polling timeout after ${maxAttempts} attempts for signature: ${signature}`);
  logWithTimestamp('error', `[pollEndpoint] ${timeoutError.message}`);
  throw timeoutError;
}

export async function pollEndpoint<T = unknown>(
  endpoint: string,
  body: unknown,
  options: {
    maxAttempts?: number;
    pollInterval?: number;
    onProgress?: (status: 'queued' | 'processing', attempt: number) => void;
    onError?: (error: unknown) => void;
  } = {}
): Promise<T> {
  const {
    maxAttempts = 30, // 30 seconds max
    pollInterval = 1000, // 1 second
    onProgress,
    onError
  } = options;
  logWithTimestamp('log', `[pollEndpoint] Starting polling for endpoint: ${endpoint}`);
  const initial = await performInitialPollingRequest(endpoint, body);
  if ('data' in initial) {
    logWithTimestamp('log', `[pollEndpoint] Immediate success for endpoint: ${endpoint}`);
    return initial.data as T;
  }
  return pollingLoop<T>(endpoint, body, initial.signature, initial.status, maxAttempts, pollInterval, onProgress, onError);
}

/**
 * Checks if an object is a queued result from the cache/queue system.
 * Used to determine if a result is a queued status with a signature.
 * @param obj - The object to check.
 * @returns True if the object is a queued result.
 */
export function isAlreadyQueuedResult(obj: unknown): obj is { status: string; signature: string } {
  return (
    !!obj &&
    typeof obj === 'object' &&
    'status' in obj &&
    (obj as { status?: string }).status === 'queued' &&
    'signature' in obj
  );
} 