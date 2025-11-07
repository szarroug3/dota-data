import type { LeagueMatchesCache } from './app-data-types';
import { getOrFetchLeagueMatches } from './league-matches-loader';
import { fetchTeamData } from './team-loader';

interface AppDataLoadingOpsContext {
  leagueMatchesCache: Map<number, LeagueMatchesCache>;
}

export async function fetchTeamAndLeagueData(
  appData: AppDataLoadingOpsContext,
  teamId: number,
  leagueId: number,
  fetchTeam = false,
  forceLeague = false,
): Promise<{ teamData: { name?: string }; teamError?: string; leagueError?: string }> {
  const promises: Promise<unknown>[] = [getOrFetchLeagueMatches(leagueId, appData.leagueMatchesCache, forceLeague)];
  if (fetchTeam) promises.push(fetchTeamData(teamId));

  const results = await Promise.allSettled(promises);

  // Handle league matches fetch result
  let leagueError: string | undefined;
  const leagueResult = results[0];
  if (leagueResult.status === 'rejected') {
    leagueError = leagueResult.reason instanceof Error ? leagueResult.reason.message : 'Failed to fetch league matches';
    console.error(`Failed to fetch league matches for league ${leagueId}:`, leagueResult.reason);
  }

  // Handle team fetch result (at index 1 if fetched)
  let teamData: { name?: string } = {};
  let teamError: string | undefined;
  if (fetchTeam) {
    const teamResult = results[1];
    if (teamResult.status === 'fulfilled') {
      teamData = teamResult.value as { name?: string };
    } else {
      teamError = teamResult.reason instanceof Error ? teamResult.reason.message : 'Failed to fetch team data';
      console.error(`Failed to fetch team ${teamId}:`, teamResult.reason);
    }
  }

  return { teamData, teamError, leagueError };
}
