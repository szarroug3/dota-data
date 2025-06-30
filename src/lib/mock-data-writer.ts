// This module only works on the server side
let fs: any = null;
let path: any = null;

// Only import Node.js modules on the server side
if (typeof window === "undefined") {
  try {
    fs = require("fs");
    path = require("path");
  } catch (error) {}
}

// Static import for fake data generator to avoid dynamic import hanging
import { generateFakeData } from './fake-data-generator';
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
  return 'unknown';
}

// Check if a specific service should be mocked
function shouldMockService(service: 'opendota' | 'dotabuff' | 'stratz' | 'd2pt' | 'unknown'): boolean {
  switch (service) {
    case 'opendota':
      return process.env.USE_MOCK_API === 'true' || process.env.USE_MOCK_OPENDOTA === 'true';
    case 'dotabuff':
      return process.env.USE_MOCK_API === 'true' || process.env.USE_MOCK_DOTABUFF === 'true';
    case 'stratz':
      return process.env.USE_MOCK_API === 'true' || process.env.USE_MOCK_STRATZ === 'true';
    case 'd2pt':
      return process.env.USE_MOCK_API === 'true' || process.env.USE_MOCK_D2PT === 'true';
    case 'unknown':
    default:
      return process.env.USE_MOCK_API === 'true';
  }
}

const config: MockDataConfig = {
  enabled:
    process.env.NODE_ENV === "development" && typeof window === "undefined",
  basePath:
    typeof window === "undefined" ? path?.join(process.cwd(), "mock-data") : "",
};

// NOTE: Only call writeMockData after a real API/network fetch, not when reading from cache or mock data.
export async function writeMockData(
  filename: string,
  data: any,
  endpoint?: string,
): Promise<void> {
  if (!config.enabled || !fs || !path) return;

  // Check if this service should be mocked
  if (endpoint) {
    const service = getServiceFromEndpoint(endpoint);
    if (!shouldMockService(service)) {
      logWithTimestamp('log', `[MOCK ${service.toUpperCase()}] Skipping mock data write for ${endpoint} - service not mocked`);
      return;
    }
  }

  try {
    // Ensure the mock-data directory exists
    if (!fs.existsSync(config.basePath)) {
      fs.mkdirSync(config.basePath, { recursive: true });
    }

    const filePath = path.join(config.basePath, filename);
    const jsonData = JSON.stringify(data, null, 2);

    fs.writeFileSync(filePath, jsonData, "utf8");
    
    if (endpoint && endpoint.includes('/matches/')) {
      logWithTimestamp('log', `[MOCK] Wrote match mock data to file: ${filePath}`);
    }

    if (endpoint) {
      const service = getServiceFromEndpoint(endpoint);
      logWithTimestamp('log', `[MOCK ${service.toUpperCase()}] Wrote mock data for ${endpoint} to file: ${filename}`);
    } else {
      logWithTimestamp('log', `[MOCK] Wrote mock data to file: ${filename}`);
    }
  } catch (error) {}
}

export async function readMockData(filename: string, endpoint?: string): Promise<any | null> {
  logWithTimestamp('log', `[readMockData] Starting for filename: ${filename}, endpoint: ${endpoint}`);
  
  if (!config.enabled || !fs || !path) {
    logWithTimestamp('log', `[readMockData] Mock data disabled or fs/path not available`);
    return null;
  }

  // Check if this service should be mocked
  if (endpoint) {
    const service = getServiceFromEndpoint(endpoint);
    logWithTimestamp('log', `[readMockData] Detected service: ${service}`);
    if (!shouldMockService(service)) {
      logWithTimestamp('log', `[readMockData] Service ${service} should not be mocked`);
      return null;
    }
    logWithTimestamp('log', `[readMockData] Service ${service} should be mocked`);
  }

  try {
    const filePath = path.join(config.basePath, filename);
    logWithTimestamp('log', `[readMockData] Checking file path: ${filePath}`);
    
    if (!fs.existsSync(filePath)) {
      logWithTimestamp('log', `[readMockData] File does not exist: ${filePath}`);
      // If mock file doesn't exist, generate fake data
      if (endpoint) {
        try {
          logWithTimestamp('log', `[readMockData] Generating fake data for missing file: ${filename}`);
          const fakeData = generateFakeData(endpoint);
          logWithTimestamp('log', `[readMockData] Generated fake data for missing file: ${filename}`);
          
          // Write the generated fake data to disk so it persists
          const jsonData = JSON.stringify(fakeData, null, 2);
          fs.writeFileSync(filePath, jsonData, "utf8");
          logWithTimestamp('log', `[readMockData] Wrote generated fake data to: ${filePath}`);
          
          return fakeData;
        } catch (error) {
          logWithTimestamp('error', `[readMockData] Error generating fake data for ${filename}:`, error);
          return null;
        }
      }
      logWithTimestamp('log', `[readMockData] No endpoint provided, cannot generate fake data`);
      return null;
    }

    logWithTimestamp('log', `[readMockData] File exists, reading: ${filePath}`);
    const fileContent = fs.readFileSync(filePath, "utf8");
    logWithTimestamp('log', `[readMockData] Read file content, length: ${fileContent.length}`);
    
    const data = JSON.parse(fileContent);
    logWithTimestamp('log', `[readMockData] Parsed JSON data successfully`);
    
    if (endpoint && endpoint.includes('/matches/')) {
      logWithTimestamp('log', `[MOCK] Read match mock data from file: ${filePath}`);
    }
    
    return data;
  } catch (error) {
    logWithTimestamp('error', `[readMockData] Error reading mock data from ${filename}:`, error);
    return null;
  }
}

export function generateMockFilename(
  endpoint: string,
  params?: Record<string, string | number>,
): string {
  // Determine service name from endpoint
  let service = "unknown";
  if (endpoint.includes("api.opendota.com")) {
    service = "opendota";
  } else if (endpoint.includes("dotabuff.com")) {
    service = "dotabuff";
  } else if (endpoint.includes("stratz.com")) {
    service = "stratz";
  } else if (endpoint.includes("dota2protracker.com")) {
    service = "d2pt";
  }

  if (service === "unknown") {
    throw new Error(`[generateMockFilename] Unknown service for endpoint: ${endpoint}`);
  }

  // Clean the endpoint and create a filename
  let filename = endpoint
    .replace(/^https?:\/\/[^/]+\/api\//, "")
    .replace(/\//g, "-")
    .replace(/[^a-zA-Z0-9-]/g, "");

  // Try to extract ids from endpoint
  const idMatches = endpoint.match(/(match|player|league|team)[-_]?(\d+)/gi);
  if (idMatches) {
    filename +=
      "-" + idMatches.map((id) => id.replace(/[^a-zA-Z0-9]/g, "")).join("-");
  }

  // Add params if provided
  if (params && Object.keys(params).length > 0) {
    const paramString = Object.entries(params)
      .map(([key, value]) => `${key}-${value}`)
      .join("-");
    filename += `-${paramString}`;
  }

  return `${service}-${filename}.json`;
}
