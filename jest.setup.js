// eslint-disable-next-line @typescript-eslint/no-require-imports, no-restricted-syntax
require('@testing-library/jest-dom');

// Mock Upstash Redis modules globally to prevent any real connections or warnings
const mockRedisInstance = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  zremrangebyscore: jest.fn(),
  zcard: jest.fn(),
  zadd: jest.fn(),
  expire: jest.fn(),
  zrange: jest.fn(),
  hgetall: jest.fn(),
  lpush: jest.fn(),
  hset: jest.fn(),
  rpop: jest.fn(),
  keys: jest.fn(),
  flushall: jest.fn(),
};

const MockRedis = function() { return mockRedisInstance; };
MockRedis.fromEnv = () => mockRedisInstance;

jest.mock('@upstash/redis', () => ({
  Redis: MockRedis,
}));

// Jest setup file
// Suppress console logging during tests
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

beforeAll(() => {
  // Suppress console output during tests
  console.log = jest.fn();
  console.warn = jest.fn();
  console.error = jest.fn();
});

afterAll(() => {
  // Restore console functions
  console.log = originalConsoleLog;
  console.warn = originalConsoleWarn;
  console.error = originalConsoleError;
});

// Mock NextResponse globally for backend API tests
jest.mock('next/server', () => {
  class NextResponse {
    constructor(body, init) {
      this.body = body;
      this.status = init?.status;
      this.headers = new Map();
    }
    json() { return Promise.resolve(this.body); }
    static json(data, init) {
      return new NextResponse(data, init);
    }
  }
  return { NextResponse };
});

// Set global environment variables to prevent Redis warnings and enable mock mode
global.process.env.UPSTASH_REDIS_REST_URL = 'http://localhost:6379';
global.process.env.UPSTASH_REDIS_REST_TOKEN = 'dummy-token';
global.process.env.MOCK_DATA = 'true';
global.process.env.USE_MOCK_OPENDOTA = 'true';
global.process.env.USE_MOCK_DOTABUFF = 'true';
global.process.env.MOCK_RATE_LIMIT = '1000';

// Mock all Redis/cache/queue/rate-limit backend modules globally
// These are only needed for backend tests, not frontend tests
// jest.mock('@/lib/api/cache-backends/redis');
// jest.mock('@/lib/api/queue-backends/redis');
// jest.mock('@/lib/api/rate-limit-backends/redis'); 