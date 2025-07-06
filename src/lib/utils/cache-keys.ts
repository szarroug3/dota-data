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
  return `opendota-match-${matchId}`;
}
export function getMatchCacheFilename(matchId: string) {
  return `opendota-match-${matchId}.json`;
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

// Standardized API cache keys for new endpoints
export function getHeroesCacheKey() {
  return 'opendota-heroes';
}
export function getHeroesCacheFilename() {
  return 'opendota-heroes.json';
}

// Items endpoints cache keys
export function getOpendotaItemsCacheKey() {
  return 'opendota-items';
}
export function getOpendotaItemsCacheFilename() {
  return 'opendota-items.json';
}

// Player endpoints cache keys
export function getPlayerCacheKey(accountId: string) {
  return `opendota-player-${accountId}`;
}
export function getPlayerCacheFilename(accountId: string) {
  return `opendota-player-${accountId}.json`;
}

export function getPlayerMatchesCacheKey(accountId: string) {
  return `opendota-player-${accountId}-matches`;
}
export function getPlayerMatchesCacheFilename(accountId: string) {
  return `opendota-player-${accountId}-matches.json`;
}

export function getPlayerRecentMatchesCacheKey(accountId: string) {
  return `opendota-player-${accountId}-recent-matches`;
}
export function getPlayerRecentMatchesCacheFilename(accountId: string) {
  return `opendota-player-${accountId}-recent-matches.json`;
}

export function getPlayerRankingsCacheKey(accountId: string) {
  return `opendota-player-${accountId}-rankings`;
}
export function getPlayerRankingsCacheFilename(accountId: string) {
  return `opendota-player-${accountId}-rankings.json`;
}

export function getPlayerRatingsCacheKey(accountId: string) {
  return `opendota-player-${accountId}-ratings`;
}
export function getPlayerRatingsCacheFilename(accountId: string) {
  return `opendota-player-${accountId}-ratings.json`;
}

export function getPlayerWLCacheKey(accountId: string) {
  return `opendota-player-${accountId}-wl`;
}
export function getPlayerWLCacheFilename(accountId: string) {
  return `opendota-player-${accountId}-wl.json`;
}

export function getPlayerTotalsCacheKey(accountId: string) {
  return `opendota-player-${accountId}-totals`;
}
export function getPlayerTotalsCacheFilename(accountId: string) {
  return `opendota-player-${accountId}-totals.json`;
}

export function getPlayerCountsCacheKey(accountId: string) {
  return `opendota-player-${accountId}-counts`;
}
export function getPlayerCountsCacheFilename(accountId: string) {
  return `opendota-player-${accountId}-counts.json`;
}

export function getPlayerHeroesCacheKey(accountId: string) {
  return `opendota-player-${accountId}-heroes`;
}
export function getPlayerHeroesCacheFilename(accountId: string) {
  return `opendota-player-${accountId}-heroes.json`;
}

// Team endpoints cache keys
export function getTeamDataCacheKey(teamId: string) {
  return `dotabuff-team-${teamId}`;
}
export function getTeamDataCacheFilename(teamId: string) {
  return `dotabuff-team-${teamId}.json`;
}

// Legacy cache keys for backward compatibility
export function getOpendotaMatchCacheKey(matchId: string) {
  return `opendota-match-${matchId}`;
}
export function getOpendotaPublicMatchesCacheKey(limit: string) {
  return `opendota-public-matches-${limit}`;
}
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
        key: `dotabuff-team-${id}`,
        filename: `dotabuff-team-${id}.json`
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
    case 'heroes':
      return {
        key: 'opendota-heroes',
        filename: 'opendota-heroes.json'
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