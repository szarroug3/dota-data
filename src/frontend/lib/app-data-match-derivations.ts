import type { Match, MatchFilters, MatchFiltersResult, MatchFilterStats, Team } from './app-data-types';
import type { StoredMatchData } from './storage-manager';

interface ComputeTeamMatchesOptions {
  team: Team;
  matchesMap: Map<number, Match>;
}

interface ComputeTeamMatchFiltersOptions {
  matches: Match[];
  teamMatches: Map<number, StoredMatchData>;
  filters: MatchFilters;
  hiddenMatchIds: Set<number>;
}

export function computeTeamMatchesForDisplay({ team, matchesMap }: ComputeTeamMatchesOptions): Match[] {
  const matches: Match[] = [];
  for (const [matchId, teamMatch] of team.matches) {
    if (!teamMatch.isHidden) {
      const match = matchesMap.get(matchId);
      if (match) {
        matches.push(match);
      }
    }
  }
  return matches;
}

export function computeTeamHiddenMatchesForDisplay({ team, matchesMap }: ComputeTeamMatchesOptions): Match[] {
  const hiddenMatches: Match[] = [];
  for (const [matchId, teamMatch] of team.matches) {
    if (teamMatch.isHidden) {
      const match = matchesMap.get(matchId);
      if (match) {
        hiddenMatches.push(match);
      }
    }
  }
  return hiddenMatches;
}

function applyDateRangeFilter(match: Match, filters: MatchFilters): boolean {
  if (!filters.dateRange || filters.dateRange === 'all') return true;

  const matchDate = new Date(match.date);
  const now = new Date();

  switch (filters.dateRange) {
    case '7days':
      return matchDate >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case '30days':
      return matchDate >= new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case 'custom': {
      if (!filters.customDateRange.start || !filters.customDateRange.end) return true;
      const startDate = new Date(filters.customDateRange.start);
      const endDate = new Date(filters.customDateRange.end);
      return matchDate >= startDate && matchDate <= endDate;
    }
    default:
      return true;
  }
}

function applyResultFilter(teamMatch: StoredMatchData | undefined, filters: MatchFilters): boolean {
  if (!filters.result || filters.result === 'all' || !teamMatch) return true;
  return (
    (teamMatch.result === 'won' && filters.result === 'wins') ||
    (teamMatch.result === 'lost' && filters.result === 'losses')
  );
}

function applyTeamSideFilter(teamMatch: StoredMatchData | undefined, filters: MatchFilters): boolean {
  if (!filters.teamSide || filters.teamSide === 'all' || !teamMatch) return true;
  return teamMatch.side === filters.teamSide;
}

function applyPickOrderFilter(match: Match, teamMatch: StoredMatchData | undefined, filters: MatchFilters): boolean {
  if (!filters.pickOrder || filters.pickOrder === 'all' || !teamMatch) return true;

  const teamSide = teamMatch.side;
  const picks = match.draft[teamSide === 'radiant' ? 'radiantPicks' : 'direPicks'] || [];

  switch (filters.pickOrder) {
    case 'first':
      return picks.length > 0 && picks[0].order === 0;
    case 'second':
      return picks.length > 0 && picks[picks.length - 1].order === 9;
    default:
      return true;
  }
}

function applyHeroesFilter(match: Match, teamMatch: StoredMatchData | undefined, filters: MatchFilters): boolean {
  if (!filters.heroesPlayed || filters.heroesPlayed.length === 0 || !teamMatch) return true;

  const teamSide = teamMatch.side;
  const teamHeroes =
    match.draft[teamSide === 'radiant' ? 'radiantPicks' : 'direPicks']?.map((pick) => pick.hero.id.toString()) || [];

  return filters.heroesPlayed.some((heroId) => teamHeroes.includes(heroId));
}

function applyOpponentFilter(teamMatch: StoredMatchData | undefined, filters: MatchFilters): boolean {
  if (!filters.opponent || filters.opponent.length === 0 || !teamMatch) return true;
  return filters.opponent.some((opponent) => teamMatch.opponentName.toLowerCase().includes(opponent.toLowerCase()));
}

function applyHighPerformersFilter(
  match: Match,
  teamMatch: StoredMatchData | undefined,
  filters: MatchFilters,
): boolean {
  if (!filters.highPerformersOnly || !teamMatch) return true;

  const teamSide = teamMatch.side;
  const teamHeroes =
    match.draft[teamSide === 'radiant' ? 'radiantPicks' : 'direPicks']?.map((pick) => pick.hero.id) || [];

  const highPerformingHeroes = match.computed?.heroPerformance;
  if (!highPerformingHeroes) return true;

  const hasHighPerformer = teamHeroes.some((heroId) => highPerformingHeroes.get(heroId)?.isHighPerforming);

  return hasHighPerformer;
}

function applyAllFiltersExceptHighPerformers(
  match: Match,
  teamMatch: StoredMatchData | undefined,
  filters: MatchFilters,
): boolean {
  return (
    applyDateRangeFilter(match, filters) &&
    applyResultFilter(teamMatch, filters) &&
    applyTeamSideFilter(teamMatch, filters) &&
    applyPickOrderFilter(match, teamMatch, filters) &&
    applyHeroesFilter(match, teamMatch, filters) &&
    applyOpponentFilter(teamMatch, filters)
  );
}

function applyAllFilters(match: Match, teamMatch: StoredMatchData | undefined, filters: MatchFilters): boolean {
  return (
    applyAllFiltersExceptHighPerformers(match, teamMatch, filters) &&
    applyHighPerformersFilter(match, teamMatch, filters)
  );
}

function getMatchFilterStats(
  matches: Match[],
  teamMatches: Map<number, StoredMatchData>,
  filters: MatchFilters,
): MatchFilterStats {
  let totalMatches = 0;
  let filteredMatches = 0;
  let highPerformerMatches = 0;

  for (const match of matches) {
    const teamMatch = teamMatches.get(match.id);
    if (!teamMatch?.isHidden) {
      totalMatches++;

      if (applyAllFiltersExceptHighPerformers(match, teamMatch, filters)) {
        filteredMatches++;

        if (applyHighPerformersFilter(match, teamMatch, filters)) {
          highPerformerMatches++;
        }
      }
    }
  }

  return {
    totalMatches,
    filteredMatches,
    filterBreakdown: {
      dateRange: 0,
      result: 0,
      teamSide: 0,
      pickOrder: 0,
      heroesPlayed: 0,
      opponent: 0,
      highPerformersOnly: highPerformerMatches,
    },
  };
}

export function computeTeamMatchFilters(options: ComputeTeamMatchFiltersOptions): MatchFiltersResult {
  const { matches, teamMatches, filters, hiddenMatchIds: _hiddenMatchIds } = options;

  const filteredMatches = matches.filter((match) => {
    const teamMatch = teamMatches.get(match.id);
    return applyAllFilters(match, teamMatch, filters);
  });

  const stats = getMatchFilterStats(matches, teamMatches, filters);

  return {
    filteredMatches,
    filterStats: stats,
  };
}
