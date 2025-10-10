/**
 * Hero Performance Operations
 *
 * Computes hero performance statistics for teams
 */

import type { Hero, Match, Team, TeamMatchParticipation } from './app-data-types';

export interface AppDataHeroPerformanceOpsContext {
  _matches: Map<number, Match>;
  _teams: Map<string, Team>;
  updateMatch(matchId: number, updates: Partial<Match>, options?: { skipSave?: boolean }): void;
  updateMatchesRef(): void;
}

/**
 * Computes hero performance statistics for a specific hero
 *
 * @param hero - The hero to analyze
 * @param allMatches - All matches to analyze
 * @param teamMatches - Team match participation data
 * @param hiddenMatchIds - Set of hidden match IDs to exclude
 * @returns Hero performance statistics
 */
export function computeHeroPerformanceStats(
  hero: Hero,
  allMatches: Match[],
  teamMatches: Map<number, TeamMatchParticipation>,
  hiddenMatchIds: Set<number>,
): {
  gamesPlayed: number;
  wins: number;
  losses: number;
  winRate: number;
  isHighPerforming: boolean;
} {
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
}

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
): Map<
  number,
  {
    gamesPlayed: number;
    wins: number;
    losses: number;
    winRate: number;
    isHighPerforming: boolean;
  }
> {
  const heroStats = new Map<
    number,
    {
      gamesPlayed: number;
      wins: number;
      losses: number;
      winRate: number;
      isHighPerforming: boolean;
    }
  >();

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
      const stats = computeHeroPerformanceStats(hero, allMatches, teamMatches, hiddenMatchIds);
      heroStats.set(heroId, stats);
    }
  });

  return heroStats;
}

/**
 * Compute hero performance for all matches in a team and update match objects
 *
 * @param appData - AppData context
 * @param teamKey - Team key to compute hero performance for
 * @param allMatches - All matches for the team
 * @param teamMatches - Team match participation data
 * @param hiddenMatchIds - Set of hidden match IDs to exclude
 */
export function computeAndStoreHeroPerformanceForTeam(
  appData: AppDataHeroPerformanceOpsContext,
  teamKey: string,
  allMatches: Match[],
  teamMatches: Map<number, TeamMatchParticipation>,
  hiddenMatchIds: Set<number>,
): void {
  // Compute hero performance for all heroes
  const heroPerformanceStats = computeAllHeroPerformanceStats(allMatches, teamMatches, hiddenMatchIds);

  // Update each match with the computed hero performance data
  allMatches.forEach((match) => {
    if (!match.computed) {
      match.computed = {
        heroPerformance: new Map(),
      };
    }

    // Store the hero performance data for this match
    match.computed.heroPerformance = heroPerformanceStats;

    // Update the match in the store
    appData.updateMatch(match.id, { computed: match.computed }, { skipSave: true });
  });

  // Trigger React re-render after all updates are complete
  appData.updateMatchesRef();
}
