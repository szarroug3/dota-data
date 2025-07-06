import { useTeam } from '@/contexts/team-context';
import { useTeamData as useGlobalTeamData } from '@/contexts/team-data-context';
import { Team } from '@/types/team';
import { useCallback, useEffect } from 'react';

export function useTeamData() {
  const { currentTeam } = useTeam();
  const { 
    getTeamData, 
    fetchTeamData, 
    isTeamLoading, 
    getTeamError,
    updateTeamData 
  } = useGlobalTeamData();

  // Get team data for current team
  const teamData = currentTeam ? getTeamData(currentTeam.id) : null;
  const loading = currentTeam ? isTeamLoading(currentTeam.id) : false;
  const error = currentTeam ? getTeamError(currentTeam.id) : null;

  // Trigger fetch when current team changes
  useEffect(() => {
    if (currentTeam && !teamData && !loading && currentTeam.leagueId) {
      fetchTeamData(currentTeam.id, currentTeam.leagueId);
    }
  }, [currentTeam, teamData, loading, fetchTeamData]);

  // Update team data when current team changes
  const updateCurrentTeamData = useCallback((teamData: Team) => {
    if (currentTeam) {
      updateTeamData(currentTeam.id, teamData);
    }
  }, [currentTeam, updateTeamData]);

  return {
    teamData,
    loading,
    error,
    updateTeamData: updateCurrentTeamData,
  };
} 