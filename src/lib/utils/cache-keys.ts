// Centralized cache key and filename helpers for all cacheable entities

export function getTeamCacheKey(teamId: string) {
  return `dotabuff-team-${teamId}-matches`;
}
export function getTeamCacheFilename(teamId: string, pageNum?: number) {
  if (typeof pageNum === 'number' && pageNum > 0) {
    return `dotabuff-team-${teamId}-matches-page-${pageNum}.html`;
  }
  return `dotabuff-team-${teamId}-matches.json`;
}

export function getDotabuffMatchesCacheKey(teamId: string) {
  return `dotabuff-team-${teamId}-matches`;
}
export function getDotabuffMatchesCacheFilename(teamId: string) {
  return `dotabuff-team-${teamId}-matches.json`;
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
  return `dotabuff-league-${leagueId}.json`;
}

export function getLeagueHtmlFilename(leagueId: string) {
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
  return `dashboard-config-${id}`;
}

export function getDashboardConfigCacheFilename(id: string) {
  return `dashboard-config-${id}.json`;
}

export function getCacheKeyAndFilename(type: string, id: string) {
  switch (type) {
    case 'player':
      return {
        key: `opendota-player-${id}`,
        filename: `opendota-player-${id}.json`
      };
    case 'team':
      return {
        key: `dotabuff-team-${id}-matches`,
        filename: `dotabuff-team-${id}-matches.json`
      };
    case 'match':
      return {
        key: `opendota-match-${id}`,
        filename: `opendota-match-${id}.json`
      };
    case 'league':
      return {
        key: `dotabuff-league-${id}`,
        filename: `dotabuff-league-${id}.json`
      };
    default:
      throw new Error(`Unknown cache type: ${type}`);
  }
}

export function getHeroesCacheKeyAndFilename() {
  return {
    key: 'opendota-heroes',
    filename: 'opendota-heroes.json'
  };
}

export function getPlayerStatsCacheKeyAndFilename(playerId: string) {
  return {
    key: `opendota-player-stats-${playerId}`,
    filename: `opendota-player-stats-${playerId}.json`
  };
} 