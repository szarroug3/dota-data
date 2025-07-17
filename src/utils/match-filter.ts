import type { MatchFilters } from '@/components/match-history/filters/MatchFilters';
import type { Match } from '@/types/contexts/match-context-value';

function filterByCustomDateRange(matchDate: Date, customDateRange: MatchFilters['customDateRange']): boolean {
  if (customDateRange.start) {
    const startDate = new Date(customDateRange.start);
    if (matchDate < startDate) return false;
  }
  if (customDateRange.end) {
    const endDate = new Date(customDateRange.end);
    endDate.setHours(23, 59, 59, 999); // Include the entire end date
    if (matchDate > endDate) return false;
  }
  return true;
}

function filterByDateRange(match: Match, dateRange: MatchFilters['dateRange'], customDateRange: MatchFilters['customDateRange']): boolean {
  if (dateRange === 'all') return true;
  
  const matchDate = new Date(match.date);
  
  if (dateRange === 'custom') {
    return filterByCustomDateRange(matchDate, customDateRange);
  }
  
  const now = new Date();
  let cutoff: Date | null = null;
  if (dateRange === '7days') {
    cutoff = new Date(now);
    cutoff.setDate(now.getDate() - 7);
  } else if (dateRange === '30days') {
    cutoff = new Date(now);
    cutoff.setDate(now.getDate() - 30);
  }
  if (cutoff) {
    if (matchDate < cutoff) return false;
  }
  return true;
}

function filterByResult(match: Match, result: MatchFilters['result']): boolean {
  if (result === 'all') return true;
  if (result === 'wins') return match.result === 'win';
  if (result === 'losses') return match.result === 'loss';
  return true;
}

function filterByOpponent(match: Match, opponent: string[]): boolean {
  if (opponent.length === 0) return true;
  return opponent.some(opp => match.opponent.toLowerCase().includes(opp.toLowerCase()));
}

function filterByTeamSide(match: Match, teamSide: MatchFilters['teamSide']): boolean {
  if (teamSide === 'all') return true;
  return match.teamSide === teamSide;
}

function filterByHeroesPlayed(match: Match, heroesPlayed: string[]): boolean {
  if (heroesPlayed.length === 0) return true;
  return heroesPlayed.some(hero => match.heroes.includes(hero));
}

export function filterMatches(matches: Match[], filters: MatchFilters): Match[] {
  const filteredMatches = matches.filter(match =>
    filterByDateRange(match, filters.dateRange, filters.customDateRange) &&
    filterByResult(match, filters.result) &&
    filterByOpponent(match, filters.opponent) &&
    filterByTeamSide(match, filters.teamSide) &&
    filterByHeroesPlayed(match, filters.heroesPlayed)
  );
  
  // Sort by date in descending order (newest to oldest)
  return filteredMatches.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
} 