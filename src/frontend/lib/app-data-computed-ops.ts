import type { Match, Team, LeagueMatchesCache, LeagueMatchInfo } from './app-data-types';
import type { StoredMatchData } from './storage-manager';

export interface AppDataComputedOpsContext {
  _teams: Map<string, Team>;
  _matches: Map<number, Match>;
  leagueMatchesCache: Map<number, LeagueMatchesCache>;
}

function sortMatchesByDateDesc(matches: Match[]): Match[] {
  return [...matches].sort((a, b) => {
    const aTime = Number.isFinite(Date.parse(a.date)) ? Date.parse(a.date) : 0;
    const bTime = Number.isFinite(Date.parse(b.date)) ? Date.parse(b.date) : 0;
    return bTime - aTime;
  });
}

export function getTeamMatches(appData: AppDataComputedOpsContext, teamKey: string): Match[] {
  const team = appData._teams.get(teamKey);
  if (!team) return [];

  // Combine match IDs from cache and stored metadata
  const leagueCache = appData.leagueMatchesCache.get(team.leagueId);
  const leagueMatchIds = leagueCache?.matchIdsByTeam.get(team.teamId) || [];
  const storedMatchIds = Array.from(team.matches.keys());
  const allMatchIds = new Set([...leagueMatchIds, ...storedMatchIds]);

  // Return matches that exist in our matches Map
  return sortMatchesByDateDesc(
    Array.from(allMatchIds)
      .map((matchId) => appData._matches.get(matchId))
      .filter((match): match is Match => match !== undefined),
  );
}

export function getMatchesByIds(appData: AppDataComputedOpsContext, matchIds: number[]): Match[] {
  return sortMatchesByDateDesc(
    matchIds.map((id) => appData._matches.get(id)).filter((match): match is Match => match !== undefined),
  );
}

export function getTeamPlayerIds(appData: AppDataComputedOpsContext, teamKey: string): Set<number> {
  const team = appData._teams.get(teamKey);
  if (!team) return new Set();

  // Start with ALL stored player IDs (both manual and non-manual)
  const storedPlayerIds = Array.from(team.players.entries())
    .filter(([, playerData]) => playerData.accountId > 0)
    .map(([playerId]) => playerId);
  const playerIds = new Set<number>(storedPlayerIds);

  // Add player IDs from league matches
  const leagueCache = appData.leagueMatchesCache.get(team.leagueId);
  const matchIds = leagueCache?.matchIdsByTeam.get(team.teamId) || [];

  matchIds.forEach((matchId) => {
    const matchInfo = leagueCache?.matches.get(matchId);
    if (!matchInfo) return;

    // Add players based on which side the team played
    if (matchInfo.radiantTeamId === team.teamId) {
      matchInfo.radiantPlayerIds.forEach((id) => playerIds.add(id));
    }
    if (matchInfo.direTeamId === team.teamId) {
      matchInfo.direPlayerIds.forEach((id) => playerIds.add(id));
    }
  });

  // Add players from manual matches
  const manualMatchIds = Array.from(team.matches.entries())
    .filter(([, matchData]) => matchData.isManual)
    .map(([matchId]) => matchId);

  manualMatchIds.forEach((matchId) => {
    const match = appData._matches.get(matchId);
    if (!match) return;

    const matchData = team.matches.get(matchId);
    if (!matchData?.side) return;

    // Add players from the team's side
    const teamPlayers = match.players[matchData.side];
    teamPlayers.forEach((player) => {
      if (player.accountId) {
        playerIds.add(player.accountId);
      }
    });
  });

  return playerIds;
}
