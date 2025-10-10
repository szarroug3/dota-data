/**
 * Team helper functions
 */

import type { Match, MatchContextValue } from '@/frontend/types/contexts/match-context-value';
import type { PlayerContextValue } from '@/frontend/types/contexts/player-context-value';
import type { TeamData, TeamMatchParticipation } from '@/frontend/types/contexts/team-context-value';

export function generateTeamKey(teamId: number, leagueId: number): string {
  return `${teamId}-${leagueId}`;
}

export function createInitialTeamData(teamId: number, leagueId: number): TeamData {
  return {
    team: { id: teamId, name: `Loading ${teamId}` },
    league: { id: leagueId, name: `Loading ${leagueId}` },
    timeAdded: new Date().toISOString(),
    matches: {},
    players: [],
    performance: {
      totalMatches: 0,
      totalWins: 0,
      totalLosses: 0,
      overallWinRate: 0,
      heroUsage: { picks: [], bans: [], picksAgainst: [], bansAgainst: [], picksByPlayer: {} },
      draftStats: {
        firstPickCount: 0,
        secondPickCount: 0,
        firstPickWinRate: 0,
        secondPickWinRate: 0,
        uniqueHeroesPicked: 0,
        uniqueHeroesBanned: 0,
        mostPickedHero: '',
        mostBannedHero: ''
      },
      currentWinStreak: 0,
      currentLoseStreak: 0,
      averageMatchDuration: 0,
      averageKills: 0,
      averageDeaths: 0,
      averageGold: 0,
      averageExperience: 0
    },
    isLoading: true
  };
}

export function determineTeamSideFromMatch(match: Match, teamId: number): 'radiant' | 'dire' {
  if (match.radiant.id === teamId) return 'radiant';
  if (match.dire.id === teamId) return 'dire';
  throw new Error(`Could not determine team side for team ${teamId} in match ${match.id}`);
}

export function extractPlayersFromMatchSide(
  match: Match,
  teamSide: 'radiant' | 'dire'
): number[] {
  const players = teamSide === 'radiant' ? match.players.radiant : match.players.dire;
  return players.map(player => player.accountId);
}

export function validateActiveTeam(activeTeam: { teamId: number; leagueId: number } | null): { teamId: number; leagueId: number } {
  if (!activeTeam) throw new Error('No active team selected');
  return activeTeam;
}

export function updateTeamError(
  teamId: number,
  leagueId: number,
  errorMessage: string,
  state: {
    teams: Map<string, TeamData>;
    setTeams: React.Dispatch<React.SetStateAction<Map<string, TeamData>>>;
  },
  configContext: { setTeams: (teams: Map<string, TeamData>) => void }
) {
  const teamKey = generateTeamKey(teamId, leagueId);
  const existingTeam = state.teams.get(teamKey);
  const nextTeam: TeamData = existingTeam
    ? { ...existingTeam, error: errorMessage, isLoading: false }
    : { ...createInitialTeamData(teamId, leagueId), error: errorMessage, isLoading: false };

  state.setTeams(prev => {
    const newTeams = new Map(prev);
    newTeams.set(teamKey, nextTeam);
    try { configContext.setTeams(newTeams); } catch (error) { console.warn('Failed to persist team error state:', error); }
    return newTeams;
  });
}

export function setTeamLoading(
  teamId: number,
  leagueId: number,
  isLoading: boolean,
  state: { teams: Map<string, TeamData>; setTeams: React.Dispatch<React.SetStateAction<Map<string, TeamData>>> }
) {
  const teamKey = generateTeamKey(teamId, leagueId);
  const existingTeam = state.teams.get(teamKey);
  if (!existingTeam) return;
  state.setTeams(prev => {
    const newTeams = new Map(prev);
    newTeams.set(teamKey, { ...existingTeam, isLoading });
    return newTeams;
  });
}

export function updateTeamPerformance(
  team: TeamData,
  matchesWithCorrectSides: Record<number, TeamMatchParticipation>,
  originalTeamData: { matches: Array<{ matchId: number; result: string }> }
): TeamData {
  return {
    ...team,
    matches: matchesWithCorrectSides,
    performance: {
      ...team.performance,
      totalMatches: Object.keys(matchesWithCorrectSides).length,
      totalWins: Object.values(matchesWithCorrectSides).filter(m => originalTeamData.matches.find(x => x.matchId === m.matchId)?.result === 'won').length,
      totalLosses: Object.values(matchesWithCorrectSides).filter(m => originalTeamData.matches.find(x => x.matchId === m.matchId)?.result === 'lost').length
    }
  };
}

export function createTeamUpdater(
  setTeams: React.Dispatch<React.SetStateAction<Map<string, TeamData>>>
) {
  return (teamKey: string, updater: (team: TeamData) => TeamData) => {
    setTeams(prev => {
      const newTeams = new Map(prev);
      const existingTeam = newTeams.get(teamKey);
      if (existingTeam) newTeams.set(teamKey, updater(existingTeam));
      return newTeams;
    });
  };
}

function createNewTeamDataForEdit(newTeamId: number, newLeagueId: number, existingTeam: TeamData | undefined): TeamData {
  const newTeamData = createInitialTeamData(newTeamId, newLeagueId);
  if (existingTeam) newTeamData.timeAdded = existingTeam.timeAdded;
  return newTeamData;
}

