/**
 * Data transformation utilities
 *
 * Provides consistent data transformation functions
 * for processing API data across different endpoints.
 */

// Define specific types for data structures
export type TransformableValue = string | number | boolean | null | undefined;
// Fix 1: Redefine TransformableObject to avoid circular reference
export type TransformableObject = { [key: string]: TransformableValue | TransformableObject | TransformableObject[] };
export type TransformerFunction<T = TransformableValue> = (value: T) => TransformableValue;
export type DeepTransformerFunction = (value: TransformableValue | TransformableObject | TransformableObject[]) => TransformableValue | TransformableObject | TransformableObject[];

export interface TransformationOptions {
  includeNulls?: boolean;
  dateFormat?: 'iso' | 'unix' | 'relative';
  numberFormat?: 'raw' | 'formatted' | 'percentage';
  stringCase?: 'lower' | 'upper' | 'title' | 'camel' | 'snake';
  arrayLimit?: number;
  objectDepth?: number;
}

export interface HeroData {
  name?: string;
  complexity?: string;
  primaryAttribute?: string;
  winRate?: number;
  pickRate?: number;
  banRate?: number;
  lastUpdated?: string | number | Date;
  attributes?: {
    complexity?: string;
    primaryAttribute?: string;
    roles?: string[];
  };
  meta?: {
    tier?: string;
  };
}

export interface MatchData {
  startTime?: string | number | Date;
  endTime?: string | number | Date;
  duration?: number;
  gameMode?: string;
  lobbyType?: string;
  radiantWin?: boolean;
  firstBloodTime?: number;
  lastUpdated?: string | number | Date;
}

export interface PlayerData {
  name?: string;
  profileUrl?: string;
  avatarUrl?: string;
  mmrEstimate?: number;
  winRate?: number;
  lastMatchTime?: string | number | Date;
  lastUpdated?: string | number | Date;
}

export interface TeamData {
  name?: string;
  tag?: string;
  logoUrl?: string;
  rating?: number;
  winRate?: number;
  lastMatchTime?: string | number | Date;
  lastUpdated?: string | number | Date;
}

export interface StatsData {
  kills?: number;
  deaths?: number;
  assists?: number;
  gpm?: number;
  xpm?: number;
  heroDamage?: number;
  towerDamage?: number;
  heroHealing?: number;
  lastHits?: number;
  denies?: number;
}

/**
 * Data transformation utility class
 */
export class DataTransformer {
  /**
   * Transform dates to consistent format
   */
  static transformDate(date: Date | string | number | null, format: 'iso' | 'unix' | 'relative' = 'iso'): string | number | null {
    if (!date) return null;

    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return null;

    switch (format) {
      case 'iso':
        return dateObj.toISOString();
      case 'unix':
        return Math.floor(dateObj.getTime() / 1000);
      case 'relative':
        return this.getRelativeTime(dateObj);
      default:
        return dateObj.toISOString();
    }
  }

  /**
   * Transform numbers to consistent format
   */
  static transformNumber(num: number | string | null, format: 'raw' | 'formatted' | 'percentage' = 'raw'): number | string | null {
    if (num === null || num === undefined) return null;
    
    const numValue = typeof num === 'string' ? parseFloat(num) : num;
    if (isNaN(numValue)) return null;

    switch (format) {
      case 'raw':
        return numValue;
      case 'formatted':
        return this.formatNumber(numValue);
      case 'percentage':
        return `${(numValue * 100).toFixed(2)}%`;
      default:
        return numValue;
    }
  }

