// ============================================================================
// useTeamData: UI-Focused Team Data Hook
//
// Provides a high-level, UI-friendly interface for team data, actions, and state.
// Aggregates context, loading, error, and convenience actions for components.
// ============================================================================

import { useCallback } from 'react';

import { useTeamContext } from '@/contexts/team-context';
import type { TeamContextValue, TeamData } from '@/types/contexts/team-context-value';
import type { UseTeamDataReturn } from '@/types/hooks/use-team-data';

// ============================================================================
// Internal: Active Team Data Selector
// ============================================================================
function useActiveTeamData(teamDataList: TeamData[], activeTeam: { teamId: string; leagueId: string } | null) {
  const activeTeamId = activeTeam?.teamId || null;
  const activeTeamData = activeTeam
    ? teamDataList.find((td: TeamData) => td.team.id === activeTeam.teamId && td.team.leagueId === activeTeam.leagueId)
    : null;
  const teamData = activeTeamData || null;
  return { activeTeamId, activeTeamData, teamData };
}

// ============================================================================
// Internal: Team Loading & Error States
// ============================================================================
function useTeamStates(context: TeamContextValue, activeTeamData: TeamData | null) {
  return {
    isLoadingTeams: false, // Placeholder for future multi-team loading
    isLoadingTeamData: activeTeamData?.team.isLoading || false,
    isLoadingTeamStats: false, // Placeholder for future stats loading
    teamsError: context.error,
    teamDataError: activeTeamData?.team.error || null,
    teamStatsError: null // Placeholder for future stats error
  };
}

// ============================================================================
// Internal: Team Actions (ID-based)
// ============================================================================
function useTeamActions(
  teamDataList: TeamData[],
  setActiveTeam: (teamId: string, leagueId: string) => void,
  addTeam: (teamId: string, leagueId: string) => Promise<void>,
  removeTeam: (teamId: string, leagueId: string) => Promise<void> | void,
  refreshTeam: (teamId: string, leagueId: string) => Promise<void>,
  clearError: () => void
) {
  const setActiveTeamById = useCallback((teamId: string) => {
    const team = teamDataList.find((td: TeamData) => td.team.id === teamId);
    if (team) {
      setActiveTeam(teamId, team.team.leagueId);
    }
  }, [teamDataList, setActiveTeam]);

  const addTeamById = useCallback(async (teamId: string, leagueId: string) => {
    await addTeam(teamId, leagueId);
  }, [addTeam]);

  const removeTeamById = useCallback(async (teamId: string) => {
    const team = teamDataList.find((td: TeamData) => td.team.id === teamId);
    if (team) {
      await removeTeam(teamId, team.team.leagueId);
    }
  }, [teamDataList, removeTeam]);

  const refreshTeamById = useCallback(async (teamId: string) => {
    const team = teamDataList.find((td: TeamData) => td.team.id === teamId);
    if (team) {
      await refreshTeam(teamId, team.team.leagueId);
    }
  }, [teamDataList, refreshTeam]);

  const updateTeamById = useCallback(async (teamId: string) => {
    await refreshTeamById(teamId);
  }, [refreshTeamById]);

  const clearErrors = useCallback(() => {
    clearError();
  }, [clearError]);

  return {
    setActiveTeamById,
    addTeamById,
    removeTeamById,
    refreshTeamById,
    updateTeamById,
    clearErrors
  };
}

// ============================================================================
// Exported Hook: useTeamData
// ============================================================================

export function useTeamData(): UseTeamDataReturn {
  const context = useTeamContext();
  const {
    teamDataList,
    activeTeam,
    addTeam,
    removeTeam,
    refreshTeam,
    setActiveTeam,
    clearError
  } = context;

  const teams = teamDataList.map((teamData: TeamData) => teamData.team);
  const { activeTeamId, activeTeamData, teamData } = useActiveTeamData(teamDataList, activeTeam);
  const teamStats = null; // Placeholder for future stats aggregation
  const {
    isLoadingTeams,
    isLoadingTeamData,
    isLoadingTeamStats,
    teamsError,
    teamDataError,
    teamStatsError
  } = useTeamStates(context, activeTeamData ?? null);
  const {
    setActiveTeamById,
    addTeamById,
    removeTeamById,
    refreshTeamById,
    updateTeamById,
    clearErrors
  } = useTeamActions(teamDataList, setActiveTeam, addTeam, removeTeam, refreshTeam, clearError);

  return {
    teams,
    activeTeam: activeTeamData?.team || null,
    activeTeamId,
    teamData,
    teamStats,
    isLoadingTeams,
    isLoadingTeamData,
    isLoadingTeamStats,
    teamsError,
    teamDataError,
    teamStatsError,
    setActiveTeam: setActiveTeamById,
    addTeam: addTeamById,
    removeTeam: removeTeamById,
    refreshTeam: refreshTeamById,
    updateTeam: updateTeamById,
    clearErrors
  };
} 