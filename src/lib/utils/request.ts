import fs from 'fs/promises';
import path from 'path';

import { CacheService } from '@/lib/cache-service';
import { getEnv } from '@/lib/config/environment';
import { CacheValue } from '@/types/cache';

const mockServices = {
  opendota: getEnv.USE_MOCK_API() || getEnv.USE_MOCK_OPENDOTA(),
  steam: getEnv.USE_MOCK_API() || getEnv.USE_MOCK_STEAM(),
};

const defaultMockDelay = getEnv.MOCK_API_DELAY_MS() ?? 0;
const mockDelays: Record<keyof typeof mockServices, number> = {
  opendota: getEnv.MOCK_API_DELAY_OPENDOTA_MS() ?? defaultMockDelay,
  steam: getEnv.MOCK_API_DELAY_STEAM_MS() ?? defaultMockDelay,
};

async function getFromCache<T>(cache: CacheService, cacheKey: string, force: boolean): Promise<T | null> {
  if (force) {
    return null;
  }
  return await cache.get<T>(cacheKey);
}

async function getFromExternalData(externalDataFilename: string): Promise<string> {
  return await fs.readFile(externalDataFilename, 'utf-8');
}

async function getFromAPI(requestFn: () => Promise<string>, externalDataFilename: string): Promise<string> {
  const response = await requestFn();
  if (getEnv.WRITE_REAL_DATA_TO_MOCK()) {
    const folder = path.dirname(externalDataFilename);
    await fs.mkdir(folder, { recursive: true });
    await fs.writeFile(externalDataFilename, response, 'utf-8');
  }
  return response;
}

async function processData<T>(
  data: string,
  processingFn: (data: string) => T,
  cache: CacheService,
  cacheKey: string,
  cacheTTL: number,
): Promise<T> {
  const processed = await processingFn(data);
  // Ensure the processed data is compatible with CacheValue
  await cache.set(cacheKey, processed as CacheValue, cacheTTL);
  return processed;
}

export async function request<T>(
  service: keyof typeof mockServices,
  requestFn: () => Promise<string>,
  processingFn: (data: string) => T,
  externalDataFilename: string,
  force: boolean = false,
  cacheTTL: number = 60 * 60,
  cacheKey: string,
): Promise<T | null> {
  const cache = new CacheService();

  const cachedData = await getFromCache<T>(cache, cacheKey, force);
  if (cachedData) {
    return cachedData;
  }

  let data: string | null = null;
  const useMock = mockServices[service];

  await applyMockDelay(service, useMock);

  if (useMock) {
    try {
      data = await getFromExternalData(externalDataFilename);
    } catch {
      data = await getFromAPI(requestFn, externalDataFilename);
    }
  } else {
    data = await getFromAPI(requestFn, externalDataFilename);
  }

  return await processData(data, processingFn, cache, cacheKey, cacheTTL);
}

async function applyMockDelay(service: keyof typeof mockServices, useMock: boolean): Promise<void> {
  if (!useMock) return;
  const delay = mockDelays[service] ?? defaultMockDelay;
  if (delay && delay > 0) {
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
}

export async function requestWithRetry(
  method: 'GET' | 'POST',
  url: string,
  body?: object,
  headers?: Record<string, string>,
  retries: number = 3,
  retryDelay: number = 1000,
): Promise<Response> {
  const request = { method, body: body ? JSON.stringify(body) : undefined, headers };

  function shouldRetry(status: number): boolean {
    return status === 429 || (status >= 500 && status < 600);
  }

  function computeBackoffMs(retryAfter: string | null, attempt: number): number {
    const backoffMs = retryDelay * Math.pow(2, attempt);
    if (!retryAfter) return backoffMs;
    const seconds = Number(retryAfter);
    if (!Number.isNaN(seconds)) return Math.max(backoffMs, seconds * 1000);
    const dateMs = Date.parse(retryAfter);
    if (!Number.isNaN(dateMs)) return Math.max(backoffMs, dateMs - Date.now());
    return backoffMs;
  }

  let lastStatus: number | undefined;
  let lastStatusText: string | undefined;

  for (let attempt = 0; attempt < retries; attempt++) {
    const response = await fetch(url, request);
    if (response.ok) return response;

    lastStatus = response.status;
    lastStatusText = response.statusText;

    if (!shouldRetry(response.status)) break;

    const backoffMs = computeBackoffMs(response.headers.get('Retry-After'), attempt);
    await new Promise((resolve) => setTimeout(resolve, Math.max(0, backoffMs)));
  }

  throw new Error(`Request failed: ${lastStatus} ${lastStatusText}`);
}
