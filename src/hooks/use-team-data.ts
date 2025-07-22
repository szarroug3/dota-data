// ============================================================================
// useTeamData: UI-Focused Team Data Hook
//
// Provides a high-level, UI-friendly interface for team data, actions, and state.
// Aggregates context, loading, error, and convenience actions for components.
// ============================================================================

import { useTeamContext } from '@/contexts/team-context';
import type { TeamContextValue, TeamData } from '@/types/contexts/team-context-value';
import type { UseTeamDataReturn } from '@/types/hooks/use-team-data';

// ============================================================================
// Internal: Active Team Data Selector
// ============================================================================
function useActiveTeamData(teams: Map<string, TeamData>, activeTeam: { teamId: string; leagueId: string } | null) {
  const activeTeamId = activeTeam?.teamId || null;
  const activeTeamData = activeTeam
    ? teams.get(`${activeTeam.teamId}-${activeTeam.leagueId}`) || null
    : null;
  const teamData = activeTeamData || null;
  return { activeTeamId, activeTeamData, teamData };
}

// ============================================================================
// Internal: Team Loading & Error States
// ============================================================================
function useTeamStates(context: TeamContextValue, activeTeamData: TeamData | null) {
  return {
    isLoading: context.isLoading || activeTeamData?.team.isLoading || false,
    teamsError: context.error,
    teamDataError: activeTeamData?.team.error || null
  };
}

// ============================================================================
// Exported Hook: useTeamData
// ============================================================================

export function useTeamData(): UseTeamDataReturn {
  const context = useTeamContext();
  const {
    teams,
    activeTeam,
    addTeam,
    removeTeam,
    refreshTeam,
    setActiveTeam
  } = context;

  const teamsArray = Array.from(teams.values());
  const { activeTeamId, activeTeamData, teamData } = useActiveTeamData(teams, activeTeam);
  const {
    isLoading,
    teamsError,
    teamDataError
  } = useTeamStates(context, activeTeamData ?? null);

  return {
    teams: teamsArray,
    activeTeam: activeTeamData,
    activeTeamId,
    teamData,
    isLoading,
    teamsError,
    teamDataError,
    setActiveTeam,
    addTeam,
    removeTeam,
    refreshTeam,
  };
} 