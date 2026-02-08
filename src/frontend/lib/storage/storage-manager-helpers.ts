export interface StoredHero {
  id: number;
  name: string;
  localizedName: string;
  imageUrl: string;
}

const DEFAULT_DATE = new Date(0).toISOString();

export function parseRankFromString(rank: string): { rankTier: number; leaderboardRank?: number } {
  const normalized = rank.toLowerCase().trim();
  const tiers: Record<string, number> = {
    herald: 10,
    guardian: 20,
    crusader: 30,
    archon: 40,
    legend: 50,
    ancient: 60,
    divine: 70,
    immortal: 80,
  };

  const tier = Object.keys(tiers).find((key) => normalized.includes(key));
  if (!tier) {
    return { rankTier: 0 };
  }

  const baseTier = tiers[tier];

  if (tier === 'immortal') {
    const rankMatch = normalized.match(/#(\d+)/);
    if (rankMatch) {
      const immortalRank = parseInt(rankMatch[1], 10);
      return { rankTier: 80, leaderboardRank: immortalRank };
    }
    return { rankTier: 80 };
  }

  const starMatch = normalized.match(/\b(\d+)\b/);
  if (starMatch) {
    const stars = parseInt(starMatch[1], 10);
    if (stars >= 1 && stars <= 5) {
      return { rankTier: baseTier + stars };
    }
  }

  return { rankTier: baseTier };
}

export function sanitizeText(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim().length > 0 ? value : fallback;
}

export function sanitizeMatchResult(value: unknown): 'won' | 'lost' {
  return value === 'won' ? 'won' : 'lost';
}

export function sanitizeMatchSide(value: unknown): 'radiant' | 'dire' {
  return value === 'dire' ? 'dire' : 'radiant';
}

export function sanitizeDuration(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.floor(value));
}

export function sanitizeDateValue(value: unknown): string {
  if (typeof value === 'string' && !Number.isNaN(Date.parse(value))) {
    return new Date(value).toISOString();
  }
  return DEFAULT_DATE;
}

export function sanitizePickOrder(value: unknown): string {
  return sanitizeText(value, 'unknown');
}

export function sanitizeBoolean(value: unknown): boolean {
  return Boolean(value);
}

export function sanitizeGames(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.trunc(value));
}

export function sanitizeWinRate(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return 0;
  }
  if (value < 0) return 0;
  if (value > 100) return 100;
  return value;
}

export function sanitizeAvatar(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

export function sanitizeStoredHeroes(value: unknown): StoredHero[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const heroes: StoredHero[] = [];
  value.forEach((entry) => {
    if (entry && typeof entry === 'object') {
      const obj = entry as Record<string, unknown>;
      const id = typeof obj.id === 'number' && Number.isFinite(obj.id) ? Math.trunc(obj.id) : null;
      if (id === null) return;

      heroes.push({
        id,
        name: sanitizeText(obj.name, `npc_dota_hero_${id}`),
        localizedName: sanitizeText(obj.localizedName, `Hero ${id}`),
        imageUrl: sanitizeText(obj.imageUrl, ''),
      });
    }
  });

  const unique = new Map<number, StoredHero>();
  heroes.forEach((hero) => unique.set(hero.id, hero));
  return Array.from(unique.values());
}
