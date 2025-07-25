/**
 * Environment Configuration
 * 
 * This module provides type-safe access to environment variables with validation
 * and default values. It centralizes all environment variable handling and
 * provides clear documentation for each variable.
 */

export interface EnvironmentConfig {
  // Core Configuration
  NODE_ENV: 'development' | 'production' | 'test';
  NEXT_PUBLIC_APP_URL?: string;
  
  // Mock Mode Settings
  USE_MOCK_API: boolean;
  USE_MOCK_OPENDOTA: boolean;
  USE_MOCK_DOTABUFF: boolean;
  USE_MOCK_STRATZ: boolean;
  USE_MOCK_D2PT: boolean;
  USE_MOCK_DB: boolean;
  WRITE_REAL_DATA_TO_MOCK: boolean;
  
  // Logging Configuration
  DEBUG_LOGGING: boolean;
  LOG_LEVEL: 'debug' | 'info' | 'warn' | 'error';
  LOG_FILE_PATH: string;
  
  // Redis Configuration
  REDIS_URL?: string;
  UPSTASH_REDIS_REST_URL?: string;
  UPSTASH_REDIS_REST_TOKEN?: string;
  USE_REDIS: boolean;
  
  // QStash Configuration
  QSTASH_TOKEN?: string;
  QSTASH_CURRENT_SIGNING_KEY?: string;
  QSTASH_NEXT_SIGNING_KEY?: string;
  USE_QSTASH: boolean;
  
  // Rate Limiting Configuration
  RATE_LIMIT_OPENDOTA: number;
  RATE_LIMIT_DOTABUFF: number;
  RATE_LIMIT_STRATZ: number;
  RATE_LIMIT_D2PT: number;
  RATE_LIMIT_WINDOW: number;
  
  // External API Configuration
  OPENDOTA_API_KEY?: string;
  OPENDOTA_API_BASE_URL: string;
  OPENDOTA_API_TIMEOUT: number;
  
  DOTABUFF_BASE_URL: string;
  DOTABUFF_REQUEST_DELAY: number;
  
  D2PT_BASE_URL: string;
  D2PT_REQUEST_DELAY: number;
  
  STRATZ_API_KEY?: string;
  STEAM_API_KEY?: string;
  
  // Vercel Deployment Configuration
  VERCEL_OIDC_TOKEN?: string;
  
  // Testing Configuration
  TEST_MOCK_MODE: boolean;
  TEST_TIMEOUT: number;
  CI: boolean;
}

