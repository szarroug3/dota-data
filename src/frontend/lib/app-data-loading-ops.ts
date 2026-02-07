import type { LeagueMatchesCache, Match, Player, Team } from '@/frontend/lib/app-data-types';
import { getOrFetchLeagueMatches } from '@/frontend/lib/league-matches-loader';
import { fetchTeamData } from '@/frontend/lib/team-loader';

/**
 * Returns true if the match has at least one player with a real (non-zero) account ID.
 * Placeholder matches from storage use accountId 0; full match data has real IDs.
 */
function matchHasRealPlayerIds(match: Match): boolean {
  for (const p of match.players.radiant) {
    if (p.accountId && p.accountId > 0) return true;
  }
  for (const p of match.players.dire) {
    if (p.accountId && p.accountId > 0) return true;
  }
  return false;
}

/**
 * Returns true if the match is fully loaded (not a placeholder).
 * Placeholders have no real player account IDs and must trigger a full loadMatch.
 */
function isMatchFullyLoaded(match: Match | undefined): boolean {
  if (!match?.players || match.error) return false;
  const hasBothSides = match.players.radiant.length > 0 && match.players.dire.length > 0;
  if (!hasBothSides) return false;
  return matchHasRealPlayerIds(match);
}

export interface AppDataLoadingOpsContext {
  _matches: Map<number, Match>;
  _teams: Map<string, Team>;
  leagueMatchesCache: Map<number, LeagueMatchesCache>;
  getTeam(teamKey: string): Team | undefined;
  loadMatch(matchId: number): Promise<Match | null>;
  loadPlayer(accountId: number): Promise<Player | null>;
  updateTeamMatchParticipation(teamKey: string, matchIds: number[]): void;
}

export async function loadPlayersFromMatchForTeam(
  appData: AppDataLoadingOpsContext,
  match: Match,
  side: 'radiant' | 'dire',
): Promise<void> {
  const playerIds = new Set<number>();

  const teamPlayers = match.players[side];
  teamPlayers.forEach((player) => {
    if (player.accountId) {
      playerIds.add(player.accountId);
    }
  });

  await Promise.allSettled(Array.from(playerIds).map((accountId) => appData.loadPlayer(accountId)));
}

export async function loadPlayersForTeamMatches(
  appData: AppDataLoadingOpsContext,
  teamKey: string,
  matchIds: number[],
): Promise<void> {
  const team = appData.getTeam(teamKey);
  if (!team) return;

  const playerLoadPromises = matchIds.map(async (matchId) => {
    const match = appData._matches.get(matchId);
    if (!match) return;

    const matchData = team.matches.get(matchId);
    if (!matchData?.side) return;

    await loadPlayersFromMatchForTeam(appData, match, matchData.side);
  });

  await Promise.allSettled(playerLoadPromises);
  appData.updateTeamMatchParticipation(teamKey, matchIds);
}

async function maybeLoadPlayersForMatches(
  appData: AppDataLoadingOpsContext,
  teamKey: string,
  matchIds: number[],
  force: boolean,
): Promise<void> {
  if (matchIds.length === 0) {
    return;
  }

  try {
    await loadPlayersForTeamMatches(appData, teamKey, matchIds);
  } catch (error) {
    console.error(
      `Failed to load players for team ${teamKey} (${force ? 'force' : 'delta'} mode) for matches:`,
      matchIds,
      error,
    );
  }
}

