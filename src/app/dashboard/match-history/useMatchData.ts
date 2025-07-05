import React, { useEffect } from "react";
import { useMatchDataContext } from "@/contexts/match-data-context";
import { useTeam } from "@/contexts/team-context";
import { convertTeamMatchesToDashboardMatches } from "@/lib/utils/match-conversion";
import { type Match } from "./match-utils";

export function useMatchData() {
  const { currentTeam, isLoaded, matches: teamMatches } = useTeam();
  const { getTeamMatches, isTeamLoading, getTeamError, fetchTeamMatches } = useMatchDataContext();
  
  // Get match IDs from current team
  let matchIds: string[] = [];
  if (currentTeam?.matchIdsByLeague && currentTeam.leagueId) {
    matchIds = currentTeam.matchIdsByLeague[currentTeam.leagueId] || [];
  } else if (currentTeam?.matchIds) {
    // Fallback to old matchIds property
    matchIds = currentTeam.matchIds;
  }

  // Get processed matches from global context
  const processedMatches = currentTeam ? getTeamMatches(currentTeam.id, matchIds) : [];
  const loadingMatches = currentTeam ? isTeamLoading(currentTeam.id) : false;
  const error = currentTeam ? getTeamError(currentTeam.id) : null;

  // Trigger fetch if we have match IDs but no data and not loading
  useEffect(() => {
    if (currentTeam && matchIds.length > 0 && !loadingMatches) {
      // Only fetch if we don't have any processed matches for this team
      const hasProcessedMatches = processedMatches.length > 0;
      if (!hasProcessedMatches) {
        fetchTeamMatches(currentTeam.id, matchIds);
      }
    }
  }, [currentTeam?.id, matchIds.join(','), loadingMatches, fetchTeamMatches]);

  // Determine which matches to use
  let matches: Match[] = [];
  if (processedMatches && processedMatches.length > 0) {
    // Convert MatchData to Match (dashboard type)
    matches = processedMatches.map(matchData => ({
      id: matchData.id,
      match_id: matchData.openDota?.matchId?.toString(),
      result: matchData.result,
      openDota: matchData.openDota ? {
        match_id: matchData.openDota.matchId,
        radiant_win: matchData.openDota.radiantWin,
        start_time: matchData.openDota.startTime,
        isRadiant: matchData.openDota.isRadiant,
        // Add minimal required properties
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
        picks_bans: []
      } : undefined,
      picks_bans: []
    }));
  } else if (teamMatches.length > 0) {
    matches = convertTeamMatchesToDashboardMatches(teamMatches);
  } else {
    matches = [];
  }
  
  // Ensure each match has an 'id' property for the UI
  matches = matches.map(m => ({ ...m, id: m.match_id ?? m.id }));

  return {
    matches,
    loadingMatches,
    isLoaded,
    currentTeam,
    error
  };
} 