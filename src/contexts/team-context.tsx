/**
 * Team Context
 * 
 * Manages team state and provides actions for team operations.
 * Handles league-specific data filtering and player aggregation.
 * Uses config context for persistence of team list and active team.
 */

import React, { createContext, useCallback, useContext, useState } from 'react';

import { useConfigContext } from '@/contexts/config-context';
import { useTeamDataFetching } from '@/contexts/team-data-fetching-context';
import type { Match, Player, TeamContextProviderProps, TeamContextValue, TeamData, TeamSummary } from '@/types/contexts/team-types';
import type { DotabuffTeam } from '@/types/external-apis';

// ============================================================================
// DEFAULTS
// ============================================================================

const DEFAULT_TEAM_SUMMARY: TeamSummary = {
  totalMatches: 0,
  totalWins: 0,
  totalLosses: 0,
  overallWinRate: 0,
  lastMatchDate: null,
  averageMatchDuration: 0,
  totalPlayers: 0
};

const DEFAULT_TEAM_DATA: Omit<TeamData, 'team' | 'league'> = {
  matches: [],
  players: [],
  summary: DEFAULT_TEAM_SUMMARY
};

// ============================================================================
// HELPERS
// ============================================================================

const createTeamData = (teamId: string, leagueId: string, teamName: string): TeamData => ({
  team: {
    id: teamId,
    name: teamName,
    leagueId,
    isActive: false,
    isLoading: false,
    error: undefined
  },
  league: { id: leagueId, name: 'Unknown League' },
  ...DEFAULT_TEAM_DATA
});

const findTeamData = (teamList: TeamData[], teamId: string, leagueId: string): TeamData | undefined => {
  return teamList.find(teamData => 
    teamData.team.id === teamId && teamData.team.leagueId === leagueId
  );
};

const teamExists = (teamList: TeamData[], teamId: string, leagueId: string): boolean => {
  return findTeamData(teamList, teamId, leagueId) !== undefined;
};

// ============================================================================
// CONTEXT CREATION
// ============================================================================

const TeamContext = createContext<TeamContextValue | undefined>(undefined);

// ============================================================================
// CUSTOM HOOKS
// ============================================================================

const useTeamState = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return {
    isLoading,
    setIsLoading,
    error,
    setError
  };
};

const useTeamUtilities = (teamList: TeamData[]) => {
  const teamExistsCallback = useCallback((teamId: string, leagueId: string) => {
    return teamExists(teamList, teamId, leagueId);
  }, [teamList]);

  const createTeamDataCallback = useCallback((teamId: string, leagueId: string, teamName: string): TeamData => {
    return createTeamData(teamId, leagueId, teamName);
  }, []);

  return {
    teamExists: teamExistsCallback,
    createTeamData: createTeamDataCallback
  };
};

