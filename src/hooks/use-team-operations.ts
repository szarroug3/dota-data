import { useCallback } from 'react';

import type { TeamDataFetchingContextValue } from '@/frontend/teams/contexts/fetching/team-data-fetching-context';
import { useTeamCoreOperations } from '@/hooks/use-team-core-operations';
import { useTeamSpecificOperations } from '@/hooks/use-team-specific-operations';
import type { ConfigContextValue } from '@/types/contexts/config-context-value';
import type { MatchContextValue } from '@/types/contexts/match-context-value';
import type { PlayerContextValue } from '@/types/contexts/player-context-value';
import type { TeamData, TeamState } from '@/types/contexts/team-context-value';
import { generateTeamKey } from '@/utils/team-helpers';

function useTeamSelectionOperations(
  setSelectedTeamId: (team: { teamId: number; leagueId: number } | null) => void,
  configContext: ConfigContextValue,
) {
  const setSelectedTeam = useCallback(
    (teamId: number, leagueId: number) => {
      setSelectedTeamId({ teamId, leagueId });
      configContext.setActiveTeam({ teamId, leagueId });
    },
    [setSelectedTeamId, configContext],
  );

  const clearSelectedTeam = useCallback(() => {
    setSelectedTeamId(null);
    configContext.setActiveTeam(null);
  }, [setSelectedTeamId, configContext]);

  return { setSelectedTeam, clearSelectedTeam };
}

function useTeamDataAccessOperations(
  teams: Map<string, TeamData>,
  selectedTeamId: { teamId: number; leagueId: number } | null,
) {
  const getTeam = useCallback(
    (teamId: number, leagueId: number) => {
      const key = generateTeamKey(teamId, leagueId);
      return teams.get(key);
    },
    [teams],
  );

  const getSelectedTeam = useCallback(() => {
    if (!selectedTeamId) return undefined;
    return getTeam(selectedTeamId.teamId, selectedTeamId.leagueId);
  }, [selectedTeamId, getTeam]);

  const getAllTeams = useCallback(() => {
    return Array.from(teams.values()).sort((a, b) => new Date(b.timeAdded).getTime() - new Date(a.timeAdded).getTime());
  }, [teams]);

  return { getTeam, getSelectedTeam, getAllTeams };
}

export function useTeamOperations(
  state: TeamState,
  teamDataFetching: TeamDataFetchingContextValue,
  matchContext: MatchContextValue,
  playerContext: PlayerContextValue,
  configContext: ConfigContextValue,
) {
  const { teams, setTeams, setTeamsForLoading, selectedTeamId, setSelectedTeamId } = state;
  const { setSelectedTeam, clearSelectedTeam } = useTeamSelectionOperations(setSelectedTeamId, configContext);
  const { getTeam, getSelectedTeam, getAllTeams } = useTeamDataAccessOperations(teams, selectedTeamId);
  const { addMatchToTeam, addPlayerToTeam, removeManualPlayer, editManualPlayer } = useTeamSpecificOperations(
    selectedTeamId,
    teams,
    setTeams,
    matchContext,
    playerContext,
  );
  const core = useTeamCoreOperations(
    { teams, setTeams, setTeamsForLoading, selectedTeamId },
    teamDataFetching,
    matchContext,
    playerContext,
    configContext,
  );

  return {
    addTeam: core.addTeam,
    refreshTeam: core.refreshTeam,
    removeTeam: core.removeTeam,
    editTeam: core.editTeam,
    addMatchToTeam,
    addPlayerToTeam,
    removeManualPlayer,
    editManualPlayer,
    removeManualMatch: core.removeManualMatch,
    editManualMatch: core.editManualMatch,
    setTeams,
    loadTeamsFromConfig: core.loadTeamsFromConfig,
    loadManualMatches: core.loadManualMatches,
    loadManualPlayers: core.loadManualPlayers,
    setSelectedTeamId: setSelectedTeam,
    clearSelectedTeamId: clearSelectedTeam,
    getTeam,
    getSelectedTeam,
    getAllTeams,
  };
}
