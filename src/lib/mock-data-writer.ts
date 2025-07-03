// This module only works on the server side
import * as fs from 'fs';
import * as path from 'path';

// Static import for fake data generator to avoid dynamic import hanging
import { logWithTimestamp } from './utils';

interface MockDataConfig {
  enabled: boolean;
  basePath: string;
}

// Helper function to determine which service an endpoint belongs to
function getServiceFromEndpoint(endpoint: string): 'opendota' | 'dotabuff' | 'stratz' | 'd2pt' | 'unknown' {
  if (endpoint.includes('api.opendota.com')) return 'opendota';
  if (endpoint.includes('dotabuff.com')) return 'dotabuff';
  if (endpoint.includes('stratz.com')) return 'stratz';
  if (endpoint.includes('dota2protracker.com')) return 'd2pt';
  
  // If it's a relative endpoint (doesn't start with http), assume it's OpenDota
  if (!endpoint.startsWith('http')) {
    return 'opendota';
  }
  
  return 'unknown';
}

// Check if a specific service should be mocked
export function shouldMockService(service: 'opendota' | 'dotabuff' | 'stratz' | 'd2pt' | 'db' | 'unknown'): boolean {
  if (process.env.USE_MOCK_API === 'true') return true;
  switch (service) {
    case 'opendota': return process.env.USE_MOCK_OPENDOTA === 'true';
    case 'dotabuff': return process.env.USE_MOCK_DOTABUFF === 'true';
    case 'stratz': return process.env.USE_MOCK_STRATZ === 'true';
    case 'd2pt': return process.env.USE_MOCK_D2PT === 'true';
    case 'db': return process.env.USE_MOCK_DB === 'true';
    default: throw new Error('Unknown service passed to shouldMockService');
  }
}

const config: MockDataConfig = {
  enabled:
    process.env.NODE_ENV === "development" && typeof window === "undefined",
  basePath: "",
};

if (typeof window !== 'undefined') {
  throw new Error('[mock-data-writer.ts] Mocking logic should never run on the client!');
}

// NOTE: Only call writeMockData after a real API/network fetch, not when reading from cache or mock data.
async function ensureDirAndWriteFile(filePath: string, data: unknown) {
  if (!fs || !path) return;
  const dirPath = path.dirname(filePath);
  await fs.promises.mkdir(dirPath, { recursive: true });
  const jsonData = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
  await fs.promises.writeFile(filePath, jsonData, "utf8");
}

function shouldWriteForService(endpoint?: string): boolean {
  if (!endpoint) return true;
  const service = getServiceFromEndpoint(endpoint);
  return shouldMockService(service);
}

function logWriteMockData(endpoint: string | undefined, filePath: string, filename: string) {
  if (endpoint && endpoint.includes('/matches/')) {
    logWithTimestamp('log', `[MOCK] Wrote match mock data to file: ${filePath}`);
  }
  if (endpoint) {
    const service = getServiceFromEndpoint(endpoint);
    logWithTimestamp('log', `[MOCK ${service.toUpperCase()}] Wrote mock data for ${endpoint} to file: ${filename}`);
  } else {
    logWithTimestamp('log', `[MOCK] Wrote mock data to file: ${filename}`);
  }
}

export async function writeMockData(
  filename: string,
  data: unknown,
  endpoint?: string,
): Promise<void> {
  logWithTimestamp('log', `[writeMockData] Called with filename: ${filename}, endpoint: ${endpoint}, data type: ${typeof data}, data length: ${typeof data === 'string' ? data.length : 'N/A'}`);
  if (!config.enabled || !fs || !path) {
    logWithTimestamp('log', `[writeMockData] Not enabled or fs/path not available. enabled: ${config.enabled}, fs: ${!!fs}, path: ${!!path}`);
    return;
  }
  const shouldWriteReal = process.env.WRITE_REAL_DATA_TO_MOCK === 'true';
  const shouldWriteFake = process.env.USE_MOCK_API === 'true';
  if (!shouldWriteReal && !shouldWriteFake) {
    logWithTimestamp('log', `[writeMockData] Neither WRITE_REAL_DATA_TO_MOCK nor USE_MOCK_API is true, skipping write for ${filename}`);
    return;
  }
  if (!shouldWriteForService(endpoint)) {
    logWithTimestamp('log', `[writeMockData] Service should not be mocked for endpoint: ${endpoint}`);
    return;
  }
  try {
    const filePath = path ? path.join(process.cwd(), "mock-data", filename) : filename;
    logWithTimestamp('log', `[writeMockData] Writing to file: ${filePath}`);
    await ensureDirAndWriteFile(filePath, data);
    logWriteMockData(endpoint, filePath, filename);
  } catch {
    logWithTimestamp('error', `[writeMockData] Error writing mock data for ${filename}`);
  }
}

