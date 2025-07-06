/**
 * Match type conversion utilities
 * 
 * This file provides utilities to convert between different match types
 * used throughout the application:
 * - Match (from team.ts) - simplified internal type
 * - MatchData (from contexts.ts) - processed API response
 * - Match (from match-utils.ts) - hybrid type for dashboard
 * - OpenDotaFullMatch - raw API type
 */

import type { Match as DashboardMatch } from '@/app/dashboard/match-history/match-utils';
import type { MatchData } from '@/types/contexts';
import type { OpenDotaFullMatch } from '@/types/opendota';
import type { Match as TeamMatch } from '@/types/team';

// Helper function to create picks_bans array
function createPicksBans(matchData: MatchData) {
  return [
    ...(matchData.picks?.map((pick) => ({
      hero_id: pick,
      is_pick: true,
      team: 0
    })) || []),
    ...(matchData.bans?.map((ban) => ({
      hero_id: ban,
      is_pick: false,
      team: 0
    })) || [])
  ];
}

/**
 * Convert MatchData to DashboardMatch for use in dashboard components
 */
export function convertMatchDataToDashboardMatch(matchData: MatchData): DashboardMatch {
  const picksBans = createPicksBans(matchData);
  
  return {
    id: matchData.id,
    match_id: matchData.id, // Use id as match_id since MatchData doesn't have openDota
    result: matchData.result,
    openDota: undefined, // MatchData doesn't have openDota property
    picks_bans: picksBans
  };
}

/**
 * Convert TeamMatch to DashboardMatch for use in dashboard components
 */
export function convertTeamMatchToDashboardMatch(teamMatch: TeamMatch): DashboardMatch {
  return {
    id: teamMatch.id,
    match_id: teamMatch.id,
    result: teamMatch.result,
    openDota: teamMatch.openDota as OpenDotaFullMatch | undefined,
    picks_bans: teamMatch.openDota?.picks_bans as DashboardMatch['picks_bans'] || []
  };
}

/**
 * Convert DashboardMatch to MatchData for API responses
 */
export function convertDashboardMatchToMatchData(dashboardMatch: DashboardMatch): MatchData {
  return {
    id: dashboardMatch.id || '',
    date: new Date().toISOString(), // Default date
    opponent: 'Unknown',
    result: dashboardMatch.result as 'W' | 'L' || 'L',
    score: '0-0',
    duration: '0:00',
    league: 'Unknown',
    map: 'Unknown',
    picks: dashboardMatch.picks_bans?.filter(pb => pb.is_pick).map(pb => pb.hero_id.toString()) || [],
    bans: dashboardMatch.picks_bans?.filter(pb => !pb.is_pick).map(pb => pb.hero_id.toString()) || [],
    opponentPicks: [],
    opponentBans: [],
    draftOrder: [],
    highlights: [],
    playerStats: {
      kills: 0,
      deaths: 0,
      assists: 0,
      hero: 'Unknown'
    },
    games: []
  };
}

/**
 * Type guard to check if an object is MatchData
 */
export function isMatchData(obj: unknown): obj is MatchData {
  return obj !== null && 
         typeof obj === 'object' && 
         'id' in obj && 
         'result' in obj && 
         'score' in obj;
}

/**
 * Type guard to check if an object is DashboardMatch
 */
export function isDashboardMatch(obj: unknown): obj is DashboardMatch {
  return obj !== null && 
         typeof obj === 'object' && 
         ('id' in obj || 'match_id' in obj);
}

/**
 * Type guard to check if an object is TeamMatch
 */
export function isTeamMatch(obj: unknown): obj is TeamMatch {
  return obj !== null && 
         typeof obj === 'object' && 
         'id' in obj && 
         'date' in obj && 
         'opponent' in obj;
}

// Helper function to extract team match basic info
function extractTeamMatchBasicInfo(dashboardMatch: DashboardMatch) {
  return {
    id: dashboardMatch.id || dashboardMatch.match_id || '',
    date: dashboardMatch.openDota?.start_time ? new Date(dashboardMatch.openDota.start_time * 1000).toISOString() : '',
    result: dashboardMatch.result || '',
    league: ''
  };
}

// Helper function to extract team match opponent info
function extractTeamMatchOpponentInfo(dashboardMatch: DashboardMatch) {
  const opponent = dashboardMatch.openDota?.radiant_name || dashboardMatch.openDota?.dire_name || 'Unknown';
  const score = dashboardMatch.openDota?.radiant_score && dashboardMatch.openDota?.dire_score 
    ? `${dashboardMatch.openDota.radiant_score}-${dashboardMatch.openDota.dire_score}`
    : '0-0';
  
  return { opponent, score };
}

/**
 * Convert DashboardMatch to TeamMatch
 */
export function convertDashboardMatchToTeamMatch(dashboardMatch: DashboardMatch): TeamMatch {
  const basicInfo = extractTeamMatchBasicInfo(dashboardMatch);
  const opponentInfo = extractTeamMatchOpponentInfo(dashboardMatch);
  
  return {
    id: basicInfo.id,
    date: basicInfo.date,
    opponent: opponentInfo.opponent,
    result: basicInfo.result,
    score: opponentInfo.score,
    league: basicInfo.league,
    notes: dashboardMatch.openDota ? 'OpenDota data available' : 'No OpenDota data',
    openDota: dashboardMatch.openDota
  };
} 