/**
 * Hero Performance Operations
 *
 * Computes hero performance statistics for teams
 */

import type { Hero, HeroPerformanceStats, Match, TeamMatchParticipation } from '@/frontend/lib/app-data/app-data-types';

/**
 * Computes hero performance statistics for a specific hero
 *
 * @param hero - The hero to analyze
 * @param allMatches - All matches to analyze
 * @param teamMatches - Team match participation data
 * @param hiddenMatchIds - Set of hidden match IDs to exclude
 * @returns Hero performance statistics
 */
/**
 * Computes hero performance for all heroes in a team's matches
 *
 * @param allMatches - All matches to analyze
 * @param teamMatches - Team match participation data
 * @param hiddenMatchIds - Set of hidden match IDs to exclude
 * @returns Map of hero ID to performance stats
 */
export function computeAllHeroPerformanceStats(
  allMatches: Match[],
  teamMatches: Map<number, TeamMatchParticipation>,
  hiddenMatchIds: Set<number>,
): Map<number, HeroPerformanceStats> {
  const heroStats = new Map<number, HeroPerformanceStats>();
  const computeHeroStats = (hero: Hero): HeroPerformanceStats => {
    const stats = { gamesPlayed: 0, wins: 0, losses: 0 };

    allMatches.forEach((matchData) => {
      if (hiddenMatchIds.has(matchData.id)) return;

      const matchTeamData = teamMatches.get(matchData.id);
      if (!matchTeamData?.side) return;

      const teamPlayers = matchData.players[matchTeamData.side] || [];
      const isWin = matchTeamData.result === 'won';

      teamPlayers.forEach((player) => {
        if (player?.hero?.id === hero.id) {
          stats.gamesPlayed++;
          if (isWin) {
            stats.wins++;
          } else {
            stats.losses++;
          }
        }
      });
    });

    const winRate = stats.gamesPlayed > 0 ? stats.wins / stats.gamesPlayed : 0;
    const isHighPerforming = stats.gamesPlayed >= 5 && winRate >= 0.6;

    return {
      ...stats,
      winRate,
      isHighPerforming,
    };
  };

  // Collect all unique heroes from matches
  const heroIds = new Set<number>();
  allMatches.forEach((matchData) => {
    if (hiddenMatchIds.has(matchData.id)) return;

    const matchTeamData = teamMatches.get(matchData.id);
    if (!matchTeamData?.side) return;

    const teamPlayers = matchData.players[matchTeamData.side] || [];
    teamPlayers.forEach((player) => {
      if (player?.hero?.id) {
        heroIds.add(player.hero.id);
      }
    });
  });

  // Compute stats for each hero
  heroIds.forEach((heroId) => {
    // Find the hero object from any match
    let hero: Hero | undefined;
    for (const matchData of allMatches) {
      const matchTeamData = teamMatches.get(matchData.id);
      if (!matchTeamData?.side) continue;

      const teamPlayers = matchData.players[matchTeamData.side] || [];
      const playerWithHero = teamPlayers.find((player) => player?.hero?.id === heroId);
      if (playerWithHero?.hero) {
        hero = playerWithHero.hero;
        break;
      }
    }

    if (hero) {
      const stats = computeHeroStats(hero);
      heroStats.set(heroId, stats);
    }
  });

  return heroStats;
}
