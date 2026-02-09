export type StoredTeamDataLike<TMatch extends { date: string }, TPlayer extends { isManual?: boolean }> = {
  team: { id: number; name: string };
  league: { id: number; name: string };
  timeAdded: string;
  matches: Record<string, TMatch>;
  players: Record<string, TPlayer>;
};

/**
 * Clean up old teams data to reduce storage size
 * Removes teams that were added more than retentionDays ago
 */
export function cleanupOldTeams<TMatch extends { date: string }, TPlayer extends { isManual?: boolean }>(
  storageData: Record<string, StoredTeamDataLike<TMatch, TPlayer>>,
  retentionDays = 30,
): Record<string, StoredTeamDataLike<TMatch, TPlayer>> {
  const cleaned: Record<string, StoredTeamDataLike<TMatch, TPlayer>> = {};
  const now = Date.now();
  const thirtyDaysAgo = now - retentionDays * 24 * 60 * 60 * 1000;

  Object.entries(storageData).forEach(([teamKey, teamData]) => {
    const timeAdded = new Date(teamData.timeAdded).getTime();
    if (timeAdded > thirtyDaysAgo) {
      cleaned[teamKey] = teamData;
    }
  });

  return cleaned;
}

/**
 * Reduce storage size by limiting match/player data per team
 * Only keeps essential metadata for matches and players
 */
export function optimizeStorageData<TMatch extends { date: string }, TPlayer extends { isManual?: boolean }>(
  storageData: Record<string, StoredTeamDataLike<TMatch, TPlayer>>,
  maxMatchesPerTeam = 100,
  maxPlayersPerTeam = 50,
): Record<string, StoredTeamDataLike<TMatch, TPlayer>> {
  const optimized: Record<string, StoredTeamDataLike<TMatch, TPlayer>> = {};

  Object.entries(storageData).forEach(([teamKey, teamData]) => {
    const matches = Object.entries(teamData.matches)
      .sort(([, a], [, b]) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, maxMatchesPerTeam);

    const players = Object.entries(teamData.players)
      .sort(([, a], [, b]) => {
        if (a.isManual && !b.isManual) return -1;
        if (!a.isManual && b.isManual) return 1;
        return 0;
      })
      .slice(0, maxPlayersPerTeam);

    optimized[teamKey] = {
      ...teamData,
      matches: Object.fromEntries(matches),
      players: Object.fromEntries(players),
    };
  });

  return optimized;
}