  /**
   * Transform strings to consistent format
   */
  static transformString(str: string | null, format: 'lower' | 'upper' | 'title' | 'camel' | 'snake' = 'lower'): string | null {
    if (!str) return null;

    switch (format) {
      case 'lower':
        return str.toLowerCase();
      case 'upper':
        return str.toUpperCase();
      case 'title':
        return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
      case 'camel':
        return str.replace(/[-_\s]+(.)?/g, (_, char) => char ? char.toUpperCase() : '');
      case 'snake':
        return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`).replace(/^_/, '');
      default:
        return str;
    }
  }

  /**
   * Transform arrays with consistent formatting
   */
  static transformArray<T, U>(arr: T[] | null, transformer: (item: T) => U, limit?: number): U[] | null {
    if (!arr || !Array.isArray(arr)) return null;

    const limitedArray = limit ? arr.slice(0, limit) : arr;
    return limitedArray.map(transformer);
  }

  /**
   * Transform objects with consistent formatting
   */
  static transformObject<T extends object>(
    obj: T | null,
    transformers: Partial<Record<keyof T, TransformerFunction>>,
    options: TransformationOptions = {}
  ): Partial<T> | null {
    if (!obj) return null;

    const transformed: Partial<T> = {};

    for (const [key, value] of Object.entries(obj)) {
      const transformer = transformers[key as keyof T];
      if (value === null || value === undefined) {
        if (options.includeNulls) {
          transformed[key as keyof T] = undefined;
        }
        continue;
      }
      if (transformer) {
        transformed[key as keyof T] = transformer(value) as T[keyof T];
      } else {
        transformed[key as keyof T] = value as T[keyof T];
      }
    }
    return transformed;
  }

  /**
   * Deep transform nested objects
   */
  static deepTransform(obj: TransformableValue | TransformableObject | TransformableObject[], transformers: Record<string, DeepTransformerFunction>, maxDepth: number = 5): TransformableValue | TransformableObject | TransformableObject[] {
    if (maxDepth <= 0) return obj;
    if (obj === null || obj === undefined) return obj;

    if (Array.isArray(obj)) {
      return obj.map(item => this.deepTransform(item, transformers, maxDepth - 1)) as TransformableObject[];
    }

    if (typeof obj === 'object' && obj !== null) {
      const transformed: Record<string, TransformableValue | TransformableObject | TransformableObject[]> = {};
      for (const [key, value] of Object.entries(obj)) {
        const transformer = transformers[key];
        if (transformer) {
          transformed[key] = transformer(value);
        } else {
          transformed[key] = this.deepTransform(value, transformers, maxDepth - 1);
        }
      }
      return transformed;
    }

    return obj;
  }

  /**
   * Get relative time string
   */
  private static getRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSeconds < 60) return 'just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
    return `${Math.floor(diffDays / 365)}y ago`;
  }

  /**
   * Format number with commas
   */
  private static formatNumber(num: number): string {
    return num.toLocaleString();
  }
}

/**
 * Dota 2 specific transformers
 */
export const DotaTransformers = {
  /**
   * Check if object has valid attributes
   */
  hasValidAttributes: (obj: Partial<HeroData>): boolean => {
    return 'attributes' in obj && typeof obj.attributes === 'object';
  },

  /**
   * Check if object has valid meta
   */
  hasValidMeta: (obj: Partial<HeroData>): boolean => {
    return 'meta' in obj && typeof obj.meta === 'object';
  },

  /**
   * Flatten hero properties for API response
   */
  flattenHeroProperties: (transformed: Partial<HeroData> | null): Partial<HeroData> & { roles?: string[]; tier?: string } => {
    if (!transformed || typeof transformed !== 'object') {
      return transformed || {};
    }
    
    const base = { ...transformed };
    let attributes: HeroData['attributes'] | undefined;
    let meta: HeroData['meta'] | undefined;
    if (DotaTransformers.hasValidAttributes(transformed)) {
      attributes = transformed.attributes as HeroData['attributes'];
    }
    if (DotaTransformers.hasValidMeta(transformed)) {
      meta = transformed.meta as HeroData['meta'];
    }
    return {
      ...base,
      ...(attributes ? {
        complexity: attributes.complexity,
        primaryAttribute: attributes.primaryAttribute,
        roles: attributes.roles
      } : {}),
      ...(meta ? { tier: meta.tier } : {})
    };
  },

  /**
   * Transform hero data
   */
  hero: (hero: HeroData) => {
    const transformed = DataTransformer.transformObject(hero as object, {
      name: (name: string) => DataTransformer.transformString(name, 'title'),
      complexity: (complexity: string) => DataTransformer.transformString(complexity, 'lower'),
      primaryAttribute: (attr: string) => DataTransformer.transformString(attr, 'lower'),
      winRate: (rate: number) => DataTransformer.transformNumber(rate, 'percentage'),
      pickRate: (rate: number) => DataTransformer.transformNumber(rate, 'percentage'),
      banRate: (rate: number) => DataTransformer.transformNumber(rate, 'percentage'),
      lastUpdated: (date: string | number | Date) => DataTransformer.transformDate(date, 'iso')
    });
    
    const flattened = DotaTransformers.flattenHeroProperties(transformed);
    return flattened;
  },

  /**
   * Transform match data
   */
  match: (match: MatchData) => DataTransformer.transformObject(match as object, {
    startTime: (time: string | number | Date) => DataTransformer.transformDate(time, 'iso'),
    endTime: (time: string | number | Date) => DataTransformer.transformDate(time, 'iso'),
    duration: (duration: number) => Math.floor(duration / 60), // Convert to minutes
    gameMode: (mode: string) => DataTransformer.transformString(mode, 'title'),
    lobbyType: (type: string) => DataTransformer.transformString(type, 'title'),
    radiantWin: (win: boolean) => win,
    firstBloodTime: (time: number) => Math.floor(time / 60), // Convert to minutes
    lastUpdated: (date: string | number | Date) => DataTransformer.transformDate(date, 'iso')
  }),

  /**
   * Transform player data
   */
  player: (player: PlayerData) => DataTransformer.transformObject(player as object, {
    name: (name: string) => DataTransformer.transformString(name, 'title'),
    profileUrl: (url: string) => url,
    avatarUrl: (url: string) => url,
    mmrEstimate: (mmr: number) => DataTransformer.transformNumber(mmr, 'formatted'),
    winRate: (rate: number) => DataTransformer.transformNumber(rate, 'percentage'),
    lastMatchTime: (time: string | number | Date) => DataTransformer.transformDate(time, 'relative'),
    lastUpdated: (date: string | number | Date) => DataTransformer.transformDate(date, 'iso')
  }),

  /**
   * Transform team data
   */
  team: (team: TeamData) => DataTransformer.transformObject(team as object, {
    name: (name: string) => DataTransformer.transformString(name, 'title'),
    tag: (tag: string) => DataTransformer.transformString(tag, 'upper'),
    logoUrl: (url: string) => url,
    rating: (rating: number) => DataTransformer.transformNumber(rating, 'formatted'),
    winRate: (rate: number) => DataTransformer.transformNumber(rate, 'percentage'),
    lastMatchTime: (time: string | number | Date) => DataTransformer.transformDate(time, 'relative'),
    lastUpdated: (date: string | number | Date) => DataTransformer.transformDate(date, 'iso')
  }),

  /**
   * Transform statistics data
   */
  stats: (stats: StatsData) => DataTransformer.transformObject(stats as object, {
    kills: (kills: number) => DataTransformer.transformNumber(kills, 'formatted'),
    deaths: (deaths: number) => DataTransformer.transformNumber(deaths, 'formatted'),
    assists: (assists: number) => DataTransformer.transformNumber(assists, 'formatted'),
    gpm: (gpm: number) => DataTransformer.transformNumber(gpm, 'formatted'),
    xpm: (xpm: number) => DataTransformer.transformNumber(xpm, 'formatted'),
    heroDamage: (damage: number) => DataTransformer.transformNumber(damage, 'formatted'),
    towerDamage: (damage: number) => DataTransformer.transformNumber(damage, 'formatted'),
    heroHealing: (healing: number) => DataTransformer.transformNumber(healing, 'formatted'),
    lastHits: (hits: number) => DataTransformer.transformNumber(hits, 'formatted'),
    denies: (denies: number) => DataTransformer.transformNumber(denies, 'formatted')
  })
};

/**
 * View-specific transformers
 */
export const ViewTransformers = {
  /**
   * Transform data for summary view
   */
  summary: <T>(data: T, fields: (keyof T)[]): Partial<T> => {
    const summary: Partial<T> = {};
    for (const field of fields) {
      if (data[field] !== undefined) {
        summary[field] = data[field];
      }
    }
    return summary;
  },

  /**
   * Transform data for minimal view
   */
  minimal: <T>(data: T, essentialFields: (keyof T)[]): Partial<T> => {
    const minimal: Partial<T> = {};
    for (const field of essentialFields) {
      if (data[field] !== undefined) {
        minimal[field] = data[field];
      }
    }
    return minimal;
  },

  /**
   * Transform data for full view with all processing
   */
  full: <T>(data: T, transformers: Record<string, DeepTransformerFunction>): T => {
    return DataTransformer.deepTransform(data as TransformableObject, transformers) as T;
  }
};

/**
 * Aggregation utilities
 */
export const AggregationUtils = {
  /**
   * Calculate averages from array of numbers
   */
  average: (numbers: number[]): number => {
    if (numbers.length === 0) return 0;
    return numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
  },

  /**
   * Calculate median from array of numbers
   */
  median: (numbers: number[]): number => {
    if (numbers.length === 0) return 0;
    const sorted = [...numbers].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 
      ? (sorted[middle - 1] + sorted[middle]) / 2 
      : sorted[middle];
  },

  /**
   * Calculate percentiles
   */
  percentile: (numbers: number[], p: number): number => {
    if (numbers.length === 0) return 0;
    const sorted = [...numbers].sort((a, b) => a - b);
    const index = (p / 100) * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index % 1;
    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
  },

  /**
   * Group array by key
   */
  groupBy: <T>(array: T[], keyFn: (item: T) => string): Record<string, T[]> => {
    return array.reduce((groups, item) => {
      const key = keyFn(item);
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
      return groups;
    }, {} as Record<string, T[]>);
  },

  /**
   * Calculate win rate from wins and total games
   */
  winRate: (wins: number, total: number): number => {
    if (total === 0) return 0;
    return (wins / total) * 100;
  },

  /**
   * Calculate KDA ratio
   */
  kda: (kills: number, deaths: number, assists: number): number => {
    if (deaths === 0) return kills + assists;
    return (kills + assists) / deaths;
  }
}; 