// --- Helper functions for config groups ---
function getCoreConfig() {
  return {
    NODE_ENV: (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development',
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  };
}

function getMockConfig() {
  return {
    USE_MOCK_API: process.env.USE_MOCK_API === 'true',
    USE_MOCK_OPENDOTA: process.env.USE_MOCK_OPENDOTA === 'true',
    USE_MOCK_DOTABUFF: process.env.USE_MOCK_DOTABUFF === 'true',
    USE_MOCK_STRATZ: process.env.USE_MOCK_STRATZ === 'true',
    USE_MOCK_D2PT: process.env.USE_MOCK_D2PT === 'true',
    USE_MOCK_DB: process.env.USE_MOCK_DB === 'true',
    WRITE_REAL_DATA_TO_MOCK: process.env.WRITE_REAL_DATA_TO_MOCK === 'true',
  };
}

function getLoggingConfig() {
  return {
    DEBUG_LOGGING: process.env.DEBUG_LOGGING === 'true',
    LOG_LEVEL: (process.env.LOG_LEVEL as 'debug' | 'info' | 'warn' | 'error') || 'info',
    LOG_FILE_PATH: process.env.LOG_FILE_PATH || 'logs/server.log',
  };
}

function getRedisConfig() {
  return {
    REDIS_URL: process.env.REDIS_URL,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
    USE_REDIS: process.env.USE_REDIS === 'true',
  };
}

function getQStashConfig() {
  return {
    QSTASH_TOKEN: process.env.QSTASH_TOKEN,
    QSTASH_CURRENT_SIGNING_KEY: process.env.QSTASH_CURRENT_SIGNING_KEY,
    QSTASH_NEXT_SIGNING_KEY: process.env.QSTASH_NEXT_SIGNING_KEY,
    USE_QSTASH: process.env.USE_QSTASH === 'true',
  };
}

// Helper to parse number env vars with default
function parseNumberEnvVar(value: string | undefined, defaultValue: number): number {
  return value && value !== '' ? Number(value) : defaultValue;
}

function getRateLimitConfig() {
  return {
    RATE_LIMIT_OPENDOTA: parseNumberEnvVar(process.env.RATE_LIMIT_OPENDOTA, 60),
    RATE_LIMIT_DOTABUFF: parseNumberEnvVar(process.env.RATE_LIMIT_DOTABUFF, 60),
    RATE_LIMIT_STRATZ: parseNumberEnvVar(process.env.RATE_LIMIT_STRATZ, 20),
    RATE_LIMIT_D2PT: parseNumberEnvVar(process.env.RATE_LIMIT_D2PT, 30),
    RATE_LIMIT_WINDOW: parseNumberEnvVar(process.env.RATE_LIMIT_WINDOW, 60),
  };
}

function getExternalApiConfig() {
  return {
    OPENDOTA_API_KEY: process.env.OPENDOTA_API_KEY,
    OPENDOTA_API_BASE_URL: process.env.OPENDOTA_API_BASE_URL || 'https://api.opendota.com/api',
    OPENDOTA_API_TIMEOUT: process.env.OPENDOTA_API_TIMEOUT && process.env.OPENDOTA_API_TIMEOUT !== '' ? Number(process.env.OPENDOTA_API_TIMEOUT) : 10000,
    DOTABUFF_BASE_URL: process.env.DOTABUFF_BASE_URL || 'https://www.dotabuff.com',
    DOTABUFF_REQUEST_DELAY: process.env.DOTABUFF_REQUEST_DELAY && process.env.DOTABUFF_REQUEST_DELAY !== '' ? Number(process.env.DOTABUFF_REQUEST_DELAY) : 1000,
    D2PT_BASE_URL: process.env.D2PT_BASE_URL || 'https://dota2protracker.com',
    D2PT_REQUEST_DELAY: process.env.D2PT_REQUEST_DELAY && process.env.D2PT_REQUEST_DELAY !== '' ? Number(process.env.D2PT_REQUEST_DELAY) : 2000,
    STRATZ_API_KEY: process.env.STRATZ_API_KEY,
  };
}

function getVercelConfig() {
  return {
    VERCEL_OIDC_TOKEN: process.env.VERCEL_OIDC_TOKEN,
  };
}

function getTestingConfig() {
  return {
    TEST_MOCK_MODE: process.env.TEST_MOCK_MODE === 'true',
    TEST_TIMEOUT: process.env.TEST_TIMEOUT && process.env.TEST_TIMEOUT !== '' ? Number(process.env.TEST_TIMEOUT) : 10000,
    CI: process.env.CI === 'true',
  };
}

// --- Refactored parseEnvironmentVariables ---
function parseEnvironmentVariables(): EnvironmentConfig {
  return {
    ...getCoreConfig(),
    ...getMockConfig(),
    ...getLoggingConfig(),
    ...getRedisConfig(),
    ...getQStashConfig(),
    ...getRateLimitConfig(),
    ...getExternalApiConfig(),
    ...getVercelConfig(),
    ...getTestingConfig(),
  };
}

// --- Helper functions for validation ---
function validateEnum<T>(value: T, valid: T[], name: string, errors: string[]) {
  if (!valid.includes(value)) {
    errors.push(`Invalid ${name}: ${value}. Must be one of: ${valid.join(', ')}`);
  }
}

function validatePositiveNumber(value: number, name: string, errors: string[], allowZero = false) {
  if (allowZero ? value < 0 : value <= 0) {
    errors.push(`${name} must be greater than${allowZero ? ' or equal to' : ''} 0`);
  }
}

function validateUrlIfPresent(value: string | undefined, name: string, errors: string[]) {
  if (value && !isValidUrl(value)) {
    errors.push(`Invalid ${name}: ${value}`);
  }
}

/**
 * Validates the environment configuration
 */
function validateEnvironment(config: EnvironmentConfig): void {
  const errors: string[] = [];

  // Enums
  validateEnum(config.NODE_ENV, ['development', 'production', 'test'], 'NODE_ENV', errors);
  validateEnum(config.LOG_LEVEL, ['debug', 'info', 'warn', 'error'], 'LOG_LEVEL', errors);

  // Numbers
  [
    ['OPENDOTA_API_TIMEOUT', config.OPENDOTA_API_TIMEOUT],
    ['TEST_TIMEOUT', config.TEST_TIMEOUT],
    ['RATE_LIMIT_OPENDOTA', config.RATE_LIMIT_OPENDOTA],
    ['RATE_LIMIT_DOTABUFF', config.RATE_LIMIT_DOTABUFF],
    ['RATE_LIMIT_STRATZ', config.RATE_LIMIT_STRATZ],
    ['RATE_LIMIT_D2PT', config.RATE_LIMIT_D2PT],
    ['RATE_LIMIT_WINDOW', config.RATE_LIMIT_WINDOW],
  ].forEach(([name, value]) => validatePositiveNumber(Number(value), String(name), errors));

  // Allow zero for delays
  [
    ['DOTABUFF_REQUEST_DELAY', config.DOTABUFF_REQUEST_DELAY],
    ['D2PT_REQUEST_DELAY', config.D2PT_REQUEST_DELAY],
  ].forEach(([name, value]) => validatePositiveNumber(Number(value), String(name), errors, true));

  // URLs
  validateUrlIfPresent(config.OPENDOTA_API_BASE_URL, 'OPENDOTA_API_BASE_URL', errors);
  validateUrlIfPresent(config.DOTABUFF_BASE_URL, 'DOTABUFF_BASE_URL', errors);
  validateUrlIfPresent(config.D2PT_BASE_URL, 'D2PT_BASE_URL', errors);

  if (errors.length > 0) {
    throw new Error(`Environment validation failed:\n${errors.join('\n')}`);
  }
}

/**
 * Validates if a string is a valid URL
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// --- Helper functions for documentation sections ---
function docsCoreConfig() {
  return `## Core Configuration

### NODE_ENV
- **Type**: 'development' | 'production' | 'test'
- **Default**: 'development'
- **Description**: The environment the application is running in

### NEXT_PUBLIC_APP_URL
- **Type**: string
- **Default**: undefined
- **Description**: The public URL of the application
`;
}
function docsMockConfig() {
  return `## Mock Mode Settings

### USE_MOCK_API
- **Type**: boolean
- **Default**: false
- **Description**: Enable mock mode for all external APIs

### USE_MOCK_OPENDOTA
- **Type**: boolean
- **Default**: false
- **Description**: Enable mock mode for OpenDota API

### USE_MOCK_DOTABUFF
- **Type**: boolean
- **Default**: false
- **Description**: Enable mock mode for Dotabuff API

### USE_MOCK_STRATZ
- **Type**: boolean
- **Default**: false
- **Description**: Enable mock mode for Stratz API

### USE_MOCK_D2PT
- **Type**: boolean
- **Default**: false
- **Description**: Enable mock mode for Dota2ProTracker API

### USE_MOCK_DB
- **Type**: boolean
- **Default**: false
- **Description**: Enable mock mode for database operations

### WRITE_REAL_DATA_TO_MOCK
- **Type**: boolean
- **Default**: false
- **Description**: Write real API responses to mock data files
`;
}
function docsLoggingConfig() {
  return `## Logging Configuration

### DEBUG_LOGGING
- **Type**: boolean
- **Default**: false
- **Description**: Enable debug logging

### LOG_LEVEL
- **Type**: 'debug' | 'info' | 'warn' | 'error'
- **Default**: 'info'
- **Description**: Logging level

### LOG_FILE_PATH
- **Type**: string
- **Default**: 'logs/server.log'
- **Description**: Path to log file
`;
}
function docsRedisConfig() {
  return `## Redis Configuration

### REDIS_URL
- **Type**: string
- **Default**: undefined
- **Description**: Redis connection URL

### UPSTASH_REDIS_REST_URL
- **Type**: string
- **Default**: undefined
- **Description**: Upstash Redis REST API URL

### UPSTASH_REDIS_REST_TOKEN
- **Type**: string
- **Default**: undefined
- **Description**: Upstash Redis REST API token

### USE_REDIS
- **Type**: boolean
- **Default**: false
- **Description**: Enable Redis for caching and rate limiting
`;
}
function docsQStashConfig() {
  return `## QStash Configuration

### QSTASH_TOKEN
- **Type**: string
- **Default**: undefined
- **Description**: QStash API token

### QSTASH_CURRENT_SIGNING_KEY
- **Type**: string
- **Default**: undefined
- **Description**: QStash current signing key

### QSTASH_NEXT_SIGNING_KEY
- **Type**: string
- **Default**: undefined
- **Description**: QStash next signing key

### USE_QSTASH
- **Type**: boolean
- **Default**: false
- **Description**: Enable QStash for background job processing
`;
}
function docsRateLimitConfig() {
  return `## Rate Limiting Configuration

### RATE_LIMIT_OPENDOTA
- **Type**: number
- **Default**: 60
- **Description**: Rate limit for OpenDota API (requests per minute)

### RATE_LIMIT_DOTABUFF
- **Type**: number
- **Default**: 60
- **Description**: Rate limit for Dotabuff API (requests per minute)

### RATE_LIMIT_STRATZ
- **Type**: number
- **Default**: 20
- **Description**: Rate limit for Stratz API (requests per minute)

### RATE_LIMIT_D2PT
- **Type**: number
- **Default**: 30
- **Description**: Rate limit for Dota2ProTracker API (requests per minute)

### RATE_LIMIT_WINDOW
- **Type**: number
- **Default**: 60
- **Description**: Rate limiting window in seconds
`;
}
function docsExternalApiConfig() {
  return `## External API Configuration

### OPENDOTA_API_KEY
- **Type**: string
- **Default**: undefined
- **Description**: OpenDota API key

### OPENDOTA_API_BASE_URL
- **Type**: string
- **Default**: 'https://api.opendota.com/api'
- **Description**: OpenDota API base URL

### OPENDOTA_API_TIMEOUT
- **Type**: number
- **Default**: 10000
- **Description**: OpenDota API timeout in milliseconds

### DOTABUFF_BASE_URL
- **Type**: string
- **Default**: 'https://www.dotabuff.com'
- **Description**: Dotabuff base URL

### DOTABUFF_REQUEST_DELAY
- **Type**: number
- **Default**: 1000
- **Description**: Delay between Dotabuff requests in milliseconds

### D2PT_BASE_URL
- **Type**: string
- **Default**: 'https://dota2protracker.com'
- **Description**: Dota2ProTracker base URL

### D2PT_REQUEST_DELAY
- **Type**: number
- **Default**: 2000
- **Description**: Delay between Dota2ProTracker requests in milliseconds

### STRATZ_API_KEY
- **Type**: string
- **Default**: undefined
- **Description**: Stratz API key
`;
}
function docsVercelConfig() {
  return `## Vercel Deployment Configuration

### VERCEL_OIDC_TOKEN
- **Type**: string
- **Default**: undefined
- **Description**: Vercel OIDC token for deployment
`;
}
function docsTestingConfig() {
  return `## Testing Configuration

### TEST_MOCK_MODE
- **Type**: boolean
- **Default**: false
- **Description**: Enable mock mode for tests

### TEST_TIMEOUT
- **Type**: number
- **Default**: 10000
- **Description**: Test timeout in milliseconds

### CI
- **Type**: boolean
- **Default**: false
- **Description**: Whether running in CI environment
`;
}

/**
 * Generates environment variable documentation
 */
export function generateEnvironmentDocs(): string {
  return [
    '# Environment Variables Documentation',
    docsCoreConfig(),
    docsMockConfig(),
    docsLoggingConfig(),
    docsRedisConfig(),
    docsQStashConfig(),
    docsRateLimitConfig(),
    docsExternalApiConfig(),
    docsVercelConfig(),
    docsTestingConfig(),
  ].join('\n');
}

/**
 * Loads and validates the environment configuration (for testability)
 */
export function loadAndValidateEnv(overrideNodeEnv?: string): EnvironmentConfig {
  const config = parseEnvironmentVariables();
  const nodeEnv = overrideNodeEnv || config.NODE_ENV;
  if (nodeEnv !== 'test') {
    validateEnvironment(config);
  }
  return config;
}

// Parse environment variables ONCE for the top-level export
const envConfig = parseEnvironmentVariables();

// Export the configuration
export const env = envConfig;

// Validate in non-test environments
if (envConfig.NODE_ENV !== 'test') {
  validateEnvironment(envConfig);
}

// Export individual getters for type safety
export const getEnv = {
  NODE_ENV: () => envConfig.NODE_ENV,
  NEXT_PUBLIC_APP_URL: () => envConfig.NEXT_PUBLIC_APP_URL,
  USE_MOCK_API: () => envConfig.USE_MOCK_API,
  USE_MOCK_OPENDOTA: () => envConfig.USE_MOCK_OPENDOTA,
  USE_MOCK_DOTABUFF: () => envConfig.USE_MOCK_DOTABUFF,
  USE_MOCK_STRATZ: () => envConfig.USE_MOCK_STRATZ,
  USE_MOCK_D2PT: () => envConfig.USE_MOCK_D2PT,
  USE_MOCK_DB: () => envConfig.USE_MOCK_DB,
  WRITE_REAL_DATA_TO_MOCK: () => envConfig.WRITE_REAL_DATA_TO_MOCK,
  DEBUG_LOGGING: () => envConfig.DEBUG_LOGGING,
  LOG_LEVEL: () => envConfig.LOG_LEVEL,
  LOG_FILE_PATH: () => envConfig.LOG_FILE_PATH,
  REDIS_URL: () => envConfig.REDIS_URL,
  UPSTASH_REDIS_REST_URL: () => envConfig.UPSTASH_REDIS_REST_URL,
  UPSTASH_REDIS_REST_TOKEN: () => envConfig.UPSTASH_REDIS_REST_TOKEN,
  USE_REDIS: () => envConfig.USE_REDIS,
  QSTASH_TOKEN: () => envConfig.QSTASH_TOKEN,
  QSTASH_CURRENT_SIGNING_KEY: () => envConfig.QSTASH_CURRENT_SIGNING_KEY,
  QSTASH_NEXT_SIGNING_KEY: () => envConfig.QSTASH_NEXT_SIGNING_KEY,
  USE_QSTASH: () => envConfig.USE_QSTASH,
  RATE_LIMIT_OPENDOTA: () => envConfig.RATE_LIMIT_OPENDOTA,
  RATE_LIMIT_DOTABUFF: () => envConfig.RATE_LIMIT_DOTABUFF,
  RATE_LIMIT_STRATZ: () => envConfig.RATE_LIMIT_STRATZ,
  RATE_LIMIT_D2PT: () => envConfig.RATE_LIMIT_D2PT,
  RATE_LIMIT_WINDOW: () => envConfig.RATE_LIMIT_WINDOW,
  OPENDOTA_API_KEY: () => envConfig.OPENDOTA_API_KEY,
  OPENDOTA_API_BASE_URL: () => envConfig.OPENDOTA_API_BASE_URL,
  OPENDOTA_API_TIMEOUT: () => envConfig.OPENDOTA_API_TIMEOUT,
  DOTABUFF_BASE_URL: () => envConfig.DOTABUFF_BASE_URL,
  DOTABUFF_REQUEST_DELAY: () => envConfig.DOTABUFF_REQUEST_DELAY,
  D2PT_BASE_URL: () => envConfig.D2PT_BASE_URL,
  D2PT_REQUEST_DELAY: () => envConfig.D2PT_REQUEST_DELAY,
  STRATZ_API_KEY: () => envConfig.STRATZ_API_KEY,
  VERCEL_OIDC_TOKEN: () => envConfig.VERCEL_OIDC_TOKEN,
  TEST_MOCK_MODE: () => envConfig.TEST_MOCK_MODE,
  TEST_TIMEOUT: () => envConfig.TEST_TIMEOUT,
  CI: () => envConfig.CI,
}; 