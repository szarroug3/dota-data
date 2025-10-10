/**
 * File-based cache backend for mock mode
 *
 * Stores cache data as JSON files in the cached-data folder using cache keys as filenames.
 * This simulates Redis behavior when in mock mode.
 */

import fs from 'fs/promises';
import path from 'path';

import { CacheBackend, CacheStats, CacheValue } from '@/types/cache';

interface CacheEntry {
  value: CacheValue;
  expiresAt?: number;
}

export class FileCacheBackend implements CacheBackend {
  private basePath: string;

  constructor() {
    this.basePath = path.join(process.cwd(), 'mock-data', 'cached-data');
  }

  private getFilePath(key: string): string {
    // Sanitize key to be filesystem-safe
    const sanitizedKey = key.replace(/[^a-zA-Z0-9._-]/g, '_');
    return path.join(this.basePath, `${sanitizedKey}.json`);
  }

  private async ensureDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.basePath, { recursive: true });
    } catch {
      // Directory might already exist, ignore error
    }
  }

  private isExpired(entry: CacheEntry): boolean {
    if (!entry.expiresAt) return false;
    return Date.now() > entry.expiresAt;
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      await this.ensureDirectory();
      const filePath = this.getFilePath(key);
      const data = await fs.readFile(filePath, 'utf-8');
      const entry: CacheEntry = JSON.parse(data);

      if (this.isExpired(entry)) {
        await this.delete(key);
        return null;
      }

      return entry.value as T;
    } catch {
      return null;
    }
  }

  async set(key: string, value: CacheValue, ttl?: number): Promise<void> {
    try {
      await this.ensureDirectory();
      const filePath = this.getFilePath(key);

      const entry: CacheEntry = {
        value,
        expiresAt: ttl ? Date.now() + ttl * 1000 : undefined,
      };

      await fs.writeFile(filePath, JSON.stringify(entry, null, 2), 'utf-8');
    } catch (error) {
      throw new Error(`Failed to write cache file for key ${key}: ${error}`);
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      const filePath = this.getFilePath(key);
      await fs.unlink(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const filePath = this.getFilePath(key);
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async mget(keys: string[]): Promise<(CacheValue | null)[]> {
    const results = await Promise.all(keys.map((key) => this.get(key)));
    return results as (CacheValue | null)[];
  }

  async mset(entries: Array<{ key: string; value: CacheValue; ttl?: number }>): Promise<void> {
    await Promise.all(entries.map((entry) => this.set(entry.key, entry.value, entry.ttl)));
  }

  async mdelete(keys: string[]): Promise<number> {
    const results = await Promise.all(keys.map((key) => this.delete(key)));
    return results.filter(Boolean).length;
  }

  async invalidatePattern(pattern: string): Promise<number> {
    try {
      await this.ensureDirectory();
      const files = await fs.readdir(this.basePath);

      // Convert pattern to regex (simple glob to regex conversion)
      const regexPattern = pattern.replace(/\*/g, '.*').replace(/\?/g, '.');
      const regex = new RegExp(`^${regexPattern}$`);

      const matchingFiles = files.filter((file) => {
        const key = file.replace(/\.json$/, '').replace(/_/g, ':');
        return regex.test(key);
      });

      let deletedCount = 0;
      for (const file of matchingFiles) {
        const filePath = path.join(this.basePath, file);
        try {
          await fs.unlink(filePath);
          deletedCount++;
        } catch {
          // Ignore errors for individual file deletions
        }
      }

      return deletedCount;
    } catch {
      return 0;
    }
  }

  async getStats(): Promise<CacheStats> {
    try {
      await this.ensureDirectory();
      const files = await fs.readdir(this.basePath);

      let totalSize = 0;

      for (const file of files) {
        if (!file.endsWith('.json')) continue;

        const filePath = path.join(this.basePath, file);
        try {
          const stats = await fs.stat(filePath);
          totalSize += stats.size;
        } catch {
          // Ignore individual file errors
        }
      }

      return {
        keys: files.filter((f) => f.endsWith('.json')).length,
        memoryUsage: totalSize,
        uptime: 0, // File backend doesn't track uptime
        backend: 'file' as const,
        hitRate: 0, // File backend doesn't track hit rate
        missRate: 0, // File backend doesn't track miss rate
      };
    } catch {
      return {
        keys: 0,
        memoryUsage: 0,
        uptime: 0,
        backend: 'file' as const,
        hitRate: 0,
        missRate: 0,
      };
    }
  }

  async clear(): Promise<void> {
    try {
      await this.ensureDirectory();
      const files = await fs.readdir(this.basePath);

      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(this.basePath, file);
          try {
            await fs.unlink(filePath);
          } catch {
            // Ignore individual file errors
          }
        }
      }
    } catch {
      // Ignore clear errors
    }
  }

  async isHealthy(): Promise<boolean> {
    try {
      await this.ensureDirectory();
      return true;
    } catch {
      return false;
    }
  }
}
