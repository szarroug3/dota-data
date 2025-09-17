import { useCallback } from 'react';

import type { TeamDataFetchingContextValue } from '@/frontend/teams/contexts/fetching/team-data-fetching-context';
import { coerceManualPlayersToArray, mergePlayersUniqueByAccountId } from '@/hooks/team-operations-helpers';
import { createTeamLeagueOperationKey, useAbortController } from '@/hooks/use-abort-controller';
import { processMatchAndExtractPlayers } from '@/lib/processing/team-processing';
import type { ConfigContextValue } from '@/types/contexts/config-context-value';
import type { MatchContextValue } from '@/types/contexts/match-context-value';
import type { PlayerContextValue } from '@/types/contexts/player-context-value';
import type { TeamData, TeamMatchParticipation } from '@/types/contexts/team-context-value';
import type { SteamLeague } from '@/types/external-apis/steam';
import { updateMapItemError } from '@/utils/error-handling';
import { clearMapItemLoading, setMapItemLoading } from '@/utils/loading-state';
import { generateTeamKey } from '@/utils/team-helpers';

import {
  createAddAllManualMatches,
  createCollectManualMatches,
  createEditManualMatch,
  createEnsureOptimisticMatches,
  createRemoveManualMatch,
} from './use-team-manual-ops';

// Type guards and helpers for error handling without using unknown/any
type ErrorResult = { error: string };

interface TeamSourceMatchSlim {
  result?: 'won' | 'lost';
  duration?: number;
  opponentName?: string;
  leagueId?: string;
  startTime?: number;
}

interface TeamSource {
  id: string | number;
  name: string;
  matches?: Record<number, TeamSourceMatchSlim>;
}

type TeamResult = TeamSource | ErrorResult | null | undefined;
type LeagueResult = SteamLeague | ErrorResult | null | undefined;

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
        mostBannedHero: '',
      },
      currentWinStreak: 0,
      currentLoseStreak: 0,
      averageMatchDuration: 0,
      averageKills: 0,
      averageDeaths: 0,
      averageGold: 0,
      averageExperience: 0,
    },
  };
}

function transformTeamData(
  teamId: number,
  leagueId: number,
  teamSource: TeamSource,
  league?: { name: string },
): TeamData {
  return {
    team: { id: teamId, name: teamSource.name },
    league: { id: leagueId, name: league?.name || `League ${leagueId}` },
    timeAdded: new Date().toISOString(),
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
        mostBannedHero: '',
      },
      currentWinStreak: 0,
      currentLoseStreak: 0,
      averageMatchDuration: 0,
      averageKills: 0,
      averageDeaths: 0,
      averageGold: 0,
      averageExperience: 0,
    },
  };
}

