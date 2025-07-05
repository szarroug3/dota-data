/**
 * Match type conversion utilities
 * 
 * This file provides utilities to convert between different match types
 * used throughout the application:
 * - Match (from team.ts) - simplified internal type
 * - MatchData (from useMatchData.ts) - processed API response
 * - Match (from match-utils.ts) - hybrid type for dashboard
 * - OpenDotaFullMatch - raw API type
 */

import type { Match as TeamMatch } from '@/types/team';
import type { MatchData } from '@/lib/hooks/useMatchData';
import type { Match as DashboardMatch, PickBan } from '@/app/dashboard/match-history/match-utils';
import type { OpenDotaFullMatch } from '@/types/opendota';

/**
 * Convert MatchData to DashboardMatch for use in dashboard components
 */
export function convertMatchDataToDashboardMatch(matchData: MatchData): DashboardMatch {
  return {
    id: matchData.id,
    match_id: matchData.openDota?.matchId?.toString(),
    result: matchData.result,
    openDota: matchData.openDota ? {
      match_id: matchData.openDota.matchId,
      radiant_win: matchData.openDota.radiantWin,
      start_time: matchData.openDota.startTime,
      isRadiant: matchData.openDota.isRadiant,
      // Add other required OpenDotaFullMatch properties
      player_slot: 0,
      duration: 0,
      game_mode: 0,
      lobby_type: 0,
      hero_id: 0,
      version: 0,
      kills: 0,
      deaths: 0,
      assists: 0,
      skill: 0,
      leaver_status: 0,
      party_size: 0,
      cluster: 0,
      patch: 0,
      region: 0,
      win: 0,
      lose: 0,
      total_gold: 0,
      total_xp: 0,
      kills_per_min: 0,
      kda: 0,
      abandons: 0,
      neutral_kills: 0,
      tower_kills: 0,
      courier_kills: 0,
      lane_kills: 0,
      hero_kills: 0,
      observer_kills: 0,
      sentry_kills: 0,
      roshan_kills: 0,
      necronomicon_kills: 0,
      ancient_kills: 0,
      buyback_count: 0,
      observer_uses: 0,
      sentry_uses: 0,
      lane_efficiency: 0,
      lane_efficiency_pct: 0,
      lane: 0,
      lane_role: 0,
      is_roaming: false,
      purchase_time: {},
      first_purchase_time: {},
      item_win: {},
      item_usage: {},
      purchase_tpscroll: {},
      actions_per_min: 0,
      life_state_dead: 0,
      rank_tier: 0,
      cosmetics: [],
      benchmarks: {},
      players: [],
      picks_bans: [
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
      ]
    } : undefined,
    picks_bans: [
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
    ]
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
    playerStats: {},
    games: [],
    openDota: dashboardMatch.openDota ? {
      isRadiant: dashboardMatch.openDota.isRadiant,
      radiantWin: dashboardMatch.openDota.radiant_win,
      startTime: dashboardMatch.openDota.start_time,
      matchId: dashboardMatch.openDota.match_id
    } : undefined
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

/**
 * Convert a Dashboard Match to a Team Match
 */
export function convertDashboardMatchToTeamMatch(dashboardMatch: DashboardMatch): TeamMatch {
  return {
    id: dashboardMatch.id || dashboardMatch.match_id || '',
    date: dashboardMatch.openDota?.start_time ? new Date(dashboardMatch.openDota.start_time * 1000).toISOString() : '',
    opponent: dashboardMatch.openDota?.radiant_name || dashboardMatch.openDota?.dire_name || 'Unknown',
    result: dashboardMatch.result || '',
    score: dashboardMatch.openDota?.radiant_score && dashboardMatch.openDota?.dire_score 
      ? `${dashboardMatch.openDota.radiant_score} - ${dashboardMatch.openDota.dire_score}` 
      : '',
    league: '',
    openDota: dashboardMatch.openDota as Record<string, unknown>
  };
} 