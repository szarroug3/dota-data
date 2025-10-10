/**
 * Team Match Participation Helpers for AppData
 *
 * Helpers for calculating team match participation data (side, opponent, result, high performing heroes).
 * Extracted to reduce app-data.ts file size.
 */

import type { Match } from './app-data-types';

/**
 * Determine which side a team played on
 */
export function determineTeamSide(
  teamId: number,
  matchInfo: { radiantTeamId?: number; direTeamId?: number } | undefined,
): 'radiant' | 'dire' {
  if (matchInfo?.radiantTeamId === teamId) return 'radiant';
  if (matchInfo?.direTeamId === teamId) return 'dire';
  return 'radiant'; // Default for manual matches
}

/**
 * Get opponent team name based on side
 */
export function getOpponentName(side: 'radiant' | 'dire', match: Match): string {
  return side === 'radiant' ? match.dire.name || 'Unknown' : match.radiant.name || 'Unknown';
}

/**
 * Get match result from team's perspective
 */
export function getMatchResult(side: 'radiant' | 'dire', match: Match): 'won' | 'lost' | 'unknown' {
  if (!match.result) return 'unknown';
  return match.result === side ? 'won' : 'lost';
}

/**
 * Calculate high performing heroes for a team
 * Heroes with 5+ games and 60%+ win rate
 */
export function calculateHighPerformingHeroes(
  teamMatches: Map<number, { side?: 'radiant' | 'dire'; result?: 'won' | 'lost' | 'unknown' }>,
  matchesMap: Map<number, Match>,
): Set<string> {
  const heroStats: Record<string, { count: number; wins: number }> = {};

  // Iterate through all matches for this team
  teamMatches.forEach((participation, matchId) => {
    const match = matchesMap.get(matchId);
    if (!match || !participation.side) return;

    const teamPlayers = match.players[participation.side] || [];
    const isWin = participation.result === 'won';

    teamPlayers.forEach((player) => {
      const heroId = player.hero.id.toString();
      if (!heroStats[heroId]) {
        heroStats[heroId] = { count: 0, wins: 0 };
      }
      heroStats[heroId].count++;
      if (isWin) {
        heroStats[heroId].wins++;
      }
    });
  });

  // Filter to heroes with 5+ games and 60%+ win rate
  const highPerformingHeroes = new Set<string>();
  Object.entries(heroStats).forEach(([heroId, stats]) => {
    const winRate = stats.wins / stats.count;
    if (stats.count >= 5 && winRate >= 0.6) {
      highPerformingHeroes.add(heroId);
    }
  });

  return highPerformingHeroes;
}
