// Centralized backend cache TTL policy (seconds)
// undefined => no expiry (indefinite)

export const CacheTtlSeconds = {
  // OpenDota constants
  heroes: 60 * 60 * 24 * 7, // 7 days
  items: 60 * 60 * 24 * 30, // 30 days

  // OpenDota players
  playerComprehensive: 60 * 60 * 24, // 24 hours

  // Steam
  steamTeamById: undefined as number | undefined, // teams/[id] => indefinite
  steamLeagues: 60 * 60 * 6, // teams/ (league history) => 6 hours

  // Share
  sharePayload: undefined as number | undefined, // share => indefinite
} as const;

export type CacheTtlKey = keyof typeof CacheTtlSeconds;
