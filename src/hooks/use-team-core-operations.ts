import { useCallback } from 'react';

import type { TeamDataFetchingContextValue } from '@/frontend/teams/contexts/fetching/team-data-fetching-context';
import { coerceManualPlayersToArray, mergePlayersUniqueByAccountId } from '@/hooks/team-operations-helpers';
import { createTeamLeagueOperationKey, useAbortController } from '@/hooks/use-abort-controller';
import { processMatchAndExtractPlayers } from '@/lib/processing/team-processing';
import type { ConfigContextValue } from '@/types/contexts/config-context-value';
import type { MatchContextValue } from '@/types/contexts/match-context-value';
import type { PlayerContextValue } from '@/types/contexts/player-context-value';
import type { TeamData, TeamMatchParticipation } from '@/types/contexts/team-context-value';
import type { DotabuffLeague, DotabuffTeam } from '@/types/external-apis';
import { updateMapItemError } from '@/utils/error-handling';
import { clearMapItemLoading, setMapItemLoading } from '@/utils/loading-state';
import { generateTeamKey } from '@/utils/team-helpers';

// Type guards and helpers for error handling without using unknown/any
type ErrorResult = { error: string };
type TeamResult = DotabuffTeam | ErrorResult | null | undefined;
type LeagueResult = DotabuffLeague | ErrorResult | null | undefined;

function isErrorResult(value: TeamResult | LeagueResult): value is ErrorResult {
  return Boolean(value) && typeof value === 'object' && value !== null && 'error' in (value as Record<string, string>);
}

function getErrorMessage(input: TeamResult | LeagueResult, defaultMsg: string): string | null {
  if (input == null) return defaultMsg;
  if (isErrorResult(input)) return input.error || defaultMsg;
  return null;
}

function createErrorTeamData(teamId: number, leagueId: number, error: string): TeamData {
  return {
    team: { id: teamId, name: `Team ${teamId}` },
    league: { id: leagueId, name: `League ${leagueId}` },
    timeAdded: new Date().toISOString(),
    error,
    matches: {},
    manualMatches: {},
    manualPlayers: [],
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
    }
  };
}

function transformTeamData(teamId: number, leagueId: number, dotabuffTeam: DotabuffTeam, dotabuffLeague?: { name: string }): TeamData {
  const matchesArray = Object.values(dotabuffTeam.matches);
  return {
    team: { id: teamId, name: dotabuffTeam.name },
    league: { id: leagueId, name: dotabuffLeague?.name || `League ${leagueId}` },
    timeAdded: new Date().toISOString(),
    matches: (() => {
      const matches: Record<number, TeamMatchParticipation> = {};
      Object.entries(dotabuffTeam.matches).forEach(([matchId, match]) => {
        matches[Number(matchId)] = { ...match, side: null, pickOrder: null };
      });
      return matches;
    })(),
    manualMatches: {},
    manualPlayers: [],
    players: [],
    performance: {
      totalMatches: matchesArray.length,
      totalWins: matchesArray.filter((m) => m.result === 'won').length,
      totalLosses: matchesArray.filter((m) => m.result === 'lost').length,
      overallWinRate: matchesArray.length > 0 ? matchesArray.filter((m) => m.result === 'won').length / matchesArray.length : 0,
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
      averageMatchDuration: matchesArray.reduce((sum: number, m) => sum + m.duration, 0) / matchesArray.length || 0,
      averageKills: 0,
      averageDeaths: 0,
      averageGold: 0,
      averageExperience: 0
    }
  };
}

function handleTeamDataErrors(
  teamId: number,
  leagueId: number,
  teamData: TeamResult,
  leagueData: LeagueResult,
  teamKey: string,
  setTeams: React.Dispatch<React.SetStateAction<Map<string, TeamData>>>
): boolean {
  const teamError = getErrorMessage(teamData, 'Failed to fetch team');
  const leagueError = getErrorMessage(leagueData, 'Failed to fetch league');

  if (teamError && leagueError) {
    const errorTeam = createErrorTeamData(teamId, leagueId, 'Failed to fetch team and league');
    setTeams(prev => { const m = new Map(prev); m.set(teamKey, errorTeam); return m; });
    return true;
  } else if (teamError) {
    const errorTeam = createErrorTeamData(teamId, leagueId, 'Failed to fetch team');
    errorTeam.league.name = isErrorResult(leagueData) ? `League ${leagueId}` : (leagueData as DotabuffLeague).name;
    setTeams(prev => { const m = new Map(prev); m.set(teamKey, errorTeam); return m; });
    return true;
  } else if (leagueError) {
    const transformedTeam = transformTeamData(teamId, leagueId, teamData as DotabuffTeam, undefined);
    transformedTeam.error = 'Failed to fetch league';
    setTeams(prev => { const m = new Map(prev); m.set(teamKey, transformedTeam); return m; });
    return true;
  }
  return false;
}

