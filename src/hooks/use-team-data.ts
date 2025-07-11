import { useEffect, useRef } from 'react';

import { useTeamContext } from '@/contexts/team-context';
import type { UseTeamDataOptions, UseTeamDataReturn } from '@/types/hooks/use-team-data';

/**
 * Custom hook for accessing and managing team data.
 * Supports auto-refresh and options for stats, matches, and players.
 */
export function useTeamData(options?: UseTeamDataOptions): UseTeamDataReturn {
  const context = useTeamContext();
  const {
    teams,
    activeTeam,
    activeTeamId,
    teamData,
    teamStats,
    isLoadingTeams,
    isLoadingTeamData,
    isLoadingTeamStats,
    teamsError,
    teamDataError,
    teamStatsError,
    setActiveTeam,
    addTeam,
    removeTeam,
    refreshTeam,
    updateTeam,
    clearErrors
  } = context;

  // Auto-refresh logic
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (options?.autoRefresh && activeTeamId && refreshTeam) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        refreshTeam(activeTeamId);
      }, (options.refreshInterval ?? 300) * 1000);
      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }
    return undefined;
  }, [options?.autoRefresh, options?.refreshInterval, activeTeamId, refreshTeam]);

  return {
    teams,
    activeTeam,
    activeTeamId,
    teamData,
    teamStats,
    isLoadingTeams,
    isLoadingTeamData,
    isLoadingTeamStats,
    teamsError,
    teamDataError,
    teamStatsError,
    setActiveTeam,
    addTeam,
    removeTeam,
    refreshTeam,
    updateTeam,
    clearErrors
  };
} 