async function loadGlobalTeamMatches(
  appData: AppDataLoadingOpsContext,
  teamKey: string,
  force: boolean,
): Promise<void> {
  const team = appData.getTeam(teamKey);
  if (!team) return;

  const allMatchIds = Array.from(team.matches.entries())
    .filter(([, matchData]) => matchData.isManual)
    .map(([matchId]) => matchId);
  if (allMatchIds.length === 0) {
    return;
  }

  const matchIdsToLoad = force
    ? allMatchIds
    : allMatchIds.filter((matchId) => !isMatchFullyLoaded(appData._matches.get(matchId)));

  if (matchIdsToLoad.length === 0) {
    appData.updateTeamMatchParticipation(teamKey, allMatchIds);
    await maybeLoadPlayersForMatches(appData, teamKey, allMatchIds, force);
    return;
  }

  await Promise.allSettled(matchIdsToLoad.map((matchId) => appData.loadMatch(matchId)));
  appData.updateTeamMatchParticipation(teamKey, allMatchIds);
  await maybeLoadPlayersForMatches(appData, teamKey, force ? allMatchIds : matchIdsToLoad, force);
}

async function loadRegularTeamMatches(
  appData: AppDataLoadingOpsContext,
  teamKey: string,
  team: Team,
  force: boolean,
): Promise<void> {
  const leagueCache = appData.leagueMatchesCache.get(team.leagueId);
  const leagueMatchIds = leagueCache?.matchIdsByTeam.get(team.teamId) || [];
  const manualMatchIds = Array.from(team.matches.entries())
    .filter(([, matchData]) => matchData.isManual)
    .map(([matchId]) => matchId);
  const allMatchIds = [...leagueMatchIds, ...manualMatchIds];

  const matchIdsToLoad = force
    ? allMatchIds
    : allMatchIds.filter((matchId) => !isMatchFullyLoaded(appData._matches.get(matchId)));

  if (matchIdsToLoad.length === 0) {
    appData.updateTeamMatchParticipation(teamKey, allMatchIds);
    await maybeLoadPlayersForMatches(appData, teamKey, allMatchIds, force);
    return;
  }

  await Promise.allSettled(matchIdsToLoad.map((matchId) => appData.loadMatch(matchId)));
  appData.updateTeamMatchParticipation(teamKey, allMatchIds);
  await maybeLoadPlayersForMatches(appData, teamKey, force ? allMatchIds : matchIdsToLoad, force);
}

export async function loadTeamMatches(
  appData: AppDataLoadingOpsContext,
  teamKey: string,
  force = false,
): Promise<void> {
  const team = appData.getTeam(teamKey);
  if (!team) {
    console.error(`Team ${teamKey} not found`);
    return;
  }

  if (team.isGlobal) {
    await loadGlobalTeamMatches(appData, teamKey, force);
  } else {
    await loadRegularTeamMatches(appData, teamKey, team, force);
  }
}

export async function loadAllManualPlayers(appData: AppDataLoadingOpsContext): Promise<void> {
  const playerIds = new Set<number>();

  for (const team of appData._teams.values()) {
    for (const [playerId, playerData] of team.players) {
      if (playerData.isManual) {
        playerIds.add(playerId);
      }
    }
  }

  await Promise.allSettled(Array.from(playerIds).map((id) => appData.loadPlayer(id)));
}

export async function loadAllManualMatches(appData: AppDataLoadingOpsContext): Promise<void> {
  const matchIds = new Set<number>();

  for (const team of appData._teams.values()) {
    for (const [matchId, matchData] of team.matches) {
      if (matchData.isManual) {
        matchIds.add(matchId);
      }
    }
  }

  await Promise.allSettled(Array.from(matchIds).map((id) => appData.loadMatch(id)));

  for (const team of appData._teams.values()) {
    const manualMatchIds = Array.from(team.matches.entries())
      .filter(([, matchData]) => matchData.isManual)
      .map(([matchId]) => matchId);

    if (manualMatchIds.length > 0) {
      appData.updateTeamMatchParticipation(team.id, manualMatchIds);
    }
  }
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

  let leagueError: string | undefined;
  const leagueResult = results[0];
  if (leagueResult.status === 'rejected') {
    leagueError = leagueResult.reason instanceof Error ? leagueResult.reason.message : 'Failed to fetch league matches';
    console.error(`Failed to fetch league matches for league ${leagueId}:`, leagueResult.reason);
  }

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
