import { useMemo } from 'react';

import type { Match } from '@/types/contexts/match-context-value';
import type { TeamMatchParticipation } from '@/types/contexts/team-context-value';

// ============================================================================
// FILTER TYPES
// ============================================================================

export interface MatchFilters {
  dateRange: 'all' | '7days' | '30days' | 'custom';
  customDateRange: {
    start: string | null;
    end: string | null;
  };
  result: 'all' | 'wins' | 'losses';
  opponent: string[];
  teamSide: 'all' | 'radiant' | 'dire';
  pickOrder: 'all' | 'first' | 'second';
  heroesPlayed: string[];
  highPerformersOnly: boolean;
}

export interface FilterStats {
  totalMatches: number;
  filteredMatches: number;
  filterBreakdown: {
    dateRange: number;
    result: number;
    teamSide: number;
    pickOrder: number;
    heroesPlayed: number;
    opponent: number;
    highPerformersOnly: number;
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function applyDateRangeFilter(match: Match, filters: MatchFilters): boolean {
  if (filters.dateRange === 'all') return true;

  const matchDate = new Date(match.date);
  const now = new Date();

  switch (filters.dateRange) {
    case '7days': {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return matchDate >= sevenDaysAgo;
    }

    case '30days': {
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return matchDate >= thirtyDaysAgo;
    }

    case 'custom': {
      if (filters.customDateRange.start) {
        const startDate = new Date(filters.customDateRange.start);
        if (matchDate < startDate) return false;
      }
      if (filters.customDateRange.end) {
        const endDate = new Date(filters.customDateRange.end);
        if (matchDate > endDate) return false;
      }
      return true;
    }

    default:
      return true;
  }
}

function applyResultFilter(teamMatch: TeamMatchParticipation | undefined, filters: MatchFilters): boolean {
  if (filters.result === 'all' || !teamMatch?.side) return true;

  const isWin = teamMatch.result === 'won';

  return filters.result === 'wins' ? isWin : !isWin;
}

function applyTeamSideFilter(teamMatch: TeamMatchParticipation | undefined, filters: MatchFilters): boolean {
  if (filters.teamSide === 'all' || !teamMatch?.side) return true;

  return teamMatch.side === filters.teamSide;
}

function applyPickOrderFilter(teamMatch: TeamMatchParticipation | undefined, filters: MatchFilters): boolean {
  if (filters.pickOrder === 'all' || !teamMatch?.side) return true;

  const teamPickOrder = teamMatch.pickOrder;
  if (!teamPickOrder) return true;

  return filters.pickOrder === teamPickOrder;
}

function applyHeroesFilter(
  match: Match,
  teamMatch: TeamMatchParticipation | undefined,
  filters: MatchFilters,
): boolean {
  if (filters.heroesPlayed.length === 0 || !teamMatch?.side) return true;

  // Get heroes played by the team in this match from player data
  const teamPlayers = match.players[teamMatch.side] || [];
  const playedHeroes = teamPlayers.map((player) => player.hero.id.toString()).filter((id): id is string => !!id);

  // Check if any of the filtered heroes were played
  return filters.heroesPlayed.some((heroId) => playedHeroes.includes(heroId));
}

function applyOpponentFilter(teamMatch: TeamMatchParticipation | undefined, filters: MatchFilters): boolean {
  if (filters.opponent.length === 0 || !teamMatch || !teamMatch.opponentName) return true;

  // Get the opponent name from the team match participation data
  const opponentName = teamMatch.opponentName;

  // Check if the opponent team name matches any of the filtered opponents
  return filters.opponent.some((opponentNameFilter) => opponentNameFilter === opponentName);
}

function applyHighPerformersFilter(
  match: Match,
  teamMatch: TeamMatchParticipation | undefined,
  filters: MatchFilters,
  allMatches: Match[],
  teamMatches: Record<number, TeamMatchParticipation>,
  hiddenMatchIds: Set<number>,
): boolean {
  if (!filters.highPerformersOnly || !teamMatch?.side) return true;

  // Calculate hero statistics from unhidden matches (all matches minus manually hidden ones)
  const heroStats: Record<string, { count: number; wins: number; totalGames: number }> = {};

  // Aggregate hero statistics from unhidden matches
  allMatches.forEach((matchData) => {
    // Skip manually hidden matches
    if (hiddenMatchIds.has(matchData.id)) return;

    const matchTeamData = teamMatches[matchData.id];
    if (!matchTeamData?.side) return;

    const teamPlayers = matchData.players[matchTeamData.side] || [];
    const isWin = matchTeamData.result === 'won';

    teamPlayers.forEach((player) => {
      const heroId = player.hero.id.toString();
      if (!heroStats[heroId]) {
        heroStats[heroId] = { count: 0, wins: 0, totalGames: 0 };
      }

      heroStats[heroId].count++;
      heroStats[heroId].totalGames++;
      if (isWin) {
        heroStats[heroId].wins++;
      }
    });
  });

  // Identify high-performing heroes (5+ games, 60%+ win rate)
  const highPerformingHeroes = new Set(
    Object.entries(heroStats)
      .filter(([_, stats]) => stats.count >= 5 && stats.wins / stats.count >= 0.6)
      .map(([heroId, _]) => heroId),
  );

  // Check if current match contains any high-performing heroes
  const teamPlayers = match.players[teamMatch.side] || [];
  return teamPlayers.some((player) => highPerformingHeroes.has(player.hero.id.toString()));
}

// ============================================================================
// MAIN FILTER FUNCTION
// ============================================================================

function applyAllFiltersExceptHighPerformers(
  match: Match,
  teamMatches: Record<number, TeamMatchParticipation>,
  filters: MatchFilters,
): boolean {
  const teamMatch = teamMatches[match.id];

  return (
    applyDateRangeFilter(match, filters) &&
    applyResultFilter(teamMatch, filters) &&
    applyTeamSideFilter(teamMatch, filters) &&
    applyPickOrderFilter(teamMatch, filters) &&
    applyHeroesFilter(match, teamMatch, filters) &&
    applyOpponentFilter(teamMatch, filters)
  );
}

function applyAllFilters(
  match: Match,
  teamMatches: Record<number, TeamMatchParticipation>,
  filters: MatchFilters,
  allMatches: Match[],
  hiddenMatchIds: Set<number>,
): boolean {
  const teamMatch = teamMatches[match.id];

  return (
    applyAllFiltersExceptHighPerformers(match, teamMatches, filters) &&
    applyHighPerformersFilter(match, teamMatch, filters, allMatches, teamMatches, hiddenMatchIds)
  );
}

// ============================================================================
// STATISTICS HELPER
// ============================================================================

function getFilterStats(
  matches: Match[],
  teamMatches: Record<number, TeamMatchParticipation>,
  filters: MatchFilters,
  hiddenMatchIds: Set<number>,
): FilterStats {
  const totalMatches = matches.length;
  const filteredMatches = matches.filter((match) =>
    applyAllFilters(match, teamMatches, filters, matches, hiddenMatchIds),
  );

  // Count matches that pass each individual filter
  const filterBreakdown = {
    dateRange: matches.filter((match) => applyDateRangeFilter(match, filters)).length,
    result: matches.filter((match) => {
      const teamMatch = teamMatches[match.id];
      return applyResultFilter(teamMatch, filters);
    }).length,
    teamSide: matches.filter((match) => {
      const teamMatch = teamMatches[match.id];
      return applyTeamSideFilter(teamMatch, filters);
    }).length,
    pickOrder: matches.filter((match) => {
      const teamMatch = teamMatches[match.id];
      return applyPickOrderFilter(teamMatch, filters);
    }).length,
    heroesPlayed: matches.filter((match) => {
      const teamMatch = teamMatches[match.id];
      return applyHeroesFilter(match, teamMatch, filters);
    }).length,
    opponent: matches.filter((match) => {
      const teamMatch = teamMatches[match.id];
      return applyOpponentFilter(teamMatch, filters);
    }).length,
    highPerformersOnly: (() => {
      return matches.filter((match) => {
        const teamMatch = teamMatches[match.id];
        return applyHighPerformersFilter(match, teamMatch, filters, matches, teamMatches, hiddenMatchIds);
      }).length;
    })(),
  };

  return {
    totalMatches,
    filteredMatches: filteredMatches.length,
    filterBreakdown,
  };
}

// ============================================================================
// MAIN HOOK
// ============================================================================

export function useMatchFilters(
  matches: Match[],
  teamMatches: Record<number, TeamMatchParticipation>,
  filters: MatchFilters,
  hiddenMatchIds: Set<number> = new Set(),
) {
  const filteredMatches = useMemo(() => {
    return matches.filter((match) => applyAllFilters(match, teamMatches, filters, matches, hiddenMatchIds));
  }, [matches, teamMatches, filters, hiddenMatchIds]);

  const filterStats = useMemo(() => {
    return getFilterStats(matches, teamMatches, filters, hiddenMatchIds);
  }, [matches, teamMatches, filters, hiddenMatchIds]);

  return {
    filteredMatches,
    filterStats,
  };
}
