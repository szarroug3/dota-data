/**
 * Cache key utilities tests
 */

import {
    CacheKeyBuilderImpl,
    buildApiKey,
    buildConfigKey,
    buildHeroKey,
    buildIdentifierPattern,
    buildJobKey,
    buildLeagueKey,
    buildMatchKey,
    buildNamespacePattern,
    buildPlayerKey,
    buildRateLimitKey,
    buildTeamKey,
    cacheKeyBuilder
} from '@/lib/utils/cache-keys';

describe('CacheKeyBuilderImpl', () => {
  let builder: CacheKeyBuilderImpl;

  beforeEach(() => {
    builder = new CacheKeyBuilderImpl();
  });

  describe('build', () => {
    it('should build cache key with namespace and identifier', () => {
      const key = builder.build('hero', '123');
      expect(key).toBe('hero:123');
    });

    it('should build cache key with additional parts', () => {
      const key = builder.build('player', '456', 'profile', 'stats');
      expect(key).toBe('player:456:profile:stats');
    });

    it('should sanitize key parts', () => {
      const key = builder.build('hero', 'Anti-Mage', 'stats');
      expect(key).toBe('hero:anti_mage:stats');
    });

    it('should handle empty parts', () => {
      const key = builder.build('hero', '123', '', 'stats');
      expect(key).toBe('hero:123:stats');
    });

    it('should throw error for key too long', () => {
      const longPart = 'a'.repeat(300);
      expect(() => builder.build('hero', longPart)).toThrow('Cache key too long');
    });
  });

  describe('buildPattern', () => {
    it('should build pattern for cache invalidation', () => {
      const pattern = builder.buildPattern('hero', '*');
      expect(pattern).toBe('hero:*');
    });

    it('should sanitize pattern', () => {
      const pattern = builder.buildPattern('hero', 'Anti-Mage*');
      expect(pattern).toBe('hero:anti_mage*');
    });
  });

  describe('parse', () => {
    it('should parse valid cache key', () => {
      const result = builder.parse('hero:123:stats');
      expect(result).toEqual({
        namespace: 'hero',
        identifier: '123',
        parts: ['stats']
      });
    });

    it('should parse key with multiple parts', () => {
      const result = builder.parse('player:456:profile:stats:recent');
      expect(result).toEqual({
        namespace: 'player',
        identifier: '456',
        parts: ['profile', 'stats', 'recent']
      });
    });

    it('should return null for invalid key', () => {
      const result = builder.parse('invalid-key');
      expect(result).toBeNull();
    });

    it('should return null for empty key', () => {
      const result = builder.parse('');
      expect(result).toBeNull();
    });

    it('should return null for key without separator', () => {
      const result = builder.parse('hero123');
      expect(result).toBeNull();
    });
  });

  describe('custom configuration', () => {
    it('should use custom separator', () => {
      const customBuilder = new CacheKeyBuilderImpl({ separator: '-' });
      const key = customBuilder.build('hero', '123');
      expect(key).toBe('hero-123');
    });

    it('should use custom max length', () => {
      const customBuilder = new CacheKeyBuilderImpl({ maxLength: 10 });
      expect(() => customBuilder.build('hero', '123456789')).toThrow('Cache key too long');
    });
  });
});

describe('Global cache key builder', () => {
  it('should be instance of CacheKeyBuilderImpl', () => {
    expect(cacheKeyBuilder).toBeInstanceOf(CacheKeyBuilderImpl);
  });

  it('should build keys correctly', () => {
    const key = cacheKeyBuilder.build('hero', '123');
    expect(key).toBe('hero:123');
  });
});