// --- MOCK/REAL UTILITY FUNCTIONS ---
/**
 * Returns true if real or fake data should be written to disk as mock data.
 * - Always true for fake data in mock mode.
 * - True for real data in real mode if WRITE_REAL_DATA_TO_MOCK is true.
 */
export function shouldWriteMockData({ isFake, isReal }: { isFake?: boolean, isReal?: boolean }): boolean {
  if (isFake && process.env.NODE_ENV === 'development' && typeof window === 'undefined') return true;
  if (isReal && process.env.WRITE_REAL_DATA_TO_MOCK === 'true') return true;
  return false;
}

/**
 * Reads mock data from disk for the given filename.
 * Returns the parsed data if the file exists, or null if not found.
 * No service or endpoint logic is handled here; the caller is responsible for all context.
 */
export async function readMockData(filename: string, _params?: Record<string, string | number>): Promise<unknown | null> {
  logWithTimestamp('log', `[readMockData] Attempting to read mock file: ${filename}`);
  if (!config.enabled || !fs || !path) {
    logWithTimestamp('log', `[readMockData] Mock data disabled or fs/path not available`);
    return null;
  }
  try {
    const filePath = path ? path.join(process.cwd(), "mock-data", filename) : filename;
    logWithTimestamp('log', `[readMockData] Checking file path: ${filePath}`);
    if (!fs.existsSync(filePath)) {
      logWithTimestamp('log', `[readMockData] File does not exist: ${filePath}`);
      return null;
    }
    logWithTimestamp('log', `[readMockData] File exists, reading: ${filePath}`);
    const fileContent = await fs.promises.readFile(filePath, "utf8");
    logWithTimestamp('log', `[readMockData] Read file content, length: ${fileContent.length}`);
    if (filename.endsWith('.html')) {
      logWithTimestamp('log', `[readMockData] Returning raw HTML content for file: ${filename}`);
      return fileContent;
    } else if (filename.endsWith('.json')) {
      const data = JSON.parse(fileContent);
      logWithTimestamp('log', `[readMockData] Parsed JSON data successfully`);
      return data;
    } else {
      logWithTimestamp('error', `[readMockData] Unknown file type for: ${filename}`);
      throw new Error(`Uknown file type for: ${filename}`)
    }
  } catch {
    logWithTimestamp('error', `[readMockData] Error reading mock data from ${filename}`);
    return null;
  }
}

// Refactor tryMock to extract helpers for paginated file loading and error handling
async function loadPaginatedDotabuffHtml(filename: string): Promise<string> {
  let page = 1;
  let combinedHtml = '';
  let foundAny = false;
  while (true) {
    const pageFilename = filename.replace('.html', `-page-${page}.html`);
    const html = (await readMockData(pageFilename)) as string | null;
    if (!html) break;
    foundAny = true;
    combinedHtml += html;
    page++;
  }
  return foundAny ? combinedHtml : '';
}

export async function tryMock(
  service: 'opendota' | 'dotabuff' | 'stratz' | 'd2pt' | 'db' | 'unknown',
  filename: string,
  _params?: Record<string, string | number>
): Promise<Response | null> {
  logWithTimestamp('log', `[tryMock] Called for service=${service}, filename=${filename}`);
  if (!filename) {
    logWithTimestamp('error', '[tryMock] Filename is required');
    throw new Error('[tryMock] Filename is required');
  }
  if (service === 'unknown') {
    logWithTimestamp('error', `[tryMock] Unknown service for filename: ${filename}`);
    throw new Error(`[tryMock] Unknown service for filename: ${filename}`);
  }
  if (shouldMockService(service)) {
    logWithTimestamp('log', `[tryMock] Service ${service} should be mocked`);
    if (
      service === 'dotabuff' &&
      filename.match(/^dotabuff-team-\d+-matches\.html$/)
    ) {
      logWithTimestamp('log', `[tryMock] Attempting to load paginated files for combined file: ${filename}`);
      const combinedHtml = await loadPaginatedDotabuffHtml(filename);
      if (combinedHtml) {
        return new Response(combinedHtml, { status: 200, headers: { 'Content-Type': 'text/html' } });
      }
    }
    const data = await readMockData(filename);
    if (data) {
      if (filename.endsWith('.html')) {
        return new Response(data as string, { status: 200, headers: { 'Content-Type': 'text/html' } });
      } else if (filename.endsWith('.json')) {
        return new Response(JSON.stringify(data), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
    }
  }
  return null;
}