function handleTeamDataErrors(
  teamId: number,
  leagueId: number,
  teamData: TeamResult,
  leagueData: LeagueResult,
  teamKey: string,
  setTeams: React.Dispatch<React.SetStateAction<Map<string, TeamData>>>,
): boolean {
  const teamError = getErrorMessage(teamData, 'Failed to fetch team');
  const leagueError = getErrorMessage(leagueData, 'Failed to fetch league');

  if (teamError && leagueError) {
    const errorTeam = createErrorTeamData(teamId, leagueId, 'Failed to fetch team and league');
    setTeams((prev) => {
      const m = new Map(prev);
      m.set(teamKey, errorTeam);
      return m;
    });
    return true;
  } else if (teamError) {
    const errorTeam = createErrorTeamData(teamId, leagueId, 'Failed to fetch team');
    errorTeam.league.name = isErrorResult(leagueData) ? `League ${leagueId}` : (leagueData as SteamLeague).name;
    setTeams((prev) => {
      const m = new Map(prev);
      m.set(teamKey, errorTeam);
      return m;
    });
    return true;
  } else if (leagueError) {
    const transformedTeam = transformTeamData(teamId, leagueId, teamData as TeamSource, undefined);
    transformedTeam.error = 'Failed to fetch league';
    setTeams((prev) => {
      const m = new Map(prev);
      m.set(teamKey, transformedTeam);
      return m;
    });
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
  setTeams: React.Dispatch<React.SetStateAction<Map<string, TeamData>>>,
): Promise<TeamData | null> {
  const teamKey = generateTeamKey(teamId, leagueId);
  if (abortController.hasOngoingOperation(operationKey)) return null;
  const controller = abortController.getAbortController(operationKey);
  try {
    const [teamData, leagueData] = await Promise.all([
      teamDataFetching.fetchTeamData(teamId, force),
      teamDataFetching.fetchLeagueData(leagueId, force),
    ]);
    if (controller.signal.aborted) return null;
    if (handleTeamDataErrors(teamId, leagueId, teamData, leagueData, teamKey, setTeams)) return null;
    const transformedTeam = transformTeamData(
      teamId,
      leagueId,
      teamData as TeamSource,
      (leagueData as SteamLeague | null | undefined) || undefined,
    );
    setTeams((prev) => {
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
              pickOrder: null,
            };
          }
        });
      }
      if (existingTeam?.manualPlayers) {
        const manualArray = coerceManualPlayersToArray(
          existingTeam.manualPlayers as number[] | Record<string, number | string> | undefined,
        );
        transformedTeam.manualPlayers = [...manualArray];
        if (existingTeam.players?.length) {
          const manualPlayerIds = new Set(manualArray);
          const manualPlayers = existingTeam.players.filter((p) => manualPlayerIds.has(p.accountId));
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
  playerContext: PlayerContextValue,
  configContext: ConfigContextValue,
) {
  const abortController = useAbortController();

  return useCallback(
    async (teamId: number, leagueId: number, force = false): Promise<void> => {
      const operationKey = createTeamLeagueOperationKey(teamId, leagueId);
      const teamKey = generateTeamKey(teamId, leagueId);
      if (!force && teams.has(teamKey)) return;
      setMapItemLoading(setTeamsForLoading, teamKey);
      try {
        const transformedTeam = await handleTeamSummaryOperation(
          teamId,
          leagueId,
          force,
          operationKey,
          abortController,
          teamDataFetching,
          setTeams,
        );
        if (transformedTeam && !transformedTeam.error) {
          // Set newly added team as active immediately upon successful team + league load
          configContext.setActiveTeam({ teamId, leagueId });

          // Derive matches from Steam league cache
          const teamMatches = teamDataFetching.findTeamMatchesInLeague(leagueId, teamId);
          const existing = teams.get(teamKey);
          const matchProcessingPromises = teamMatches.map(({ matchId, side }) => {
            const isManualMatch = existing?.manualMatches?.[matchId];
            const knownSide = (isManualMatch?.side as 'radiant' | 'dire' | undefined) ?? side ?? undefined;
            return processMatchAndExtractPlayers(matchId, teamId, matchContext, playerContext, knownSide);
          });
          const processedMatches = await Promise.all(matchProcessingPromises);
          setTeams((prev) => {
            const newTeams = new Map(prev);
            const team = newTeams.get(teamKey);
            if (team) {
              const updatedMatches: Record<number, TeamMatchParticipation> = { ...team.matches };
              processedMatches.forEach((processedMatch) => {
                if (processedMatch) {
                  updatedMatches[processedMatch.matchId] = processedMatch;
                }
              });
              // Update basic performance counts based on processed matches
              const matchesArray = Object.values(updatedMatches);
              const totalWins = matchesArray.filter((m) => m.result === 'won').length;
              const totalLosses = matchesArray.filter((m) => m.result === 'lost').length;
              const averageMatchDuration =
                matchesArray.reduce((sum: number, m) => sum + (m.duration || 0), 0) / (matchesArray.length || 1);
              newTeams.set(teamKey, {
                ...team,
                matches: updatedMatches,
                performance: {
                  ...team.performance,
                  totalMatches: matchesArray.length,
                  totalWins,
                  totalLosses,
                  overallWinRate: matchesArray.length > 0 ? (totalWins / matchesArray.length) * 100 : 0,
                  averageMatchDuration,
                },
              });
            }
            return newTeams;
          });

          configContext.setActiveTeam({ teamId, leagueId });
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to add team';
        updateMapItemError(setTeams, teamKey, errorMessage);
      } finally {
        clearMapItemLoading(setTeamsForLoading, teamKey);
      }
    },
    [
      teams,
      setTeams,
      setTeamsForLoading,
      teamDataFetching,
      matchContext,
      playerContext,
      configContext,
      abortController,
    ],
  );
}

function useRefreshTeamCore(
  teams: Map<string, TeamData>,
  setTeams: React.Dispatch<React.SetStateAction<Map<string, TeamData>>>,
  teamDataFetching: TeamDataFetchingContextValue,
  matchContext: MatchContextValue,
  playerContext: PlayerContextValue,
) {
  const abortController = useAbortController();
  return useCallback(
    async (teamId: number, leagueId: number): Promise<void> => {
      const operationKey = createTeamLeagueOperationKey(teamId, leagueId);
      const teamKey = generateTeamKey(teamId, leagueId);
      const transformedTeam = await handleTeamSummaryOperation(
        teamId,
        leagueId,
        true,
        operationKey,
        abortController,
        teamDataFetching,
        setTeams,
      );

      // After refresh, perform cascading fetch of matches and players
      if (transformedTeam && !transformedTeam.error) {
        const teamMatches = teamDataFetching.findTeamMatchesInLeague(leagueId, teamId);
        const existing = teams.get(teamKey);
        const matchProcessingPromises = teamMatches.map(({ matchId, side }) => {
          const isManualMatch = existing?.manualMatches?.[matchId];
          const knownSide = (isManualMatch?.side as 'radiant' | 'dire' | undefined) ?? side ?? undefined;
          return processMatchAndExtractPlayers(matchId, teamId, matchContext, playerContext, knownSide);
        });
        const processedMatches = await Promise.all(matchProcessingPromises);
        setTeams((prev) => {
          const newTeams = new Map(prev);
          const team = newTeams.get(teamKey);
          if (team) {
            const updatedMatches: Record<number, TeamMatchParticipation> = { ...team.matches };
            processedMatches.forEach((processedMatch) => {
              if (processedMatch) {
                updatedMatches[processedMatch.matchId] = processedMatch;
              }
            });
            const matchesArray = Object.values(updatedMatches);
            const totalWins = matchesArray.filter((m) => m.result === 'won').length;
            const totalLosses = matchesArray.filter((m) => m.result === 'lost').length;
            const averageMatchDuration =
              matchesArray.reduce((sum: number, m) => sum + (m.duration || 0), 0) / (matchesArray.length || 1);
            newTeams.set(teamKey, {
              ...team,
              matches: updatedMatches,
              performance: {
                ...team.performance,
                totalMatches: matchesArray.length,
                totalWins,
                totalLosses,
                overallWinRate: matchesArray.length > 0 ? (totalWins / matchesArray.length) * 100 : 0,
                averageMatchDuration,
              },
            });
          }
          return newTeams;
        });
      }
    },
    [teams, teamDataFetching, setTeams, matchContext, playerContext, abortController],
  );
}

function useRemoveTeamCore(
  selectedTeamId: { teamId: number; leagueId: number } | null,
  setTeams: React.Dispatch<React.SetStateAction<Map<string, TeamData>>>,
  configContext: ConfigContextValue,
) {
  const abortController = useAbortController();
  return useCallback(
    (teamId: number, leagueId: number) => {
      const teamKey = generateTeamKey(teamId, leagueId);
      abortController.cleanupAbortController(createTeamLeagueOperationKey(teamId, leagueId));
      setTeams((prev) => {
        const m = new Map(prev);
        m.delete(teamKey);
        return m;
      });
      if (selectedTeamId?.teamId === teamId && selectedTeamId?.leagueId === leagueId) {
        configContext.setActiveTeam(null);
      }
    },
    [selectedTeamId, setTeams, configContext, abortController],
  );
}

function useEditTeamCore(
  removeTeam: (teamId: number, leagueId: number) => void,
  addTeam: (teamId: number, leagueId: number) => Promise<void>,
) {
  return useCallback(
    async (currentTeamId: number, currentLeagueId: number, newTeamId: number, newLeagueId: number): Promise<void> => {
      if (currentTeamId === newTeamId && currentLeagueId === newLeagueId) return;
      removeTeam(currentTeamId, currentLeagueId);
      await addTeam(newTeamId, newLeagueId);
    },
    [removeTeam, addTeam],
  );
}

function useManualMatchesOps(
  teams: Map<string, TeamData>,
  setTeams: React.Dispatch<React.SetStateAction<Map<string, TeamData>>>,
  matchContext: MatchContextValue,
  selectedTeamId: { teamId: number; leagueId: number } | null,
) {
  const collectManualMatches = createCollectManualMatches(teams);
  const ensureOptimisticMatches = createEnsureOptimisticMatches(setTeams);
  const addAllManualMatches = createAddAllManualMatches(matchContext);
  const loadManualMatches = useCallback(async () => {
    const entries = collectManualMatches();
    ensureOptimisticMatches(entries);
    await addAllManualMatches(entries);
  }, [collectManualMatches, ensureOptimisticMatches, addAllManualMatches]);
  const removeManualMatch = useCallback(
    (matchId: number) => createRemoveManualMatch(selectedTeamId, setTeams)(matchId),
    [selectedTeamId, setTeams],
  );
  const editManualMatch = useCallback(
    (oldMatchId: number, newMatchId: number, teamSide: 'radiant' | 'dire') =>
      createEditManualMatch(selectedTeamId, teams, setTeams, matchContext)(oldMatchId, newMatchId, teamSide),
    [selectedTeamId, teams, setTeams, matchContext],
  );
  return { loadManualMatches, removeManualMatch, editManualMatch };
}

function useManualPlayersOps(teams: Map<string, TeamData>, playerContext: PlayerContextValue) {
  const loadManualPlayers = useCallback(async () => {
    const manualPlayerIds = new Set<number>();
    teams.forEach((teamData) => {
      if (Array.isArray(teamData.manualPlayers)) {
        teamData.manualPlayers.forEach((id) => manualPlayerIds.add(id));
      } else if (teamData.manualPlayers && typeof teamData.manualPlayers === 'object') {
        Object.keys(teamData.manualPlayers).forEach((id) => manualPlayerIds.add(Number(id)));
      }
    });
    for (const playerId of manualPlayerIds) {
      await playerContext.addPlayer(playerId);
    }
  }, [teams, playerContext]);

  return { loadManualPlayers };
}

function useManualTeamsOps(setTeams: React.Dispatch<React.SetStateAction<Map<string, TeamData>>>) {
  const loadTeamsFromConfig = useCallback(
    async (teamsArg: Map<string, TeamData>) => {
      setTeams(teamsArg);
    },
    [setTeams],
  );
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
  configContext: ConfigContextValue,
) {
  const { teams, setTeams, setTeamsForLoading, selectedTeamId } = state;
  const addTeam = useAddTeamCore(
    teams,
    setTeams,
    setTeamsForLoading,
    teamDataFetching,
    matchContext,
    playerContext,
    configContext,
  );
  const refreshTeam = useRefreshTeamCore(teams, setTeams, teamDataFetching, matchContext, playerContext);
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
    editManualMatch: manualMatchesOps.editManualMatch,
  };
}
