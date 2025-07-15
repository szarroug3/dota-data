/**
 * Team Context
 * 
 * Manages team state and provides actions for team operations.
 * Handles real-time updates as team and league data are fetched independently.
 */

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

import type {
  Player,
  Team,
  TeamContextProviderProps,
  TeamContextValue,
  TeamData
} from '@/types/contexts/team-context-value';
import type { DotabuffLeague, DotabuffMatchSummary, DotabuffTeam } from '@/types/external-apis';

import { useTeamDataFetching } from './team-data-fetching-context';

const TeamContext = createContext<TeamContextValue | undefined>(undefined);

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function convertApiResponseToTeamData(teamResponse: DotabuffTeam, leagueResponse: DotabuffLeague): TeamData {
  const team: Team = {
    id: teamResponse.id,
    name: teamResponse.name,
    leagueId: leagueResponse.id,
    leagueName: leagueResponse.name,
    isActive: true,
    isLoading: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const matches = teamResponse.matches?.filter((match: DotabuffMatchSummary) => match.leagueId === leagueResponse.id)
    .map((match: DotabuffMatchSummary) => ({
    id: match.matchId.toString(),
    teamId: team.id,
    opponent: match.opponentName,
    result: (match.result === 'won' ? 'win' : 'loss') as 'win' | 'loss',
    date: new Date(match.startTime * 1000).toISOString(),
    duration: match.duration,
    heroes: [],
    players: []
  })) || [];

  const summary = {
    totalMatches: matches.length,
    totalWins: matches.filter((m: { result: string }) => m.result === 'win').length,
    totalLosses: matches.filter((m: { result: string }) => m.result === 'loss').length,
    overallWinRate: matches.length > 0 ? (matches.filter((m: { result: string }) => m.result === 'win').length / matches.length) * 100 : 0,
    lastMatchDate: matches.length > 0 ? matches[0].date : null
  };

  const players: Player[] = [];
  return { team, matches, players, summary };
}

function createOptimisticTeamData(teamId: string, leagueId: string): TeamData {
  const optimisticTeam: Team = {
    id: teamId,
    name: `Loading ${teamId}...`,
    leagueId: leagueId,
    leagueName: `Loading ${leagueId}...`,
    isActive: true,
    isLoading: true,
    error: undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  return {
    team: optimisticTeam,
    matches: [],
    players: [],
    summary: {
      totalMatches: 0,
      totalWins: 0,
      totalLosses: 0,
      overallWinRate: 0,
      lastMatchDate: null
    }
  };
}

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

function useTeamState() {
  const [teamDataList, setTeamDataList] = useState<TeamData[]>([]);
  const [activeTeam, setActiveTeam] = useState<{ teamId: string; leagueId: string } | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  return {
    teamDataList, setTeamDataList,
    activeTeam, setActiveTeam,
    globalError, setGlobalError,
    isInitialized, setIsInitialized
  };
}

// ============================================================================
// TEAM OPERATIONS
// ============================================================================

function useTeamOperations(state: ReturnType<typeof useTeamState>) {
  const { fetchTeamData, fetchLeagueData } = useTeamDataFetching();
  const { 
    setTeamDataList,
    setGlobalError
  } = state;

  // Update loading state for a team
  const updateLoadingState = useCallback((teamId: string, leagueId: string, loading: boolean) => {
    setTeamDataList(prev => prev.map(teamData => 
      teamData.team.id === teamId && teamData.team.leagueId === leagueId
        ? { ...teamData, team: { ...teamData.team, isLoading: loading } }
        : teamData
    ));
  }, [setTeamDataList]);

  // Update team in the teamDataList
  const updateTeamInList = useCallback((teamId: string, leagueId: string, updates: Partial<Team>) => {
    setTeamDataList(prev => prev.map(teamData => 
      teamData.team.id === teamId && teamData.team.leagueId === leagueId
        ? { ...teamData, team: { ...teamData.team, ...updates, updatedAt: new Date().toISOString() } }
        : teamData
    ));
  }, [setTeamDataList]);

  // Clear global error
  const clearGlobalError = useCallback(() => {
    setGlobalError(null);
  }, [setGlobalError]);

  return {
    fetchTeamData,
    fetchLeagueData,
    updateLoadingState,
    updateTeamInList,
    clearGlobalError
  };
}

// ============================================================================
// DATA FETCHING OPERATIONS
// ============================================================================

// Helper functions for team data updates

function buildErrorString(teamError?: string, leagueError?: string): string | undefined {
  if (teamError && leagueError) {
    return 'Failed to fetch team and league data';
  } else if (teamError) {
    return 'Failed to fetch team data';
  } else if (leagueError) {
    return 'Failed to fetch league data';
  }
  return undefined;
}

function mapMatches(teamId: string, matches?: DotabuffMatchSummary[]) {
  return matches?.map((match: DotabuffMatchSummary) => ({
    id: match.matchId.toString(),
    teamId,
    opponent: match.opponentName,
    result: (match.result === 'won' ? 'win' : 'loss') as 'win' | 'loss',
    date: new Date(match.startTime * 1000).toISOString(),
    duration: match.duration,
    heroes: [],
    players: []
  })) || [];
}

function buildSummary(matches?: DotabuffMatchSummary[]) {
  if (!matches) return {
    totalMatches: 0,
    totalWins: 0,
    totalLosses: 0,
    overallWinRate: 0,
    lastMatchDate: null
  };
  const totalMatches = matches.length;
  const totalWins = matches.filter((m) => m.result === 'won').length;
  const totalLosses = matches.filter((m) => m.result === 'lost').length;
  return {
    totalMatches,
    totalWins,
    totalLosses,
    overallWinRate: totalMatches > 0 ? (totalWins / totalMatches) * 100 : 0,
    lastMatchDate: totalMatches > 0 ? new Date(matches[0].startTime * 1000).toISOString() : null
  };
}

function createPartialTeamUpdate(
  existingTeamData: TeamData,
  teamResponse: DotabuffTeam | null,
  leagueResponse: DotabuffLeague | null,
  teamError?: string,
  leagueError?: string
): TeamData {
  const updatedTeam: Team = {
    id: existingTeamData.team.id,
    name: teamResponse?.name || existingTeamData.team.name,
    leagueId: existingTeamData.team.leagueId,
    leagueName: leagueResponse?.name || existingTeamData.team.leagueName,
    isActive: existingTeamData.team.isActive,
    isLoading: existingTeamData.team.isLoading,
    createdAt: existingTeamData.team.createdAt,
    updatedAt: new Date().toISOString(),
    error: buildErrorString(teamError, leagueError)
  };

  const updatedMatches = teamResponse ? mapMatches(existingTeamData.team.id, teamResponse.matches) : existingTeamData.matches;
  const updatedSummary = teamResponse ? buildSummary(teamResponse.matches) : existingTeamData.summary;
  return {
    team: updatedTeam,
    matches: updatedMatches,
    players: existingTeamData.players,
    summary: updatedSummary
  };
}



function useDataFetchingOperations(
  state: ReturnType<typeof useTeamState>,
  operations: ReturnType<typeof useTeamOperations>
) {
  const { 
    fetchTeamData, fetchLeagueData, 
    updateTeamInList
  } = operations;
  const { setTeamDataList } = state;

  // Helper to fetch team
  const fetchTeam = useCallback(async (teamId: string, force = false) => {
    const response = await fetchTeamData(teamId, force);
    if ('error' in response) {
      return { data: null, error: response.error };
    }
    return { data: response, error: undefined };
  }, [fetchTeamData]);

  // Helper to fetch league
  const fetchLeague = useCallback(async (leagueId: string, teamId: string, force = false) => {
    const response = await fetchLeagueData(leagueId, force);
    if ('error' in response) {
      return { data: null, error: response.error };
    }
    return { data: response, error: undefined };
  }, [fetchLeagueData]);

  // Fetch and update team data
  const fetchAndUpdateTeamData = useCallback(async (
    teamId: string, 
    leagueId: string, 
    force = false
  ): Promise<{ team: DotabuffTeam | null; league: DotabuffLeague | null; teamError?: string; leagueError?: string }> => {
    const [teamResult, leagueResult] = await Promise.all([
      fetchTeam(teamId, force),
      fetchLeague(leagueId, teamId, force)
    ]);
    return {
      team: teamResult.data,
      league: leagueResult.data,
      teamError: teamResult.error,
      leagueError: leagueResult.error
    };
  }, [fetchTeam, fetchLeague]);

  // Complete team data update
  const completeTeamDataUpdate = useCallback((
    teamId: string,
    leagueId: string,
    teamResponse: DotabuffTeam | null,
    leagueResponse: DotabuffLeague | null,
    teamError?: string,
    leagueError?: string
  ) => {
    const existingTeamData = state.teamDataList.find(td => 
      td.team.id === teamId && td.team.leagueId === leagueId
    );

    if (teamResponse && leagueResponse) {
      // Both successful - update with complete data
      const teamData = convertApiResponseToTeamData(teamResponse, leagueResponse);
      setTeamDataList((prev: TeamData[]) => prev.map((existingTeamData: TeamData) => 
        existingTeamData.team.id === teamId && existingTeamData.team.leagueId === leagueId ? teamData : existingTeamData
      ));
      updateTeamInList(teamId, leagueId, { error: undefined });
    } else if (existingTeamData) {
      // Partial update with existing data
      const updatedTeamData = createPartialTeamUpdate(
        existingTeamData,
        teamResponse,
        leagueResponse,
        teamError,
        leagueError
      );
      setTeamDataList((prev: TeamData[]) => prev.map((existingTeamData: TeamData) => 
        existingTeamData.team.id === teamId && existingTeamData.team.leagueId === leagueId ? updatedTeamData : existingTeamData
      ));
    } else if (teamResponse || leagueResponse) {
      // Partial success but no existing data - create partial team data
      const optimisticTeamData = createOptimisticTeamData(teamId, leagueId);
      const updatedTeamData = createPartialTeamUpdate(
        optimisticTeamData,
        teamResponse,
        leagueResponse,
        teamError,
        leagueError
      );
      setTeamDataList((prev: TeamData[]) => prev.map((existingTeamData: TeamData) => 
        existingTeamData.team.id === teamId && existingTeamData.team.leagueId === leagueId ? updatedTeamData : existingTeamData
      ));
    } else {
      // Both failed - set error
      const errorMessage = buildErrorString(teamError, leagueError);
      updateTeamInList(teamId, leagueId, { error: errorMessage });
    }
  }, [setTeamDataList, updateTeamInList, state.teamDataList]);

  return {
    fetchAndUpdateTeamData,
    completeTeamDataUpdate
  };
}

// ============================================================================
// TEAM ACTIONS HELPERS
// ============================================================================

function useAddTeam(
  state: ReturnType<typeof useTeamState>,
  operations: ReturnType<typeof useTeamOperations>,
  dataOps: ReturnType<typeof useDataFetchingOperations>
) {
  const { setTeamDataList, setActiveTeam, setGlobalError } = state;
  const { updateLoadingState, clearGlobalError } = operations;
  const { fetchAndUpdateTeamData, completeTeamDataUpdate } = dataOps;
  
  return React.useCallback(async (teamId: string, leagueId: string): Promise<void> => {
    try {
      // Clear any previous global errors
      clearGlobalError();
      
      // Validate input
      if (!teamId.trim() || !leagueId.trim()) {
        throw new Error('Team ID and League ID are required');
      }

      updateLoadingState(teamId, leagueId, true);
      const optimisticTeamData = createOptimisticTeamData(teamId, leagueId);
      setTeamDataList((prev: TeamData[]) => [...prev, optimisticTeamData]);
      
      const { team: teamResponse, league: leagueResponse, teamError, leagueError } = await fetchAndUpdateTeamData(teamId, leagueId, false);
      completeTeamDataUpdate(teamId, leagueId, teamResponse, leagueResponse, teamError, leagueError);
      
      // Set team as active if there are no errors (even if partial data)
      if (!teamError && !leagueError) {
        setActiveTeam({ teamId, leagueId });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add team';
      
      // Update the team with error state
      setTeamDataList((prev: TeamData[]) => prev.map((teamData: TeamData) => 
        teamData.team.id === teamId 
          ? { ...teamData, team: { ...teamData.team, error: errorMessage, isLoading: false } }
          : teamData
      ));
      
      // Set global error for user feedback
      setGlobalError(errorMessage);
      
      // Re-throw the error so the calling component can handle it
      throw error;
    } finally {
      updateLoadingState(teamId, leagueId, false);
    }
  }, [setTeamDataList, setActiveTeam, setGlobalError, updateLoadingState, fetchAndUpdateTeamData, completeTeamDataUpdate, clearGlobalError]);
}

function useRemoveTeam(state: ReturnType<typeof useTeamState>) {
  const { setTeamDataList, setActiveTeam } = state;
  return React.useCallback(async (teamId: string, leagueId: string): Promise<void> => {
    setTeamDataList((prev: TeamData[]) => prev.filter((teamData: TeamData) => 
      !(teamData.team.id === teamId && teamData.team.leagueId === leagueId)
    ));
    // Clear active team if it's the one being removed
    setActiveTeam(prev => prev?.teamId === teamId && prev?.leagueId === leagueId ? null : prev);
  }, [setTeamDataList, setActiveTeam]);
}

function useRefreshTeam(
  state: ReturnType<typeof useTeamState>,
  operations: ReturnType<typeof useTeamOperations>,
  dataOps: ReturnType<typeof useDataFetchingOperations>
) {
  const { updateLoadingState, clearGlobalError } = operations;
  const { fetchAndUpdateTeamData, completeTeamDataUpdate } = dataOps;
  
  return React.useCallback(async (teamId: string, leagueId: string): Promise<void> => {
    try {
      // Clear any previous global errors
      clearGlobalError();
      
      updateLoadingState(teamId, leagueId, true);
      const { team: teamResponse, league: leagueResponse, teamError, leagueError } = await fetchAndUpdateTeamData(teamId, leagueId, true);
      completeTeamDataUpdate(teamId, leagueId, teamResponse, leagueResponse, teamError, leagueError);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to refresh team';
      operations.updateTeamInList(teamId, leagueId, { error: errorMessage });
      
      // Re-throw the error so the calling component can handle it
      throw error;
    } finally {
      updateLoadingState(teamId, leagueId, false);
    }
  }, [updateLoadingState, fetchAndUpdateTeamData, completeTeamDataUpdate, operations, clearGlobalError]);
}

function useUpdateTeam(
  state: ReturnType<typeof useTeamState>,
  operations: ReturnType<typeof useTeamOperations>,
  dataOps: ReturnType<typeof useDataFetchingOperations>
) {
  const { setTeamDataList, setActiveTeam } = state;
  const { updateLoadingState } = operations;
  const { fetchAndUpdateTeamData, completeTeamDataUpdate } = dataOps;

  return React.useCallback(async (
    oldTeamId: string,
    oldLeagueId: string,
    newTeamId: string,
    newLeagueId: string
  ): Promise<void> => {
    try {
      // Remove the old team and add optimistic team data (like addTeam)
      const optimisticTeamData = createOptimisticTeamData(newTeamId, newLeagueId);
      setTeamDataList((prev: TeamData[]) => {
        // Remove the old team
        const filtered = prev.filter(teamData => 
          !(teamData.team.id === oldTeamId && teamData.team.leagueId === oldLeagueId)
        );
        // Add the new optimistic team
        return [...filtered, optimisticTeamData];
      });

      // Fetch updated data using the standardized approach
      const { team: teamResponse, league: leagueResponse, teamError, leagueError } = 
        await fetchAndUpdateTeamData(newTeamId, newLeagueId, false);

      // Use the standardized error handling
      completeTeamDataUpdate(newTeamId, newLeagueId, teamResponse, leagueResponse, teamError, leagueError);

      // Check if the updated team has an error and deactivate it if it was active
      setTeamDataList(prev => {
        const updatedTeam = prev.find(teamData => 
          teamData.team.id === newTeamId && teamData.team.leagueId === newLeagueId
        );
        
        if (updatedTeam && updatedTeam.team.error) {
          // If the team has an error and was active, deactivate it
          setActiveTeam(prevActive => {
            if (prevActive && prevActive.teamId === newTeamId && prevActive.leagueId === newLeagueId) {
              return null;
            }
            return prevActive;
          });
        }
        
        return prev;
      });

      // Update active team if needed
      setActiveTeam(prev => {
        if (!prev) return prev;
        if (prev.teamId === oldTeamId && prev.leagueId === oldLeagueId) {
          return { teamId: newTeamId, leagueId: newLeagueId };
        }
        return prev;
      });

      // Check if this team is now the only team without an error and set it as active
      setTeamDataList(prev => {
        const teamsWithoutError = prev.filter(teamData => !teamData.team.error);
        const currentTeam = prev.find(teamData => 
          teamData.team.id === newTeamId && teamData.team.leagueId === newLeagueId
        );
        
        // If this team has no error and is the only team without an error, set it as active
        if (teamsWithoutError.length === 1 && currentTeam && !currentTeam.team.error) {
          setActiveTeam({ teamId: newTeamId, leagueId: newLeagueId });
        }
        
        return prev;
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update team';
      
      // Update the team with error state (like addTeam error handling)
      setTeamDataList((prev: TeamData[]) => prev.map((teamData: TeamData) => 
        teamData.team.id === newTeamId 
          ? { ...teamData, team: { ...teamData.team, error: errorMessage, isLoading: false } }
          : teamData
      ));
      
      // If the errored team is currently active, deactivate it
      setActiveTeam(prev => {
        if (prev && prev.teamId === newTeamId && prev.leagueId === newLeagueId) {
          return null;
        }
        return prev;
      });
      
      // Re-throw the error so the calling component can handle it
      throw error;
    } finally {
      updateLoadingState(newTeamId, newLeagueId, false);
    }
  }, [setTeamDataList, fetchAndUpdateTeamData, completeTeamDataUpdate, setActiveTeam, updateLoadingState]);
}

function useSetActiveTeam(state: ReturnType<typeof useTeamState>) {
  const { setActiveTeam, teamDataList } = state;
  return React.useCallback((teamId: string, leagueId: string): void => {
    // Verify the team exists in the list
    const teamData = teamDataList.find((teamData: TeamData) => teamData.team.id === teamId);
    if (teamData) {
      setActiveTeam({ teamId, leagueId });
    }
  }, [setActiveTeam, teamDataList]);
}

function useTeamActions(
  state: ReturnType<typeof useTeamState>,
  operations: ReturnType<typeof useTeamOperations>,
  dataOps: ReturnType<typeof useDataFetchingOperations>
) {
  const addTeam = useAddTeam(state, operations, dataOps);
  const removeTeam = useRemoveTeam(state);
  const refreshTeam = useRefreshTeam(state, operations, dataOps);
  const updateTeam = useUpdateTeam(state, operations, dataOps);
  const setActiveTeam = useSetActiveTeam(state);

  // Check if a team already exists
  const teamExists = useCallback((teamId: string, leagueId: string): boolean => {
    return state.teamDataList.some(teamData => 
      teamData.team.id === teamId && teamData.team.leagueId === leagueId
    );
  }, [state]);

  // Clear global error
  const clearGlobalError = useCallback(() => {
    state.setGlobalError(null);
  }, [state]);

  // Get global error
  const getGlobalError = useCallback(() => {
    return state.globalError;
  }, [state]);

  // Check if context is initialized
  const isInitialized = useCallback(() => {
    return state.isInitialized;
  }, [state]);

  return useMemo(() => ({
    addTeam,
    removeTeam,
    refreshTeam,
    updateTeam,
    setActiveTeam,
    teamExists,
    clearGlobalError,
    getGlobalError,
    isInitialized
  }), [
    addTeam,
    removeTeam,
    refreshTeam,
    updateTeam,
    setActiveTeam,
    teamExists,
    clearGlobalError,
    getGlobalError,
    isInitialized
  ]);
}

// ============================================================================
// TEAM PROVIDER
// ============================================================================

export const TeamProvider: React.FC<TeamContextProviderProps> = ({ children }) => {
  const state = useTeamState();
  const operations = useTeamOperations(state);
  const dataOps = useDataFetchingOperations(state, operations);
  const actions = useTeamActions(state, operations, dataOps);
  const isInitializedRef = React.useRef(false);

  // Initialize context on mount
  React.useEffect(() => {
    if (!isInitializedRef.current) {
      state.setIsInitialized(true);
      isInitializedRef.current = true;
    }
  }, [state, state.setIsInitialized]);

  const contextValue: TeamContextValue = {
    teamDataList: state.teamDataList,
    activeTeam: state.activeTeam,
    ...actions
  };

  return (
    <TeamContext.Provider value={contextValue}>
      {children}
    </TeamContext.Provider>
  );
};

// ============================================================================
// TEAM CONTEXT HOOK
// ============================================================================

export const useTeamContext = (): TeamContextValue => {
  const context = useContext(TeamContext);
  if (context === undefined) {
    throw new Error('useTeamContext must be used within a TeamProvider');
  }
  return context;
}; 