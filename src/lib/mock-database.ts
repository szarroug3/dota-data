import { logWithTimestampToFile } from './server-logger';

class MockDatabase {
  private storage: Map<string, unknown> = new Map();

  async get(key: string): Promise<unknown> {
    logWithTimestampToFile('log', `[MockDatabase] GET called for key: ${key}`);
    const value = this.storage.get(key);
    logWithTimestampToFile('log', `[MockDatabase] GET result for key ${key}:`, value ? 'found' : 'not found');
    return value;
  }

  async set(key: string, value: unknown): Promise<void> {
    logWithTimestampToFile('log', `[MockDatabase] SET called for key: ${key}`);
    this.storage.set(key, value);
    logWithTimestampToFile('log', `[MockDatabase] SET completed for key: ${key}`);
  }

  async setex(key: string, ttlSeconds: number, value: unknown): Promise<void> {
    logWithTimestampToFile('log', `[MockDatabase] SETEX called for key: ${key}, ttl: ${ttlSeconds}s`);
    // For mock database, we'll store the value with a timestamp for TTL simulation
    const entry = {
      value,
      expiresAt: Date.now() + (ttlSeconds * 1000)
    };
    this.storage.set(key, entry);
    logWithTimestampToFile('log', `[MockDatabase] SETEX completed for key: ${key}`);
  }

  async del(...keys: string[]): Promise<number> {
    logWithTimestampToFile('log', `[MockDatabase] DEL called for keys:`, keys);
    let deleted = 0;
    for (const key of keys) {
      if (this.storage.has(key)) {
        this.storage.delete(key);
        deleted++;
      }
    }
    logWithTimestampToFile('log', `[MockDatabase] DEL result: ${deleted} keys deleted`);
    return deleted;
  }

  async mget(keys: string[]): Promise<unknown[]> {
    logWithTimestampToFile('log', `[MockDatabase] MGET called for keys:`, keys);
    const results = keys.map(key => {
      const entry = this.storage.get(key) as { value?: unknown; expiresAt?: number };
      if (entry && entry.expiresAt && Date.now() > entry.expiresAt) {
        // TTL expired, remove the entry
        this.storage.delete(key);
        return null;
      }
      return entry?.value || null;
    });
    logWithTimestampToFile('log', `[MockDatabase] MGET result:`, results.map((r, i) => `${keys[i]}: ${r ? 'found' : 'not found'}`));
    return results;
  }

  async keys(pattern: string): Promise<string[]> {
    logWithTimestampToFile('log', `[MockDatabase] KEYS called for pattern: ${pattern}`);
    const allKeys = Array.from(this.storage.keys());
    // Simple pattern matching - convert glob pattern to regex
    const regexPattern = pattern.replace(/\*/g, '.*').replace(/\?/g, '.');
    const regex = new RegExp(regexPattern);
    const matchingKeys = allKeys.filter(key => regex.test(key));
    logWithTimestampToFile('log', `[MockDatabase] KEYS result: ${matchingKeys.length} keys match pattern`);
    return matchingKeys;
  }

  clear(): void {
    logWithTimestampToFile('log', `[MockDatabase] CLEAR called`);
    this.storage.clear();
    logWithTimestampToFile('log', `[MockDatabase] CLEAR completed`);
  }

  getStats(): { totalEntries: number; totalSize: number } {
    const totalEntries = this.storage.size;
    let totalSize = 0;
    for (const [key, value] of this.storage) {
      totalSize += JSON.stringify(key).length + JSON.stringify(value).length;
    }
    return { totalEntries, totalSize };
  }
}

export default MockDatabase; 