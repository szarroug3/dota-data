import { useMatchData as useMatchDataContext } from "@/contexts/match-data-context";
import { useTeam } from "@/contexts/team-context";
import { convertTeamMatchesToDashboardMatches } from "@/lib/utils/match-conversion";
import type { OpenDotaMatch } from "@/types/opendota";
import { useEffect } from "react";
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
  }, [currentTeam, matchIds, loadingMatches, processedMatches.length, fetchTeamMatches]);

  // Determine which matches to use
  let matches: Match[] = [];
  if (processedMatches && processedMatches.length > 0) {
    // Convert MatchData to Match (dashboard type)
    matches = processedMatches.map(matchData => {
      // The API returns OpenDotaMatch data, so we need to convert it to the expected format
      const openDotaData = matchData as unknown as OpenDotaMatch;
      
      return {
        id: matchData.id,
        match_id: openDotaData.match_id?.toString(),
        result: matchData.result,
        openDota: openDotaData,
        picks_bans: openDotaData.picks_bans?.map(pb => ({
          hero_id: pb.hero_id.toString(),
          is_pick: pb.is_pick,
          team: pb.team
        })) || []
      };
    });
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