async function handleTeamSummaryOperation(
  teamId: number,
  leagueId: number,
  force: boolean,
  operationKey: string,
  abortController: ReturnType<typeof useAbortController>,
  teamDataFetching: TeamDataFetchingContextValue,
  setTeams: React.Dispatch<React.SetStateAction<Map<string, TeamData>>>
): Promise<TeamData | null> {
  const teamKey = generateTeamKey(teamId, leagueId);
  if (abortController.hasOngoingOperation(operationKey)) return null;
  const controller = abortController.getAbortController(operationKey);
  try {
    const [teamData, leagueData] = await Promise.all([
      teamDataFetching.fetchTeamData(teamId, force),
      teamDataFetching.fetchLeagueData(leagueId, force)
    ]);
    if (controller.signal.aborted) return null;
    if (handleTeamDataErrors(teamId, leagueId, teamData, leagueData, teamKey, setTeams)) return null;
    const transformedTeam = transformTeamData(teamId, leagueId, teamData as DotabuffTeam, leagueData as DotabuffLeague);
    setTeams(prev => {
      const newTeams = new Map(prev);
      const existingTeam = newTeams.get(teamKey);
      if (existingTeam?.manualMatches) {
        transformedTeam.manualMatches = { ...existingTeam.manualMatches };
        Object.entries(existingTeam.manualMatches).forEach(([matchId, matchData]) => {
          const matches = transformedTeam.matches as Record<string, TeamMatchParticipation>;
          if (!matches[matchId]) {
            matches[matchId] = {
              matchId: parseInt(matchId),
              result: 'lost',
              duration: 0,
              opponentName: 'Unknown',
              leagueId: transformedTeam.league.id.toString(),
              startTime: Date.now(),
              side: matchData.side,
              pickOrder: null
            };
          }
        });
      }
      if (existingTeam?.manualPlayers) {
        const manualArray = coerceManualPlayersToArray(existingTeam.manualPlayers as number[] | Record<string, number | string> | undefined);
        transformedTeam.manualPlayers = [...manualArray];
        if (existingTeam.players?.length) {
          const manualPlayerIds = new Set(manualArray);
          const manualPlayers = existingTeam.players.filter(p => manualPlayerIds.has(p.accountId));
          transformedTeam.players = mergePlayersUniqueByAccountId(transformedTeam.players, manualPlayers);
        }
      }
      newTeams.set(teamKey, transformedTeam);
      return newTeams;
    });
    return transformedTeam;
  } finally {
    abortController.cleanupAbortController(operationKey);
  }
}

