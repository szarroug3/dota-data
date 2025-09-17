/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Environment Configuration Tests
 *
 * Tests for the environment configuration system to ensure proper
 * validation, parsing, and type safety.
 */

describe('Environment Variable Validation (OPENDOTA_API_TIMEOUT)', () => {
  it('should throw error for negative OPENDOTA_API_TIMEOUT', () => {
    const originalNodeEnv = process.env.NODE_ENV;
    Object.defineProperty(process.env, 'NODE_ENV', { value: 'development', configurable: true, writable: true });
    (process.env as any).OPENDOTA_API_TIMEOUT = '0';
    jest.resetModules();
    delete require.cache[require.resolve('../../../lib/config/environment')];
    expect(() => {
      const { loadAndValidateEnv } = require('../../../lib/config/environment');
      loadAndValidateEnv('development');
    }).toThrow('OPENDOTA_API_TIMEOUT must be greater than 0');
    Object.defineProperty(process.env, 'NODE_ENV', { value: originalNodeEnv, configurable: true, writable: true });
  });
});

describe('Environment Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset process.env before each test
    process.env = { ...originalEnv };
    delete process.env.OPENDOTA_API_TIMEOUT;
  });

  afterAll(() => {
    // Restore original process.env
    process.env = originalEnv;
  });

  describe('Environment Variable Parsing', () => {
    it('should parse boolean environment variables correctly', () => {
      (process.env as any).USE_MOCK_API = 'true';
      (process.env as any).USE_REDIS = 'false';
      (process.env as any).DEBUG_LOGGING = 'true';

      // Re-import to get fresh config
      jest.resetModules();
      const { env: freshEnv } = require('../../../lib/config/environment');

      expect(freshEnv.USE_MOCK_API).toBe(true);
      expect(freshEnv.USE_REDIS).toBe(false);
      expect(freshEnv.DEBUG_LOGGING).toBe(true);
    });

    it('should parse numeric environment variables correctly', () => {
      (process.env as any).OPENDOTA_API_TIMEOUT = '5000';
      (process.env as any).STEAM_API_REQUEST_DELAY = '2000';

      jest.resetModules();
      const { env: freshEnv } = require('../../../lib/config/environment');

      expect(freshEnv.OPENDOTA_API_TIMEOUT).toBe(5000);
      expect(freshEnv.STEAM_API_REQUEST_DELAY).toBe(2000);
    });

    it('should use default values when environment variables are not set', () => {
      // Clear specific env vars
      delete (process.env as any).OPENDOTA_API_BASE_URL;
      delete (process.env as any).STEAM_API_BASE_URL;

      jest.resetModules();
      const { env: freshEnv } = require('../../../lib/config/environment');

      expect(freshEnv.OPENDOTA_API_BASE_URL).toBe('https://api.opendota.com/api');
      expect(freshEnv.STEAM_API_BASE_URL).toBe('https://api.steampowered.com');
    });

    it('should parse NODE_ENV correctly', () => {
      (process.env as any).NODE_ENV = 'production';

      jest.resetModules();
      const { env: freshEnv } = require('../../../lib/config/environment');

      expect(freshEnv.NODE_ENV).toBe('production');
    });

    it('should default NODE_ENV to development', () => {
      delete (process.env as any).NODE_ENV;

      jest.resetModules();
      const { env: freshEnv } = require('../../../lib/config/environment');

      expect(freshEnv.NODE_ENV).toBe('development');
    });
  });

  describe('Environment Variable Validation', () => {
    it('should throw error for invalid NODE_ENV', () => {
      (process.env as any).NODE_ENV = 'invalid';

      expect(() => {
        jest.resetModules();
        require('../../../lib/config/environment');
      }).toThrow('Invalid NODE_ENV: invalid. Must be one of: development, production, test');
    });

    it('should throw error for invalid LOG_LEVEL', () => {
      (process.env as any).NODE_ENV = 'development';
      (process.env as any).LOG_LEVEL = 'invalid';

      expect(() => {
        jest.resetModules();
        require('../../../lib/config/environment');
      }).toThrow('Invalid LOG_LEVEL: invalid. Must be one of: debug, info, warn, error');
    });

    it('should throw error for invalid URLs', () => {
      (process.env as any).NODE_ENV = 'development';
      (process.env as any).OPENDOTA_API_BASE_URL = 'not-a-url';

      expect(() => {
        jest.resetModules();
        require('../../../lib/config/environment');
      }).toThrow('Invalid OPENDOTA_API_BASE_URL: not-a-url');
    });

    it('should not validate in test environment', () => {
      (process.env as any).NODE_ENV = 'test';
      (process.env as any).LOG_LEVEL = 'invalid';

      expect(() => {
        jest.resetModules();
        require('../../../lib/config/environment');
      }).not.toThrow();
    });
  });

  describe('Environment Getters', () => {
    it('should provide type-safe access to environment variables', () => {
      jest.resetModules();
      const { getEnv } = require('../../../lib/config/environment');
      expect(typeof getEnv.NODE_ENV()).toBe('string');
      expect(typeof getEnv.USE_MOCK_API()).toBe('boolean');
      expect(typeof getEnv.OPENDOTA_API_BASE_URL()).toBe('string');
    });

    it('should return the same values as the env object', () => {
      jest.resetModules();
      const { env, getEnv } = require('../../../lib/config/environment');
      expect(getEnv.NODE_ENV()).toBe(env.NODE_ENV);
      expect(getEnv.USE_MOCK_API()).toBe(env.USE_MOCK_API);
      expect(getEnv.OPENDOTA_API_BASE_URL()).toBe(env.OPENDOTA_API_BASE_URL);
    });
  });

  describe('Documentation Generation', () => {
    it('should generate comprehensive documentation', () => {
      jest.resetModules();
      const { generateEnvironmentDocs } = require('../../../lib/config/environment');
      const docs = generateEnvironmentDocs();

      expect(docs).toContain('# Environment Variables Documentation');
      expect(docs).toContain('## Core Configuration');
      expect(docs).toContain('## Mock Mode Settings');
      expect(docs).toContain('## Logging Configuration');
      expect(docs).toContain('## Redis Configuration');
      expect(docs).toContain('## QStash Configuration');
      expect(docs).toContain('## Rate Limiting Configuration');
      expect(docs).toContain('## External API Configuration');
      expect(docs).toContain('## Vercel Deployment Configuration');
      expect(docs).toContain('## Testing Configuration');
    });

    it('should include all environment variables in documentation', () => {
      jest.resetModules();
      const { generateEnvironmentDocs } = require('../../../lib/config/environment');
      const docs = generateEnvironmentDocs();

      // Check for key variables
      expect(docs).toContain('### NODE_ENV');
      expect(docs).toContain('### USE_MOCK_API');
      expect(docs).toContain('### REDIS_URL');
      expect(docs).toContain('### DOTA_ASSISTANT_REDIS_URL');
      expect(docs).toContain('### DOTA_ASSISTANT_KV_REST_API_URL');
      expect(docs).toContain('### DOTA_ASSISTANT_KV_URL');
      expect(docs).toContain('### DOTA_ASSISTANT_KV_REST_API_TOKEN');
      expect(docs).toContain('### DOTA_ASSISTANT_KV_REST_API_READ_ONLY_TOKEN');
      expect(docs).toContain('### OPENDOTA_API_KEY');
      expect(docs).toContain('### STRATZ_API_KEY');
      expect(docs).toContain('### VERCEL_OIDC_TOKEN');
    });

    it('should include type information in documentation', () => {
      jest.resetModules();
      const { generateEnvironmentDocs } = require('../../../lib/config/environment');
      const docs = generateEnvironmentDocs();

      expect(docs).toContain("- **Type**: 'development' | 'production' | 'test'");
      expect(docs).toContain('- **Type**: boolean');
      expect(docs).toContain('- **Type**: number');
      expect(docs).toContain('- **Type**: string');
    });

    it('should include default values in documentation', () => {
      jest.resetModules();
      const { generateEnvironmentDocs } = require('../../../lib/config/environment');
      const docs = generateEnvironmentDocs();

      expect(docs).toContain("- **Default**: 'development'");
      expect(docs).toContain('- **Default**: false');
      expect(docs).toContain('- **Default**: 60');
      expect(docs).toContain("- **Default**: 'https://api.opendota.com/api'");
    });
  });

  describe('Environment Configuration Interface', () => {
    it('should have all required properties', () => {
      jest.resetModules();
      const { env } = require('../../../lib/config/environment');
      expect(env).toHaveProperty('NODE_ENV');
      expect(env).toHaveProperty('USE_MOCK_API');
      expect(env).toHaveProperty('USE_MOCK_OPENDOTA');
      expect(env).toHaveProperty('USE_MOCK_STEAM');
      expect(env).toHaveProperty('USE_MOCK_STRATZ');
      expect(env).toHaveProperty('USE_MOCK_D2PT');
      expect(env).toHaveProperty('USE_MOCK_DB');
      expect(env).toHaveProperty('WRITE_REAL_DATA_TO_MOCK');
      expect(env).toHaveProperty('DEBUG_LOGGING');
      expect(env).toHaveProperty('LOG_LEVEL');
      expect(env).toHaveProperty('LOG_FILE_PATH');
      expect(env).toHaveProperty('REDIS_URL');
      expect(env).toHaveProperty('DOTA_ASSISTANT_REDIS_URL');
      expect(env).toHaveProperty('DOTA_ASSISTANT_KV_REST_API_URL');
      expect(env).toHaveProperty('DOTA_ASSISTANT_KV_URL');
      expect(env).toHaveProperty('DOTA_ASSISTANT_KV_REST_API_TOKEN');
      expect(env).toHaveProperty('DOTA_ASSISTANT_KV_REST_API_READ_ONLY_TOKEN');
      expect(env).toHaveProperty('USE_REDIS');
      expect(env).toHaveProperty('QSTASH_TOKEN');
      expect(env).toHaveProperty('QSTASH_CURRENT_SIGNING_KEY');
      expect(env).toHaveProperty('QSTASH_NEXT_SIGNING_KEY');
      expect(env).toHaveProperty('USE_QSTASH');
      expect(env).toHaveProperty('RATE_LIMIT_OPENDOTA');
      expect(env).toHaveProperty('RATE_LIMIT_STEAM');
      expect(env).toHaveProperty('RATE_LIMIT_STRATZ');
      expect(env).toHaveProperty('RATE_LIMIT_D2PT');
      expect(env).toHaveProperty('RATE_LIMIT_WINDOW');
      expect(env).toHaveProperty('OPENDOTA_API_KEY');
      expect(env).toHaveProperty('OPENDOTA_API_BASE_URL');
      expect(env).toHaveProperty('OPENDOTA_API_TIMEOUT');
      expect(env).toHaveProperty('STEAM_API_BASE_URL');
      expect(env).toHaveProperty('STEAM_API_REQUEST_DELAY');
      expect(env).toHaveProperty('D2PT_BASE_URL');
      expect(env).toHaveProperty('D2PT_REQUEST_DELAY');
      expect(env).toHaveProperty('STRATZ_API_KEY');
      expect(env).toHaveProperty('VERCEL_OIDC_TOKEN');
      expect(env).toHaveProperty('TEST_MOCK_MODE');
      expect(env).toHaveProperty('TEST_TIMEOUT');
      expect(env).toHaveProperty('CI');
    });
  });
});
