// Backend (node) test environment setup
// Provide minimal polyfills/mocks needed for backend tests without loading jest-dom

// Minimal File polyfill for undici/cheerio deps
if (typeof globalThis.File === 'undefined') {
  globalThis.File = class {};
}
// @ts-expect-error - assign for test environment
if (typeof global.File === 'undefined') {
  // @ts-expect-error - assign for test environment
  global.File = globalThis.File;
}

// Mock Upstash Redis to avoid real connections
const mockRedisInstance = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  expire: jest.fn(),
  keys: jest.fn(),
  flushall: jest.fn(),
  ping: jest.fn(),
};

const MockRedis = function () {
  return mockRedisInstance;
};
// @ts-expect-error - attach static for tests
MockRedis.fromEnv = () => mockRedisInstance;

jest.mock('@upstash/redis', () => ({
  Redis: MockRedis,
}));

// Set minimal envs used by tests
process.env.UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL || 'https://example.upstash.io';
process.env.UPSTASH_REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || 'token';

