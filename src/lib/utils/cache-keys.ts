/**
 * Cache key generation utilities
 *
 * Provides consistent cache key formatting and parsing across the application.
 * All cache keys follow the pattern: namespace:identifier:part1:part2...
 */

import { CacheKeyBuilder, CacheKeyConfig, CacheNamespace } from '@/types/cache';

/**
 * Default cache key configuration
 */
const DEFAULT_CONFIG: CacheKeyConfig = {
  separator: ':',
  maxLength: 250,
  encoding: 'utf8'
};

/**
 * Cache key builder implementation
 */
export class CacheKeyBuilderImpl implements CacheKeyBuilder {
  private config: CacheKeyConfig;

  constructor(config: Partial<CacheKeyConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Build a cache key with namespace and identifier
   */
  build(namespace: CacheNamespace, identifier: string, ...parts: string[]): string {
    const allParts = [namespace, identifier, ...parts];
    const key = allParts
      .filter(part => part && part.trim())
      .map(part => this.sanitizePart(part))
      .join(this.config.separator);

    if (key.length > this.config.maxLength) {
      throw new Error(`Cache key too long: ${key.length} > ${this.config.maxLength}`);
    }

    return key;
  }

  /**
   * Build a pattern for cache invalidation
   */
  buildPattern(namespace: CacheNamespace, pattern: string): string {
    // Sanitize the pattern but preserve wildcards and colons
    const safePattern = this.sanitizePattern(pattern);
    const key = `${namespace}${this.config.separator}${safePattern}`;
    if (key.length > this.config.maxLength) {
      throw new Error(`Cache pattern too long: ${key.length} > ${this.config.maxLength}`);
    }
    return key;
  }

  /**
   * Parse a cache key into its components
   */
  parse(key: string): {
    namespace: CacheNamespace;
    identifier: string;
    parts: string[];
  } | null {
    if (!key || !key.includes(this.config.separator)) {
      return null;
    }

    const parts = key.split(this.config.separator);
    if (parts.length < 2) {
      return null;
    }

    const namespace = parts[0] as CacheNamespace;
    const identifier = parts[1];
    const remainingParts = parts.slice(2);

    return {
      namespace,
      identifier,
      parts: remainingParts
    };
  }

  /**
   * Sanitize a cache key part
   */
  private sanitizePart(part: string): string {
    return part
      .trim()
      .replace(/[^a-zA-Z0-9]/g, '_') // replace all non-alphanumeric with _
      .replace(/_+/g, '_')           // collapse multiple underscores
      .toLowerCase();
  }

  /**
   * Sanitize a pattern while preserving wildcards and colons
   */
  private sanitizePattern(pattern: string): string {
    return pattern
      .trim()
      .replace(/[^a-zA-Z0-9*:]/g, '_') // replace non-alphanumeric (except * and :) with _
      .replace(/_+/g, '_')             // collapse multiple underscores
      .replace(/^_+|_+$/g, '')         // remove leading/trailing underscores
      .toLowerCase();
  }
}

/**
 * Global cache key builder instance
 */
export const cacheKeyBuilder = new CacheKeyBuilderImpl();

/**
 * Convenience functions for common cache key patterns
 */

/**
 * Build an API cache key
 */
export function buildApiKey(endpoint: string, params: Record<string, string | number> = {}): string {
  const paramString = Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('&');
  
  // Don't sanitize endpoint and params for API keys
  const key = ['api', endpoint, paramString]
    .filter(part => part && part.trim())
    .join(':');
  
  if (key.length > 250) {
    throw new Error(`Cache key too long: ${key.length} > 250`);
  }
  
  return key;
}

/**
 * Build a hero cache key
 */
export function buildHeroKey(heroId: string): string {
  return cacheKeyBuilder.build('hero', heroId);
}

/**
 * Build a player cache key
 */
export function buildPlayerKey(playerId: string, dataType?: string): string {
  return cacheKeyBuilder.build('player', playerId, dataType || 'profile');
}

/**
 * Build a team cache key
 */
export function buildTeamKey(teamId: string): string {
  return cacheKeyBuilder.build('team', teamId);
}

/**
 * Build a match cache key
 */
export function buildMatchKey(matchId: string): string {
  return cacheKeyBuilder.build('match', matchId);
}

/**
 * Build a league cache key
 */
export function buildLeagueKey(leagueId: string): string {
  return cacheKeyBuilder.build('league', leagueId);
}

/**
 * Build a rate limit cache key
 */
export function buildRateLimitKey(service: string, identifier: string): string {
  return cacheKeyBuilder.build('rate-limit', service, identifier);
}

/**
 * Build a job cache key
 */
export function buildJobKey(jobId: string, status?: string): string {
  return cacheKeyBuilder.build('job', jobId, status || 'status');
}

/**
 * Build a config cache key
 */
export function buildConfigKey(configId: string): string {
  return cacheKeyBuilder.build('config', configId);
}

/**
 * Build a pattern for invalidating all keys in a namespace
 */
export function buildNamespacePattern(namespace: CacheNamespace): string {
  return cacheKeyBuilder.buildPattern(namespace, '*');
}

/**
 * Build a pattern for invalidating all keys with a specific identifier
 */
export function buildIdentifierPattern(namespace: CacheNamespace, identifier: string): string {
  // Do not sanitize the colon between identifier and wildcard
  return cacheKeyBuilder.buildPattern(namespace, `${identifier}:*`);
} 