const useTeamOperations = (
  teamList: TeamData[],
  setTeamList: (teams: TeamData[]) => void,
  activeTeam: { teamId: string; leagueId: string } | null,
  setActiveTeam: (team: { teamId: string; leagueId: string } | null) => void,
  setIsLoading: (loading: boolean) => void,
  setError: (error: string | null) => void,
  teamExists: (teamId: string, leagueId: string) => boolean,
  createTeamData: (teamId: string, leagueId: string, teamName: string) => TeamData,
  fetchTeamData: (teamId: string) => Promise<DotabuffTeam | { error: string }>
) => {
  const addTeam = useCallback(async (teamId: string, leagueId: string) => {
    if (teamExists(teamId, leagueId)) {
      throw new Error('Team already exists');
    }

    setIsLoading(true);
    setError(null);

    try {
      // Create initial team data
      const newTeamData = createTeamData(teamId, leagueId, 'Loading...');
      const updatedTeamList = [...teamList, newTeamData];
      setTeamList(updatedTeamList);

      // Fetch team data
      const teamResult = await fetchTeamData(teamId);
      if ('error' in teamResult) {
        throw new Error(`Failed to fetch team data: ${teamResult.error}`);
      }

      // Create final team data
      const finalTeamData = createTeamData(teamId, leagueId, teamResult.name);

      // Update team list with final data
      const finalTeamList = updatedTeamList.map(td => 
        td.team.id === teamId && td.team.leagueId === leagueId ? finalTeamData : td
      );
      setTeamList(finalTeamList);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add team';
      setError(errorMessage);
      
      // Remove the team from list if there was an error
      const cleanedTeamList = teamList.filter(td => 
        !(td.team.id === teamId && td.team.leagueId === leagueId)
      );
      setTeamList(cleanedTeamList);
      
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [teamList, setTeamList, teamExists, createTeamData, fetchTeamData, setIsLoading, setError]);

  const removeTeam = useCallback((teamId: string, leagueId: string) => {
    const updatedTeamList = teamList.filter(teamData =>
      !(teamData.team.id === teamId && teamData.team.leagueId === leagueId)
    );
    setTeamList(updatedTeamList);
    
    // Clear active team if it was the removed team
    if (activeTeam && activeTeam.teamId === teamId && activeTeam.leagueId === leagueId) {
      setActiveTeam(null);
    }
  }, [teamList, setTeamList, activeTeam, setActiveTeam]);

  const setActiveTeamHandler = useCallback(async (teamId: string | null, leagueId?: string) => {
    if (teamId === null) {
      setActiveTeam(null);
      return;
    }
    
    if (!leagueId) {
      throw new Error('League ID is required when setting active team');
    }
    
    const teamData = findTeamData(teamList, teamId, leagueId);
    
    if (!teamData) {
      throw new Error('Team not found');
    }

    setActiveTeam({ teamId, leagueId });
  }, [teamList, setActiveTeam]);

  const refreshTeam = useCallback(async (teamId: string, leagueId: string) => {
    if (!teamExists(teamId, leagueId)) {
      throw new Error('Team not found');
    }

    setIsLoading(true);
    setError(null);

    try {
      // Remove existing team data
      const teamListWithoutTeam = teamList.filter(td => 
        !(td.team.id === teamId && td.team.leagueId === leagueId)
      );
      setTeamList(teamListWithoutTeam);

      // Fetch fresh team data
      const teamResult = await fetchTeamData(teamId);
      if ('error' in teamResult) {
        throw new Error(`Failed to fetch team data: ${teamResult.error}`);
      }

      // Create final team data
      const finalTeamData = createTeamData(teamId, leagueId, teamResult.name);

      // Add the refreshed team data to the list
      const refreshedTeamList = [...teamListWithoutTeam, finalTeamData];
      setTeamList(refreshedTeamList);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh team';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [teamList, setTeamList, teamExists, fetchTeamData, createTeamData, setIsLoading, setError]);

  return {
    addTeam,
    removeTeam,
    setActiveTeam: setActiveTeamHandler,
    refreshTeam
  };
};

const useLeagueOperations = (teamList: TeamData[]) => {
  const getTeamMatchesForLeague = useCallback((teamId: string, leagueId: string): Match[] => {
    const teamData = findTeamData(teamList, teamId, leagueId);
    return teamData?.matches || [];
  }, [teamList]);

  const getTeamPlayersForLeague = useCallback((teamId: string, leagueId: string): Player[] => {
    const teamData = findTeamData(teamList, teamId, leagueId);
    return teamData?.players || [];
  }, [teamList]);

  return {
    getTeamMatchesForLeague,
    getTeamPlayersForLeague
  };
};

const useErrorHandling = (setError: (error: string | null) => void) => {
  const clearError = useCallback(() => {
    setError(null);
  }, [setError]);

  return {
    clearError
  };
};

// ============================================================================
// PROVIDER IMPLEMENTATION
// ============================================================================

export const TeamProvider: React.FC<TeamContextProviderProps> = ({ children }) => {
  // State
  const { isLoading, setIsLoading, error, setError } = useTeamState();
  
  // Contexts
  const { teamList, setTeamList, activeTeam, setActiveTeam } = useConfigContext();
  const { fetchTeamData } = useTeamDataFetching();

  // Utilities
  const { teamExists, createTeamData } = useTeamUtilities(teamList);

  // Operations
  const {
    addTeam,
    removeTeam,
    setActiveTeam: setActiveTeamHandler,
    refreshTeam
  } = useTeamOperations(
    teamList,
    setTeamList,
    activeTeam,
    setActiveTeam,
    setIsLoading,
    setError,
    teamExists,
    createTeamData,
    fetchTeamData
  );

  const {
    getTeamMatchesForLeague,
    getTeamPlayersForLeague
  } = useLeagueOperations(teamList);

  const { clearError } = useErrorHandling(setError);

  // Context value
  const contextValue: TeamContextValue = {
    teamDataList: teamList,
    activeTeam,
    isLoading,
    error,
    addTeam,
    removeTeam,
    setActiveTeam: setActiveTeamHandler,
    refreshTeam,
    getTeamMatchesForLeague,
    getTeamPlayersForLeague,
    teamExists,
    clearError
  };

  return (
    <TeamContext.Provider value={contextValue}>
      {children}
    </TeamContext.Provider>
  );
};

// ============================================================================
// HOOK
// ============================================================================

export const useTeamContext = (): TeamContextValue => {
  const context = useContext(TeamContext);
  
  if (context === undefined) {
    throw new Error('useTeamContext must be used within a TeamProvider');
  }
  
  return context;
}; 