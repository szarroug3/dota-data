import type { Match, Team, TeamPerformanceSummary } from './app-data-types';
import type { StoredMatchData } from './storage-manager';

interface ComputeTeamPerformanceOptions {
  team: Team;
  matchesMap: Map<number, Match>;
}

export function computeTeamPerformanceSummary({
  team,
  matchesMap,
}: ComputeTeamPerformanceOptions): TeamPerformanceSummary {
  let totalMatches = 0;
  let totalWins = 0;
  let totalLosses = 0;
  let totalDurationSeconds = 0;
  let manualMatchCount = 0;

  for (const [matchId, teamMatch] of team.matches) {
    const match = matchesMap.get(matchId);
    if (match && !teamMatch.isHidden) {
      totalMatches++;
      if (teamMatch.result === 'won') {
        totalWins++;
      } else {
        totalLosses++;
      }
      totalDurationSeconds += match.duration;

      if (teamMatch.isManual) {
        manualMatchCount++;
      }
    }
  }

  const overallWinRate = totalMatches > 0 ? (totalWins / totalMatches) * 100 : 0;
  const averageMatchDurationSeconds = totalMatches > 0 ? totalDurationSeconds / totalMatches : 0;

  return {
    totalMatches,
    totalWins,
    totalLosses,
    overallWinRate,
    erroredMatches: 0,
    totalDurationSeconds,
    averageMatchDurationSeconds,
    manualMatchCount,
    manualPlayerCount: 0,
  };
}
