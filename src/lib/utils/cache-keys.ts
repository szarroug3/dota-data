// Centralized cache key and filename helpers for all cacheable entities

export function getTeamCacheKey(teamId: string) {
  return `dotabuff-team-${teamId}-matches`;
}
export function getTeamCacheFilename(teamId: string, pageNum?: number) {
  if (typeof pageNum === 'number') {
    return `dotabuff-team-${teamId}-matches${pageNum > 0 ? `-page-${pageNum}` : ''}.html`;
  }
  return `dotabuff-team-${teamId}-matches.html`;
}

export function getDotabuffMatchesCacheKey(teamId: string) {
  return `dotabuff-team-${teamId}-matches`;
}
export function getDotabuffMatchesCacheFilename(teamId: string) {
  return `dotabuff-team-${teamId}-matches.html`;
}

export function getPlayerDraftDataCacheKey(teamId: string) {
  return `player-draft-data-${teamId}`;
}
export function getPlayerDraftDataCacheFilename(teamId: string) {
  return `player-draft-data-${teamId}.json`;
}

export function getPlayerAnalysisDataCacheKey(teamId: string) {
  return `player-analysis-data-${teamId}`;
}
export function getPlayerAnalysisDataCacheFilename(teamId: string) {
  return `player-analysis-data-${teamId}.json`;
}

export function getMatchCacheKey(matchId: string) {
  return `dotabuff-match-${matchId}`;
}
export function getMatchCacheFilename(matchId: string) {
  return `dotabuff-match-${matchId}.json`;
}

export function getLeagueCacheKey(leagueId: string) {
  return `dotabuff-league-${leagueId}`;
}
export function getLeagueCacheFilename(leagueId: string) {
  return `dotabuff-league-${leagueId}.html`;
}

// OpenDota match cache keys
export function getOpendotaMatchCacheKey(matchId: string) {
  return `opendota-match-${matchId}`;
}
export function getOpendotaPublicMatchesCacheKey(limit: string) {
  return `opendota-public-matches-${limit}`;
}
// OpenDota player cache keys
export function getOpendotaPlayerCacheKey(accountId: string) {
  return `opendota-player-${accountId}`;
}
export function getOpendotaPlayerWlCacheKey(accountId: string) {
  return `opendota-player-wl-${accountId}`;
}
export function getOpendotaPlayerTotalsCacheKey(accountId: string) {
  return `opendota-player-totals-${accountId}`;
}
export function getOpendotaPlayerCountsCacheKey(accountId: string) {
  return `opendota-player-counts-${accountId}`;
}
export function getOpendotaPlayerHeroesCacheKey(accountId: string) {
  return `opendota-player-heroes-${accountId}`;
}
export function getOpendotaPlayerRecentMatchesCacheKey(accountId: string) {
  return `opendota-player-recent-matches-${accountId}`;
}
export function getOpendotaPlayerMatchesCacheKey(accountId: string) {
  return `opendota-player-matches-${accountId}`;
}
export function getOpendotaPlayerStatsCacheKey(accountId: string) {
  return `opendota-player-stats-${accountId}`;
}
// Dashboard config cache keys
export function getDashboardConfigCacheKey(id: string) {
  return `dashboard-config:${id}`;
} 