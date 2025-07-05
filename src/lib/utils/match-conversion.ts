/**
 * Simple match type conversion utilities
 * 
 * This file provides utilities to convert between different match types
 * used throughout the application.
 */

import type { Match as TeamMatch } from '@/types/team';
import type { Match as DashboardMatch, PickBan } from '@/app/dashboard/match-history/match-utils';

/**
 * Convert TeamMatch to DashboardMatch for use in dashboard components
 */
export function convertTeamMatchToDashboardMatch(teamMatch: TeamMatch): DashboardMatch {
  return {
    id: teamMatch.id,
    match_id: teamMatch.openDota?.match_id?.toString(),
    result: teamMatch.result,
    openDota: teamMatch.openDota as any, // Type assertion for compatibility
    picks_bans: (teamMatch.openDota?.picks_bans || []) as PickBan[]
  };
}

/**
 * Convert array of TeamMatch to array of DashboardMatch
 */
export function convertTeamMatchesToDashboardMatches(teamMatches: TeamMatch[]): DashboardMatch[] {
  return teamMatches.map(convertTeamMatchToDashboardMatch);
} 