describe('Convenience functions', () => {
  describe('buildApiKey', () => {
    it('should build API cache key', () => {
      const key = buildApiKey('/api/heroes');
      expect(key).toBe('api:/api/heroes');
    });

    it('should build API cache key with params', () => {
      const key = buildApiKey('/api/players', { id: '123', force: 'true' });
      expect(key).toBe('api:/api/players:force=true&id=123');
    });

    it('should sort params alphabetically', () => {
      const key = buildApiKey('/api/players', { z: '3', a: '1', m: '2' });
      expect(key).toBe('api:/api/players:a=1&m=2&z=3');
    });
  });

  describe('buildHeroKey', () => {
    it('should build hero cache key', () => {
      const key = buildHeroKey('123');
      expect(key).toBe('hero:123');
    });
  });

  describe('buildPlayerKey', () => {
    it('should build player cache key with default data type', () => {
      const key = buildPlayerKey('456');
      expect(key).toBe('player:456:profile');
    });

    it('should build player cache key with custom data type', () => {
      const key = buildPlayerKey('456', 'matches');
      expect(key).toBe('player:456:matches');
    });
  });

  describe('buildTeamKey', () => {
    it('should build team cache key', () => {
      const key = buildTeamKey('789');
      expect(key).toBe('team:789');
    });
  });

  describe('buildMatchKey', () => {
    it('should build match cache key', () => {
      const key = buildMatchKey('101112');
      expect(key).toBe('match:101112');
    });
  });

  describe('buildLeagueKey', () => {
    it('should build league cache key', () => {
      const key = buildLeagueKey('131415');
      expect(key).toBe('league:131415');
    });
  });

  describe('buildRateLimitKey', () => {
    it('should build rate limit cache key', () => {
      const key = buildRateLimitKey('opendota', 'user:123');
      expect(key).toBe('rate_limit:opendota:user_123');
    });
  });

  describe('buildJobKey', () => {
    it('should build job cache key with default status', () => {
      const key = buildJobKey('job-123');
      expect(key).toBe('job:job_123:status');
    });

    it('should build job cache key with custom status', () => {
      const key = buildJobKey('job-123', 'progress');
      expect(key).toBe('job:job_123:progress');
    });
  });

  describe('buildConfigKey', () => {
    it('should build config cache key', () => {
      const key = buildConfigKey('dashboard');
      expect(key).toBe('config:dashboard');
    });
  });

  describe('Pattern building functions', () => {
    describe('buildNamespacePattern', () => {
      it('should build pattern for all keys in namespace', () => {
        const pattern = buildNamespacePattern('hero');
        expect(pattern).toBe('hero:*');
      });
    });

    describe('buildIdentifierPattern', () => {
      it('should build pattern for all keys with specific identifier', () => {
        const pattern = buildIdentifierPattern('player', '123');
        expect(pattern).toBe('player:123:*');
      });
    });
  });
});

describe('Key sanitization', () => {
  let builder: CacheKeyBuilderImpl;

  beforeEach(() => {
    builder = new CacheKeyBuilderImpl();
  });

  it('should sanitize special characters', () => {
    const key = builder.build('hero', 'Anti-Mage (Carry)');
    expect(key).toBe('hero:anti_mage_carry_');
  });

  it('should convert to lowercase', () => {
    const key = builder.build('hero', 'ANTI-MAGE');
    expect(key).toBe('hero:anti_mage');
  });

  it('should handle multiple underscores', () => {
    const key = builder.build('hero', 'Anti--Mage');
    expect(key).toBe('hero:anti_mage');
  });

  it('should handle leading/trailing spaces', () => {
    const key = builder.build('hero', '  Anti-Mage  ');
    expect(key).toBe('hero:anti_mage');
  });
});

describe('Error handling', () => {
  let builder: CacheKeyBuilderImpl;

  beforeEach(() => {
    builder = new CacheKeyBuilderImpl();
  });

  it('should throw error for key exceeding max length', () => {
    const longKey = 'a'.repeat(300);
    expect(() => builder.build('hero', longKey)).toThrow('Cache key too long');
  });

  it('should throw error for pattern exceeding max length', () => {
    const longPattern = 'a'.repeat(300);
    expect(() => builder.buildPattern('hero', longPattern)).toThrow('Cache pattern too long');
  });
}); 