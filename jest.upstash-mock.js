// Dedicated Jest setup file to mock @upstash/redis before any app code is loaded
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
