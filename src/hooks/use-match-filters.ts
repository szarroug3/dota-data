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
  matchDuration: 'all' | 'short' | 'medium' | 'long';
  playerPerformance: string[];
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
    matchDuration: number;
    playerPerformance: number;
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

function applyHeroesFilter(match: Match, teamMatch: TeamMatchParticipation | undefined, filters: MatchFilters): boolean {
  if (filters.heroesPlayed.length === 0 || !teamMatch) return true;
  
  // Get heroes played by the team in this match from draft data
  const teamPicks = teamMatch.side === 'radiant' ? 
    match.draft?.radiantPicks || [] : 
    match.draft?.direPicks || [];
  
  const playedHeroes = teamPicks
    .map(pick => pick.hero?.id?.toString())
    .filter((id): id is string => !!id);
  
  // Check if any of the filtered heroes were played
  return filters.heroesPlayed.some(heroId => playedHeroes.includes(heroId));
}

function applyOpponentFilter(teamMatch: TeamMatchParticipation | undefined, filters: MatchFilters): boolean {
  if (filters.opponent.length === 0 || !teamMatch || !teamMatch.opponentName) return true;
  
  // Get the opponent name from the team match participation data
  const opponentName = teamMatch.opponentName;
  
  // Check if the opponent team name matches any of the filtered opponents
  return filters.opponent.some(opponentNameFilter => opponentNameFilter === opponentName);
}

function applyMatchDurationFilter(teamMatch: TeamMatchParticipation | undefined, filters: MatchFilters): boolean {
  if (filters.matchDuration === 'all' || !teamMatch?.duration) return true;
  
  const durationMinutes = teamMatch.duration / 60;
  
  switch (filters.matchDuration) {
    case 'short':
      return durationMinutes < 30;
    case 'medium':
      return durationMinutes >= 30 && durationMinutes <= 45;
    case 'long':
      return durationMinutes > 45;
    default:
      return true;
  }
}

function applyPlayerPerformanceFilter(match: Match, teamMatch: TeamMatchParticipation | undefined, filters: MatchFilters): boolean {
  if (filters.playerPerformance.length === 0 || !teamMatch?.side) return true;
  
  const teamPlayers = match.players[teamMatch.side] || [];
  if (teamPlayers.length === 0) return true;
  
  // Calculate team averages for performance metrics
  const totalKDA = teamPlayers.reduce((sum, player) => {
    const kda = player.stats.deaths > 0 ? (player.stats.kills + player.stats.assists) / player.stats.deaths : player.stats.kills + player.stats.assists;
    return sum + kda;
  }, 0);
  
  const totalGPM = teamPlayers.reduce((sum, player) => sum + player.stats.gpm, 0);
  const totalXPM = teamPlayers.reduce((sum, player) => sum + player.stats.xpm, 0);
  const totalLastHits = teamPlayers.reduce((sum, player) => sum + player.stats.lastHits, 0);
  
  const avgKDA = totalKDA / teamPlayers.length;
  const avgGPM = totalGPM / teamPlayers.length;
  const avgXPM = totalXPM / teamPlayers.length;
  const avgLastHits = totalLastHits / teamPlayers.length;
  
  // Performance thresholds (these could be made configurable)
  const thresholds = {
    'high-kda': 3.0,
    'high-gpm': 500,
    'high-xpm': 600,
    'high-last-hits': 200
  };
  
  // Check if ALL selected performance criteria are met
  return filters.playerPerformance.every(performance => {
    switch (performance) {
      case 'high-kda':
        return avgKDA >= thresholds['high-kda'];
      case 'high-gpm':
        return avgGPM >= thresholds['high-gpm'];
      case 'high-xpm':
        return avgXPM >= thresholds['high-xpm'];
      case 'high-last-hits':
        return avgLastHits >= thresholds['high-last-hits'];
      default:
        return true;
    }
  });
}

// ============================================================================
// MAIN FILTER FUNCTION
// ============================================================================

function applyAllFilters(
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
    applyOpponentFilter(teamMatch, filters) &&
    applyMatchDurationFilter(teamMatch, filters) &&
    applyPlayerPerformanceFilter(match, teamMatch, filters)
  );
}

// ============================================================================
// STATISTICS HELPER
// ============================================================================

function getFilterStats(
  matches: Match[],
  teamMatches: Record<number, TeamMatchParticipation>,
  filters: MatchFilters,
): FilterStats {
  const totalMatches = matches.length;
  const filteredMatches = matches.filter(match => applyAllFilters(match, teamMatches, filters));
  
  // Count matches that pass each individual filter
  const filterBreakdown = {
    dateRange: matches.filter(match => applyDateRangeFilter(match, filters)).length,
    result: matches.filter(match => {
      const teamMatch = teamMatches[match.id];
      return applyResultFilter(teamMatch, filters);
    }).length,
    teamSide: matches.filter(match => {
      const teamMatch = teamMatches[match.id];
      return applyTeamSideFilter(teamMatch, filters);
    }).length,
    pickOrder: matches.filter(match => {
      const teamMatch = teamMatches[match.id];
      return applyPickOrderFilter(teamMatch, filters);
    }).length,
    heroesPlayed: matches.filter(match => {
      const teamMatch = teamMatches[match.id];
      return applyHeroesFilter(match, teamMatch, filters);
    }).length,
    opponent: matches.filter(match => {
      const teamMatch = teamMatches[match.id];
      return applyOpponentFilter(teamMatch, filters);
    }).length,
    matchDuration: matches.filter(match => {
      const teamMatch = teamMatches[match.id];
      return applyMatchDurationFilter(teamMatch, filters);
    }).length,
    playerPerformance: matches.filter(match => {
      const teamMatch = teamMatches[match.id];
      return applyPlayerPerformanceFilter(match, teamMatch, filters);
    }).length,
  };
  
  return {
    totalMatches,
    filteredMatches: filteredMatches.length,
    filterBreakdown
  };
}

// ============================================================================
// MAIN HOOK
// ============================================================================

export function useMatchFilters(
  matches: Match[],
  teamMatches: Record<number, TeamMatchParticipation>,
  filters: MatchFilters,
) {
  const filteredMatches = useMemo(() => {
    return matches.filter(match => applyAllFilters(match, teamMatches, filters));
  }, [matches, teamMatches, filters]);
  
  const filterStats = useMemo(() => {
    return getFilterStats(matches, teamMatches, filters);
  }, [matches, teamMatches, filters]);
  
  return {
    filteredMatches,
    filterStats
  };
} 