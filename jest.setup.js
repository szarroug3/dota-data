// eslint-disable-next-line @typescript-eslint/no-require-imports, no-restricted-syntax
require('@testing-library/jest-dom');

// Mock window.matchMedia for next-themes compatibility
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

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

const MockRedis = function () {
  return mockRedisInstance;
};
MockRedis.fromEnv = () => mockRedisInstance;

jest.mock('@upstash/redis', () => ({
  Redis: MockRedis,
}));

// Mock NextResponse globally for backend API tests
jest.mock('next/server', () => {
  class NextResponse {
    constructor(body, init) {
      this.body = body;
      this.status = init?.status;
      this.headers = new Map();
    }
    json() {
      return Promise.resolve(this.body);
    }
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
