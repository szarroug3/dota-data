import * as React from 'react';
import { Team } from '../types/team';
import { createContext, useCallback, useContext, useState } from 'react';
import { TeamDataContextType } from '../types/contexts';

// ============================================================================
// API HELPERS
// ============================================================================

async function fetchTeamDataHelper(teamId: string): Promise<Team> {
  const response = await fetch(`/api/teams/${teamId}`);
  if (response.status === 200) {
    return await response.json() as Promise<Team>;
  }
  throw new Error(`HTTP ${response.status} for team ${teamId}`);
}

// ============================================================================
// CONTEXT
// ============================================================================

const TeamDataContext = createContext<TeamDataContextType | null>(null);

export function TeamDataProvider({ children }: { children: React.ReactNode }) {
  const [teamDataByTeam, setTeamDataByTeam] = useState<Record<string, Team>>({});
  const [loadingByTeam, setLoadingByTeam] = useState<Record<string, boolean>>({});
  const [errorByTeam, setErrorByTeam] = useState<Record<string, string | null>>({});

  const fetchTeamData = useCallback(async (teamId: string): Promise<void> => {
    // Don't fetch if already loading
    if (loadingByTeam[teamId]) {
      return;
    }

    // Set loading state
    setLoadingByTeam((prev: Record<string, boolean>) => ({ ...prev, [teamId]: true }));
    setErrorByTeam((prev: Record<string, string | null>) => ({ ...prev, [teamId]: null }));

    try {
      const teamData = await fetchTeamDataHelper(teamId);
      
      setTeamDataByTeam((prev: Record<string, Team>) => ({ ...prev, [teamId]: teamData }));
      setLoadingByTeam((prev: Record<string, boolean>) => ({ ...prev, [teamId]: false }));
    } catch (err) {
      console.error(`[TeamDataContext] Error fetching team data for team ${teamId}:`, err);
      setErrorByTeam((prev: Record<string, string | null>) => ({ 
        ...prev, 
        [teamId]: err instanceof Error ? err.message : 'Failed to fetch team data' 
      }));
      setLoadingByTeam((prev: Record<string, boolean>) => ({ ...prev, [teamId]: false }));
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

  const updateTeamData = useCallback((teamId: string, teamData: Team): void => {
    setTeamDataByTeam((prev: Record<string, Team>) => ({ ...prev, [teamId]: teamData }));
  }, []);

  const removeTeamData = useCallback((teamId: string): void => {
    setTeamDataByTeam((prev: Record<string, Team>) => {
      const newData = { ...prev };
      delete newData[teamId];
      return newData;
    });
    setLoadingByTeam((prev: Record<string, boolean>) => {
      const newLoading = { ...prev };
      delete newLoading[teamId];
      return newLoading;
    });
    setErrorByTeam((prev: Record<string, string | null>) => {
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

export function useTeamData() {
  const context = useContext(TeamDataContext);
  if (!context) {
    throw new Error('useTeamData must be used within a TeamDataProvider');
  }
  return context;
} 