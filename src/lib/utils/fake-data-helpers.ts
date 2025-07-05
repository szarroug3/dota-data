// Utility helpers for fake data generation
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

export function randomChoice<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

export function uniqueRandomSubset<T>(array: T[], min: number, max: number): T[] {
  const count = Math.min(randomInt(min, max), array.length);
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, count);
}

export function randomTimestamp(): number {
  const now = Date.now();
  const past = now - 1000 * 60 * 60 * 24 * 365; // up to 1 year ago
  return randomInt(past, now);
}

export const TEAM_NAMES = [
  "Team Liquid", "OG", "PSG.LGD", "Team Secret", "Virtus.pro", "Evil Geniuses", "Natus Vincere",
  "Alliance", "Fnatic", "T1", "Team Spirit", "Gaimin Gladiators", "Tundra Esports", "Shopify Rebellion",
  "BetBoom Team", "Azure Ray", "Xtreme Gaming", "Team Falcons", "Entity", "Quest Esports"
];

export function randomTeamName(exclude?: string): string {
  let available = TEAM_NAMES;
  if (exclude) {
    available = TEAM_NAMES.filter(name => name !== exclude);
  }
  return randomChoice(available);
}

export function randomTeamId(exclude?: number): number {
  const TEAM_IDS = [15, 2586976, 2163, 350190, 726228, 1838315, 1883502, 2108395, 2512249, 2640025, 2672298, 2757128, 2870765, 3023721, 3115807];
  let id = randomChoice(TEAM_IDS);
  while (exclude && id === exclude) {
    id = randomChoice(TEAM_IDS);
  }
  return id;
}

export function getAccountIdForPlayerName(name: string): number {
  // Simple hash for deterministic mapping
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash) + name.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % 1000000000;
} 