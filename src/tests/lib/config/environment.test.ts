/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Environment Configuration Tests
 *
 * Tests for the environment configuration system to ensure proper
 * validation, parsing, and type safety.
 */

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
      (process.env as any).USE_MOCK_OPENDOTA = 'true';
      (process.env as any).USE_MOCK_STEAM = 'false';
      (process.env as any).USE_MOCK_DB = 'true';
      (process.env as any).WRITE_REAL_DATA_TO_MOCK = 'true';

      // Re-import to get fresh config
      jest.resetModules();
      const { env: freshEnv } = require('../../../lib/config/environment');

      expect(freshEnv.USE_MOCK_API).toBe(true);
      expect(freshEnv.USE_MOCK_OPENDOTA).toBe(true);
      expect(freshEnv.USE_MOCK_STEAM).toBe(false);
      expect(freshEnv.USE_MOCK_DB).toBe(true);
      expect(freshEnv.WRITE_REAL_DATA_TO_MOCK).toBe(true);
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
      expect(typeof getEnv.OPENDOTA_API_KEY()).toBe('undefined');
    });

    it('should return the same values as the env object', () => {
      jest.resetModules();
      const { env, getEnv } = require('../../../lib/config/environment');
      expect(getEnv.NODE_ENV()).toBe(env.NODE_ENV);
      expect(getEnv.USE_MOCK_API()).toBe(env.USE_MOCK_API);
      expect(getEnv.OPENDOTA_API_KEY()).toBe(env.OPENDOTA_API_KEY);
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
      expect(docs).toContain('## External API Configuration');
      expect(docs).toContain('## Testing Configuration');
    });

    it('should include all environment variables in documentation', () => {
      jest.resetModules();
      const { generateEnvironmentDocs } = require('../../../lib/config/environment');
      const docs = generateEnvironmentDocs();

      // Check for key variables
      expect(docs).toContain('### NODE_ENV');
      expect(docs).toContain('### USE_MOCK_API');
      expect(docs).toContain('### OPENDOTA_API_KEY');
      expect(docs).toContain('### STEAM_API_KEY');
    });

    it('should include type information in documentation', () => {
      jest.resetModules();
      const { generateEnvironmentDocs } = require('../../../lib/config/environment');
      const docs = generateEnvironmentDocs();

      expect(docs).toContain("- **Type**: 'development' | 'production' | 'test'");
      expect(docs).toContain('- **Type**: boolean');
      expect(docs).toContain('- **Type**: string');
    });

    it('should include default values in documentation', () => {
      jest.resetModules();
      const { generateEnvironmentDocs } = require('../../../lib/config/environment');
      const docs = generateEnvironmentDocs();

      expect(docs).toContain("- **Default**: 'development'");
      expect(docs).toContain('- **Default**: false');
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
      expect(env).toHaveProperty('USE_MOCK_DB');
      expect(env).toHaveProperty('WRITE_REAL_DATA_TO_MOCK');
      expect(env).toHaveProperty('OPENDOTA_API_KEY');
      expect(env).toHaveProperty('STEAM_API_KEY');
      expect(env).toHaveProperty('CI');
    });
  });
});