function persistTeamEditImmediately(
  currentKey: string,
  newKey: string,
  newTeamData: TeamData,
  state: { teams: Map<string, TeamData> },
  configContext: { setTeams: (teams: Map<string, TeamData>) => void }
): void {
  try {
    const currentTeams = new Map(state.teams);
    currentTeams.delete(currentKey);
    currentTeams.set(newKey, newTeamData);
    configContext.setTeams(currentTeams);
  } catch (error) {
    console.warn('Failed to persist team edit immediately:', error);
  }
}

function updateStateWithTeamEdit(
  currentKey: string,
  newKey: string,
  newTeamData: TeamData,
  state: { setTeams: React.Dispatch<React.SetStateAction<Map<string, TeamData>>> }
): void {
  state.setTeams(prev => {
    const newTeams = new Map(prev);
    newTeams.delete(currentKey);
    newTeams.set(newKey, newTeamData);
    return newTeams;
  });
}

function persistUpdatedTeamData(
  newKey: string,
  updatedTeamData: TeamData,
  state: { teams: Map<string, TeamData> },
  configContext: { setTeams: (teams: Map<string, TeamData>) => void }
): void {
  try {
    const currentTeams = new Map(state.teams);
    currentTeams.set(newKey, updatedTeamData);
    configContext.setTeams(currentTeams);
  } catch (error) {
    console.warn('Failed to update team persistence after edit:', error);
  }
}

export async function editTeamData(
  currentTeamId: number,
  currentLeagueId: number,
  newTeamId: number,
  newLeagueId: number,
  existingTeam: TeamData | undefined,
  fetchTeamAndLeagueData: (teamData: TeamData, force: boolean) => Promise<TeamData>,
  state: { teams: Map<string, TeamData>; setTeams: React.Dispatch<React.SetStateAction<Map<string, TeamData>>> },
  configContext: { setTeams: (teams: Map<string, TeamData>) => void }
): Promise<void> {
  const currentKey = generateTeamKey(currentTeamId, currentLeagueId);
  const newKey = generateTeamKey(newTeamId, newLeagueId);
  const newTeamData = createNewTeamDataForEdit(newTeamId, newLeagueId, existingTeam);
  persistTeamEditImmediately(currentKey, newKey, newTeamData, state, configContext);
  updateStateWithTeamEdit(currentKey, newKey, newTeamData, state);
  const teamDataToFetch = existingTeam || newTeamData;
  const updatedTeamData = await fetchTeamAndLeagueData(teamDataToFetch, false);
  state.setTeams(prev => {
    const newTeams = new Map(prev);
    newTeams.set(newKey, updatedTeamData);
    return newTeams;
  });
  persistUpdatedTeamData(newKey, updatedTeamData, state, configContext);
}

export function cleanupUnusedData(
  teamToRemove: TeamData,
  remainingTeams: TeamData[],
  matchContext: { removeMatch: (matchId: number) => void },
  playerContext: { removePlayer: (playerId: number) => void }
) {
  const matchIdsToCheck = Object.keys(teamToRemove.matches).map(Number);
  const playerIdsToCheck = teamToRemove.players.map(player => player.accountId);
  const usedMatchIds = new Set<number>();
  const usedPlayerIds = new Set<number>();
  remainingTeams.forEach(team => {
    Object.keys(team.matches).forEach(matchId => usedMatchIds.add(Number(matchId)));
    team.players.forEach(player => usedPlayerIds.add(player.accountId));
  });
  matchIdsToCheck.forEach(matchId => { if (!usedMatchIds.has(matchId)) matchContext.removeMatch(matchId); });
  playerIdsToCheck.forEach(playerId => { if (!usedPlayerIds.has(playerId)) playerContext.removePlayer(playerId); });
}

export async function processTeamDataWithState(
  teamId: number,
  leagueId: number,
  processedTeam: TeamData,
  originalTeamData: { matches: Array<{ matchId: number; result: string }> },
  state: { setTeams: React.Dispatch<React.SetStateAction<Map<string, TeamData>>>; setIsLoading: (loading: boolean) => void },
  updateTeam: (teamKey: string, updater: (team: TeamData) => TeamData) => void,
  processMatchAndExtractPlayers: (matchId: number, teamId: number, matchContext: MatchContextValue, playerContext: PlayerContextValue) => Promise<TeamMatchParticipation | null>,
  matchContext: MatchContextValue,
  playerContext: PlayerContextValue
): Promise<Map<string, TeamData>> {
  const teamKey = generateTeamKey(teamId, leagueId);
  let updatedTeams: Map<string, TeamData> = new Map();
  state.setTeams(prev => { const next = new Map(prev); next.set(teamKey, processedTeam); updatedTeams = next; return next; });
  const matchesWithCorrectSides: Record<number, TeamMatchParticipation> = {};
  if (originalTeamData.matches?.length > 0) {
    for (const m of originalTeamData.matches) {
      const mp = await processMatchAndExtractPlayers(m.matchId, teamId, matchContext, playerContext);
      if (mp) matchesWithCorrectSides[m.matchId] = mp;
    }
  }
  updateTeam(teamKey, (team) => updateTeamPerformance(team, matchesWithCorrectSides, originalTeamData));
  state.setIsLoading(false);
  return updatedTeams;
}


