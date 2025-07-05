import { useMatchData as useGlobalMatchData } from "@/contexts/match-data-context";
import { useTeam } from "@/contexts/team-context";
import { type Match } from "./match-utils";

export function useMatchData() {
  const { currentTeam, isLoaded } = useTeam();
  const { matches: teamMatches } = useTeam();
  const { getTeamMatches, isTeamLoading, getTeamError } = useGlobalMatchData();
  
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

  // Determine which matches to use
  let matches: Match[] = [];
  if (processedMatches && processedMatches.length > 0) {
    matches = processedMatches;
  } else if (teamMatches.length > 0) {
    matches = teamMatches;
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