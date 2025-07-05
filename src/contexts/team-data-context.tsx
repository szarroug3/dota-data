import { Team } from '@/types/team';
import React, { createContext, useCallback, useContext, useState } from 'react';

interface TeamDataContextType {
  // Cached team data by team ID
  teamDataByTeam: Record<string, Team>;
  // Loading states by team ID
  loadingByTeam: Record<string, boolean>;
  // Error states by team ID
  errorByTeam: Record<string, string | null>;
  // Trigger fetching for a specific team
  fetchTeamData: (teamId: string) => void;
  // Get team data for a team (from cache or trigger fetch)
  getTeamData: (teamId: string) => Team | null;
  // Check if team data is loading
  isTeamLoading: (teamId: string) => boolean;
  // Get error for a team
  getTeamError: (teamId: string) => string | null;
  // Update team data in cache
  updateTeamData: (teamId: string, teamData: Team) => void;
  // Remove team data from cache
  removeTeamData: (teamId: string) => void;
}

const TeamDataContext = createContext<TeamDataContextType | null>(null);

// Helper function to fetch team data
async function _fetchTeamData(teamId: string): Promise<Team> {
  const response = await fetch(`/api/teams/${teamId}`);
  if (response.status === 200) {
    return await response.json();
  }
  throw new Error(`HTTP ${response.status} for team ${teamId}`);
}

export function useTeamData() {
  const context = useContext(TeamDataContext);
  if (!context) {
    throw new Error('useTeamData must be used within a TeamDataProvider');
  }
  return context;
}

export function TeamDataProvider({ children }: { children: React.ReactNode }) {
  const [teamDataByTeam, setTeamDataByTeam] = useState<Record<string, Team>>({});
  const [loadingByTeam, setLoadingByTeam] = useState<Record<string, boolean>>({});
  const [errorByTeam, setErrorByTeam] = useState<Record<string, string | null>>({});

  const fetchTeamData = useCallback(async (teamId: string) => {
    // Don't fetch if already loading
    if (loadingByTeam[teamId]) {
      return;
    }

    // Set loading state
    setLoadingByTeam(prev => ({ ...prev, [teamId]: true }));
    setErrorByTeam(prev => ({ ...prev, [teamId]: null }));

    try {
      const teamData = await _fetchTeamData(teamId);
      
      setTeamDataByTeam(prev => ({ ...prev, [teamId]: teamData }));
      setLoadingByTeam(prev => ({ ...prev, [teamId]: false }));
    } catch (err) {
      console.error(`[TeamDataContext] Error fetching team data for team ${teamId}:`, err);
      setErrorByTeam(prev => ({ 
        ...prev, 
        [teamId]: err instanceof Error ? err.message : 'Failed to fetch team data' 
      }));
      setLoadingByTeam(prev => ({ ...prev, [teamId]: false }));
    }
  }, [loadingByTeam]);

  const getTeamData = useCallback((teamId: string): Team | null => {
    // Return cached data if available
    if (teamDataByTeam[teamId]) {
      return teamDataByTeam[teamId];
    }

    // Trigger fetch if not already loading
    if (!loadingByTeam[teamId]) {
      // Use setTimeout to avoid blocking the render
      setTimeout(() => fetchTeamData(teamId), 0);
    }

    return null;
  }, [teamDataByTeam, loadingByTeam, fetchTeamData]);

  const isTeamLoading = useCallback((teamId: string): boolean => {
    return loadingByTeam[teamId] || false;
  }, [loadingByTeam]);

  const getTeamError = useCallback((teamId: string): string | null => {
    return errorByTeam[teamId] || null;
  }, [errorByTeam]);

  const updateTeamData = useCallback((teamId: string, teamData: Team) => {
    setTeamDataByTeam(prev => ({ ...prev, [teamId]: teamData }));
  }, []);

  const removeTeamData = useCallback((teamId: string) => {
    setTeamDataByTeam(prev => {
      const newData = { ...prev };
      delete newData[teamId];
      return newData;
    });
    setLoadingByTeam(prev => {
      const newLoading = { ...prev };
      delete newLoading[teamId];
      return newLoading;
    });
    setErrorByTeam(prev => {
      const newError = { ...prev };
      delete newError[teamId];
      return newError;
    });
  }, []);

  const value: TeamDataContextType = {
    teamDataByTeam,
    loadingByTeam,
    errorByTeam,
    fetchTeamData,
    getTeamData,
    isTeamLoading,
    getTeamError,
    updateTeamData,
    removeTeamData,
  };

  return (
    <TeamDataContext.Provider value={value}>
      {children}
    </TeamDataContext.Provider>
  );
} 