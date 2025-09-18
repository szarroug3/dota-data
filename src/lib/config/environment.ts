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
  USE_MOCK_STEAM: boolean;
  USE_MOCK_DB: boolean;
  WRITE_REAL_DATA_TO_MOCK: boolean;

  // External API Configuration
  OPENDOTA_API_KEY?: string;
  STEAM_API_KEY?: string;

  // Testing Configuration
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
    USE_MOCK_STEAM: process.env.USE_MOCK_STEAM === 'true',
    USE_MOCK_DB: process.env.USE_MOCK_DB === 'true',
    WRITE_REAL_DATA_TO_MOCK: process.env.WRITE_REAL_DATA_TO_MOCK === 'true',
  };
}

function getExternalApiConfig() {
  return {
    OPENDOTA_API_KEY: process.env.OPENDOTA_API_KEY,
    STEAM_API_KEY: process.env.STEAM_API_KEY,
  };
}

function getTestingConfig() {
  return {
    CI: process.env.CI === 'true',
  };
}

// --- Refactored parseEnvironmentVariables ---
function parseEnvironmentVariables(): EnvironmentConfig {
  return {
    ...getCoreConfig(),
    ...getMockConfig(),
    ...getExternalApiConfig(),
    ...getTestingConfig(),
  };
}

// --- Helper functions for validation ---
function validateEnum<T>(value: T, valid: T[], name: string, errors: string[]) {
  if (!valid.includes(value)) {
    errors.push(`Invalid ${name}: ${value}. Must be one of: ${valid.join(', ')}`);
  }
}

/**
 * Validates the environment configuration
 */
function validateEnvironment(config: EnvironmentConfig): void {
  const errors: string[] = [];

  // Enums
  validateEnum(config.NODE_ENV, ['development', 'production', 'test'], 'NODE_ENV', errors);

  if (errors.length > 0) {
    throw new Error(`Environment validation failed:\n${errors.join('\n')}`);
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

### USE_MOCK_STEAM
- **Type**: boolean
- **Default**: false
- **Description**: Enable mock mode for Steam API

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
function docsExternalApiConfig() {
  return `## External API Configuration

### OPENDOTA_API_KEY
- **Type**: string
- **Default**: undefined
- **Description**: OpenDota API key
 
### STEAM_API_KEY
- **Type**: string
- **Default**: undefined
- **Description**: Steam API key
`;
}

function docsTestingConfig() {
  return `## Testing Configuration

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
    docsExternalApiConfig(),
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
  USE_MOCK_STEAM: () => envConfig.USE_MOCK_STEAM,
  USE_MOCK_DB: () => envConfig.USE_MOCK_DB,
  WRITE_REAL_DATA_TO_MOCK: () => envConfig.WRITE_REAL_DATA_TO_MOCK,
  OPENDOTA_API_KEY: () => envConfig.OPENDOTA_API_KEY,
  STEAM_API_KEY: () => envConfig.STEAM_API_KEY,
  CI: () => envConfig.CI,
};