function useAddTeamCore(
  teams: Map<string, TeamData>,
  setTeams: React.Dispatch<React.SetStateAction<Map<string, TeamData>>>,
  setTeamsForLoading: React.Dispatch<React.SetStateAction<Map<string, TeamData>>>,
  teamDataFetching: TeamDataFetchingContextValue,
  matchContext: MatchContextValue,
  playerContext: PlayerContextValue
) {
  const abortController = useAbortController();

  return useCallback(async (teamId: number, leagueId: number, force = false): Promise<void> => {
    const operationKey = createTeamLeagueOperationKey(teamId, leagueId);
    const teamKey = generateTeamKey(teamId, leagueId);
    if (!force && teams.has(teamKey)) return;
    setMapItemLoading(setTeamsForLoading, teamKey);
    try {
      const transformedTeam = await handleTeamSummaryOperation(teamId, leagueId, false, operationKey, abortController, teamDataFetching, setTeams);
      if (transformedTeam && !transformedTeam.error) {
        const matchProcessingPromises = Object.values(transformedTeam.matches).map(match => {
          const existing = teams.get(teamKey);
          const isManualMatch = existing?.manualMatches?.[match.matchId];
          const knownSide = isManualMatch?.side as ('radiant' | 'dire' | undefined);
          return processMatchAndExtractPlayers(match.matchId, teamId, matchContext, playerContext, knownSide);
        });
        const processedMatches = await Promise.all(matchProcessingPromises);
        setTeams(prev => {
          const newTeams = new Map(prev);
          const team = newTeams.get(teamKey);
          if (team) {
            const updatedMatches: Record<number, TeamMatchParticipation> = { ...team.matches };
            processedMatches.forEach((processedMatch, index) => {
              if (processedMatch) {
                const originalMatch = Object.values(transformedTeam.matches)[index];
                updatedMatches[originalMatch.matchId] = processedMatch;
              }
            });
            newTeams.set(teamKey, { ...team, matches: updatedMatches });
          }
          return newTeams;
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add team';
      updateMapItemError(setTeams, teamKey, errorMessage);
    } finally {
      clearMapItemLoading(setTeamsForLoading, teamKey);
    }
  }, [teams, setTeams, setTeamsForLoading, teamDataFetching, matchContext, playerContext, abortController]);
}

function useRefreshTeamCore(
  setTeams: React.Dispatch<React.SetStateAction<Map<string, TeamData>>>,
  teamDataFetching: TeamDataFetchingContextValue
) {
  const abortController = useAbortController();
  return useCallback(async (teamId: number, leagueId: number): Promise<void> => {
    const operationKey = createTeamLeagueOperationKey(teamId, leagueId);
    await handleTeamSummaryOperation(teamId, leagueId, true, operationKey, abortController, teamDataFetching, setTeams);
  }, [teamDataFetching, setTeams, abortController]);
}

function useRemoveTeamCore(
  selectedTeamId: { teamId: number; leagueId: number } | null,
  setTeams: React.Dispatch<React.SetStateAction<Map<string, TeamData>>>,
  configContext: ConfigContextValue
) {
  const abortController = useAbortController();
  return useCallback((teamId: number, leagueId: number) => {
    const teamKey = generateTeamKey(teamId, leagueId);
    abortController.cleanupAbortController(createTeamLeagueOperationKey(teamId, leagueId));
    setTeams(prev => { const m = new Map(prev); m.delete(teamKey); return m; });
    if (selectedTeamId?.teamId === teamId && selectedTeamId?.leagueId === leagueId) {
      configContext.setActiveTeam(null);
    }
  }, [selectedTeamId, setTeams, configContext, abortController]);
}

function useEditTeamCore(
  removeTeam: (teamId: number, leagueId: number) => void,
  addTeam: (teamId: number, leagueId: number) => Promise<void>
) {
  return useCallback(async (currentTeamId: number, currentLeagueId: number, newTeamId: number, newLeagueId: number): Promise<void> => {
    if (currentTeamId === newTeamId && currentLeagueId === newLeagueId) return;
    removeTeam(currentTeamId, currentLeagueId);
    await addTeam(newTeamId, newLeagueId);
  }, [removeTeam, addTeam]);
}

function useManualMatchesOps(
  teams: Map<string, TeamData>,
  setTeams: React.Dispatch<React.SetStateAction<Map<string, TeamData>>>,
  matchContext: MatchContextValue,
  selectedTeamId: { teamId: number; leagueId: number } | null
) {
  const loadManualMatches = useCallback(async () => {
    const manualMatches = new Set<number>();
    teams.forEach((teamData, teamKey) => {
      if (teamData.manualMatches) {
        Object.entries(teamData.manualMatches).forEach(([matchId, manualMatch]) => {
          const matchIdNum = parseInt(matchId, 10);
          manualMatches.add(matchIdNum);
          if (!teamData.matches[matchIdNum]) {
            const optimisticMatch: TeamMatchParticipation = {
              matchId: matchIdNum,
              result: 'lost',
              duration: 0,
              opponentName: 'Loading...',
              leagueId: teamData.league.id.toString(),
              startTime: Date.now(),
              side: manualMatch.side,
              pickOrder: null
            };
            setTeams(prev => {
              const newTeams = new Map(prev);
              const team = newTeams.get(teamKey);
              if (team) {
                const nextMatches: Record<number, TeamMatchParticipation> = { ...team.matches };
                nextMatches[matchIdNum] = optimisticMatch;
                newTeams.set(teamKey, { ...team, matches: nextMatches });
              }
              return newTeams;
            });
          }
        });
      }
    });
    for (const matchId of manualMatches) {
      await matchContext.addMatch(matchId);
    }
  }, [teams, setTeams, matchContext]);

  const removeManualMatch = useCallback((matchId: number) => {
    if (!selectedTeamId) return;
    const teamKey = generateTeamKey(selectedTeamId.teamId, selectedTeamId.leagueId);
    setTeams(prev => {
      const newTeams = new Map(prev);
      const team = newTeams.get(teamKey);
      if (team) {
        const nextManual = { ...(team.manualMatches || {}) };
        delete nextManual[matchId];
        const nextMatches = { ...(team.matches || {}) } as Record<number, TeamMatchParticipation>;
        delete nextMatches[matchId];
        newTeams.set(teamKey, { ...team, manualMatches: nextManual, matches: nextMatches });
      }
      return newTeams;
    });
  }, [selectedTeamId, setTeams]);

  const editManualMatch = useCallback(async (oldMatchId: number, newMatchId: number, teamSide: 'radiant' | 'dire') => {
    if (!selectedTeamId) return;
    const teamKey = generateTeamKey(selectedTeamId.teamId, selectedTeamId.leagueId);
    const team = teams.get(teamKey);
    if (!team) return;
    if (oldMatchId !== newMatchId) {
      if (team.manualMatches && newMatchId in team.manualMatches) {
        throw new Error(`Match ${newMatchId} is already added as a manual match`);
      }
      if (team.matches && newMatchId in team.matches) {
        throw new Error(`Match ${newMatchId} is already in the team's match history`);
      }
    }
    setTeams(prev => {
      const newTeams = new Map(prev);
      const cur = newTeams.get(teamKey);
      if (cur) {
        const nextManual = { ...(cur.manualMatches || {}) };
        delete nextManual[oldMatchId];
        nextManual[newMatchId] = { side: teamSide };
        const nextMatches: Record<number, TeamMatchParticipation> = { ...(cur.matches || {}) };
        delete nextMatches[oldMatchId];
        nextMatches[newMatchId] = {
          matchId: newMatchId,
          result: 'lost',
          duration: 0,
          opponentName: 'Loading...',
          leagueId: cur.league.id.toString(),
          startTime: Date.now(),
          side: teamSide,
          pickOrder: null
        };
        newTeams.set(teamKey, { ...cur, manualMatches: nextManual, matches: nextMatches });
      }
      return newTeams;
    });
    if (oldMatchId !== newMatchId) {
      matchContext.removeMatch(oldMatchId);
    }
  }, [selectedTeamId, teams, setTeams, matchContext]);

  return { loadManualMatches, removeManualMatch, editManualMatch };
}

function useManualPlayersOps(
  teams: Map<string, TeamData>,
  playerContext: PlayerContextValue
) {
  const loadManualPlayers = useCallback(async () => {
    const manualPlayerIds = new Set<number>();
    teams.forEach((teamData) => {
      if (Array.isArray(teamData.manualPlayers)) {
        teamData.manualPlayers.forEach(id => manualPlayerIds.add(id));
      } else if (teamData.manualPlayers && typeof teamData.manualPlayers === 'object') {
        Object.keys(teamData.manualPlayers).forEach(id => manualPlayerIds.add(Number(id)));
      }
    });
    for (const playerId of manualPlayerIds) {
      await playerContext.addPlayer(playerId);
    }
  }, [teams, playerContext]);

  return { loadManualPlayers };
}

function useManualTeamsOps(
  setTeams: React.Dispatch<React.SetStateAction<Map<string, TeamData>>>
) {
  const loadTeamsFromConfig = useCallback(async (teamsArg: Map<string, TeamData>) => {
    setTeams(teamsArg);
  }, [setTeams]);
  return { loadTeamsFromConfig };
}

export function useTeamCoreOperations(
  state: {
    teams: Map<string, TeamData>;
    setTeams: React.Dispatch<React.SetStateAction<Map<string, TeamData>>>;
    setTeamsForLoading: React.Dispatch<React.SetStateAction<Map<string, TeamData>>>;
    selectedTeamId: { teamId: number; leagueId: number } | null;
  },
  teamDataFetching: TeamDataFetchingContextValue,
  matchContext: MatchContextValue,
  playerContext: PlayerContextValue,
  configContext: ConfigContextValue
) {
  const { teams, setTeams, setTeamsForLoading, selectedTeamId } = state;
  const addTeam = useAddTeamCore(teams, setTeams, setTeamsForLoading, teamDataFetching, matchContext, playerContext);
  const refreshTeam = useRefreshTeamCore(setTeams, teamDataFetching);
  const removeTeam = useRemoveTeamCore(selectedTeamId, setTeams, configContext);
  const editTeam = useEditTeamCore(removeTeam, addTeam);
  const manualMatchesOps = useManualMatchesOps(teams, setTeams, matchContext, selectedTeamId);
  const manualPlayersOps = useManualPlayersOps(teams, playerContext);
  const manualTeamsOps = useManualTeamsOps(setTeams);

  return {
    addTeam,
    refreshTeam,
    removeTeam,
    editTeam,
    loadTeamsFromConfig: manualTeamsOps.loadTeamsFromConfig,
    loadManualMatches: manualMatchesOps.loadManualMatches,
    loadManualPlayers: manualPlayersOps.loadManualPlayers,
    removeManualMatch: manualMatchesOps.removeManualMatch,
    editManualMatch: manualMatchesOps.editManualMatch
  };
}


