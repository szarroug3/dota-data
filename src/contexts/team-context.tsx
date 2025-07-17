"use client";

/**
 * Team Context
 * 
 * Manages team state and provides actions for team operations.
 * Handles league-specific data filtering and player aggregation.
 * Uses config context for persistence of team list and active team.
 */

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

import { useConfigContext } from '@/contexts/config-context';
import { useDataCoordinator } from '@/contexts/data-coordinator-context';
import { useTeamDataFetching } from '@/contexts/team-data-fetching-context';
import type { Match, Player, TeamContextProviderProps, TeamContextValue, TeamData } from '@/types/contexts/team-types';
import type { DotabuffLeague, DotabuffTeam } from '@/types/external-apis';

// ============================================================================
// DEFAULTS
// ============================================================================



// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const processTeamData = (teamId: string, leagueId: string, teamName: string, leagueName: string, teamResult: DotabuffTeam): TeamData => {
  // Convert API matches to our Match format
  const matches: Match[] = teamResult.matches.map(match => ({
    id: match.matchId,
    teamId,
    leagueId: match.leagueId,
    opponent: match.opponentName,
    result: match.result === 'won' ? 'win' : 'loss',
    date: new Date(match.startTime * 1000).toISOString(),
    duration: match.duration,
    teamSide: 'radiant', // Default value, will be updated when detailed match data is fetched
    pickOrder: 'first', // Default value, will be updated when detailed match data is fetched
    players: [], // Will be populated when detailed match data is fetched
    heroes: [] // Will be populated when detailed match data is fetched
  }));

  // Calculate summary statistics
  const totalMatches = matches.length;
  const totalWins = matches.filter(match => match.result === 'win').length;
  const totalLosses = matches.filter(match => match.result === 'loss').length;
  const overallWinRate = totalMatches > 0 ? (totalWins / totalMatches) * 100 : 0;
  
  // Calculate average match duration
  const totalDuration = matches.reduce((sum, match) => sum + match.duration, 0);
  const averageMatchDuration = totalMatches > 0 ? totalDuration / totalMatches : 0;
  
  // Find last match date
  const lastMatchDate = matches.length > 0 
    ? new Date(Math.max(...teamResult.matches.map(match => match.startTime * 1000))).toISOString()
    : null;

  return {
    team: {
      id: teamId,
      name: teamName,
      leagueId,
      leagueName,
      isActive: false,
      isLoading: false,
      error: undefined
    },
    league: {
      id: leagueId,
      name: leagueName
    },
    matches,
    players: [], // Players will be populated later
    summary: {
      totalMatches,
      totalWins,
      totalLosses,
      overallWinRate,
      lastMatchDate,
      averageMatchDuration,
      totalPlayers: 0 // Will be updated when players are fetched
    }
  };
};

const findTeamData = (teamList: TeamData[], teamId: string, leagueId: string): TeamData | undefined => {
  return teamList.find(td => td.team.id === teamId && td.team.leagueId === leagueId);
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



function useAddTeam(teamList: TeamData[], setTeamList: (teams: TeamData[] | ((prev: TeamData[]) => TeamData[])) => void, setIsLoading: (loading: boolean) => void, setError: (error: string | null) => void, fetchTeamData: (teamId: string, force?: boolean) => Promise<DotabuffTeam | { error: string }>, fetchLeagueData: (leagueId: string, force?: boolean) => Promise<DotabuffLeague | { error: string }>) {
  return useCallback(async (teamId: string, leagueId: string) => {
    if (findTeamData(teamList, teamId, leagueId)) {
      throw new Error('Team already exists');
    }
    setIsLoading(true);
    setError(null);
    try {
      const newTeamData = {
        team: { id: teamId, name: `Loading ${teamId}...`, leagueId, leagueName: `Loading ${leagueId}...`, isActive: false, isLoading: true, error: undefined },
        league: { id: leagueId, name: `Loading ${leagueId}...` },
        matches: [], players: [], summary: { totalMatches: 0, totalWins: 0, totalLosses: 0, overallWinRate: 0, lastMatchDate: null, averageMatchDuration: 0, totalPlayers: 0 }
      };
      const updatedTeamList = [...teamList, newTeamData];
      setTeamList(updatedTeamList);
      const [teamResult, leagueResult] = await Promise.all([
        fetchTeamData(teamId), fetchLeagueData(leagueId)
      ]);
      if ('error' in teamResult) throw new Error('Failed to fetch team data');
      if ('error' in leagueResult) throw new Error('Failed to fetch league data');
      const finalTeamData = processTeamData(teamId, leagueId, teamResult.name, leagueResult.name, teamResult);
      const finalTeamList = updatedTeamList.map(td => td.team.id === teamId && td.team.leagueId === leagueId ? finalTeamData : td);
      setTeamList(finalTeamList);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add team';
      setError(errorMessage);
      // Use a functional update to ensure we have the latest team list
      setTeamList((prevList: TeamData[]) => prevList.map((td: TeamData) => {
        if (td.team.id === teamId && td.team.leagueId === leagueId) {
          return {
            ...td,
            team: {
              ...td.team,
              isLoading: false,
              error: errorMessage
            }
          };
        }
        return td;
      }));
    } finally {
      setIsLoading(false);
    }
  }, [teamList, setTeamList, fetchTeamData, fetchLeagueData, setIsLoading, setError]);
}

function useRemoveTeam(teamList: TeamData[], setTeamList: (teams: TeamData[] | ((prev: TeamData[]) => TeamData[])) => void, activeTeam: { teamId: string; leagueId: string } | null, setActiveTeam: (team: { teamId: string; leagueId: string } | null) => void) {
  return useCallback(async (teamId: string, leagueId: string) => {
    const updatedTeamList = teamList.filter(teamData => !(teamData.team.id === teamId && teamData.team.leagueId === leagueId));
    setTeamList(updatedTeamList);
    if (activeTeam && activeTeam.teamId === teamId && activeTeam.leagueId === leagueId) {
      setActiveTeam(null);
    }
  }, [teamList, setTeamList, activeTeam, setActiveTeam]);
}

function useSetActiveTeamHandler(teamList: TeamData[], setActiveTeam: (team: { teamId: string; leagueId: string } | null) => void) {
  return useCallback(async (teamId: string | null, leagueId?: string) => {
    if (teamId === null) {
      setActiveTeam(null);
      return;
    }
    if (!leagueId) throw new Error('League ID is required when setting active team');
    const teamData = findTeamData(teamList, teamId, leagueId);
    if (!teamData) {
      console.warn(`Team ${teamId} not found in list when setting as active. This might be normal if the team was just added.`);
    }
    setActiveTeam({ teamId, leagueId });
  }, [teamList, setActiveTeam]);
}

function useRefreshTeam(teamList: TeamData[], setTeamList: (teams: TeamData[] | ((prev: TeamData[]) => TeamData[])) => void, setIsLoading: (loading: boolean) => void, setError: (error: string | null) => void, fetchTeamData: (teamId: string, force?: boolean) => Promise<DotabuffTeam | { error: string }>, fetchLeagueData: (leagueId: string, force?: boolean) => Promise<DotabuffLeague | { error: string }>) {
  return useCallback(async (teamId: string, leagueId: string) => {
    if (!findTeamData(teamList, teamId, leagueId)) throw new Error('Team not found');
    setIsLoading(true);
    setError(null);
    try {
      // Update the team to show loading state in place
      setTeamList((prevList: TeamData[]) => prevList.map((td: TeamData) => {
        if (td.team.id === teamId && td.team.leagueId === leagueId) {
          return {
            ...td,
            team: {
              ...td.team,
              isLoading: true,
              error: undefined
            }
          };
        }
        return td;
      }));
      
      const [teamResult, leagueResult] = await Promise.all([
        fetchTeamData(teamId, true), fetchLeagueData(leagueId, true)
      ]);
      if ('error' in teamResult) throw new Error('Failed to fetch team data');
      if ('error' in leagueResult) throw new Error('Failed to fetch league data');
      const finalTeamData = processTeamData(teamId, leagueId, teamResult.name, leagueResult.name, teamResult);
      
      // Update the team in place
      setTeamList((prevList: TeamData[]) => prevList.map((td: TeamData) => {
        if (td.team.id === teamId && td.team.leagueId === leagueId) {
          return finalTeamData;
        }
        return td;
      }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh team';
      setError(errorMessage);
      
      // Update the team to show error state in place
      setTeamList((prevList: TeamData[]) => prevList.map((td: TeamData) => {
        if (td.team.id === teamId && td.team.leagueId === leagueId) {
          return {
            ...td,
            team: {
              ...td.team,
              isLoading: false,
              error: errorMessage
            }
          };
        }
        return td;
      }));
    } finally {
      setIsLoading(false);
    }
  }, [teamList, setTeamList, fetchTeamData, fetchLeagueData, setIsLoading, setError]);
}

const useTeamOperations = (
  teamList: TeamData[],
  setTeamList: (teams: TeamData[] | ((prev: TeamData[]) => TeamData[])) => void,
  activeTeam: { teamId: string; leagueId: string } | null,
  setActiveTeam: (team: { teamId: string; leagueId: string } | null) => void,
  setIsLoading: (loading: boolean) => void,
  setError: (error: string | null) => void,
  fetchTeamData: (teamId: string, force?: boolean) => Promise<DotabuffTeam | { error: string }>,
  fetchLeagueData: (leagueId: string, force?: boolean) => Promise<DotabuffLeague | { error: string }>
) => {
  const addTeam = useAddTeam(teamList, setTeamList, setIsLoading, setError, fetchTeamData, fetchLeagueData);
  const removeTeam = useRemoveTeam(teamList, setTeamList, activeTeam, setActiveTeam);
  const setActiveTeamHandler = useSetActiveTeamHandler(teamList, setActiveTeam);
  const refreshTeam = useRefreshTeam(teamList, setTeamList, setIsLoading, setError, fetchTeamData, fetchLeagueData);
  return { addTeam, removeTeam, setActiveTeam: setActiveTeamHandler, refreshTeam };
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
  const { fetchTeamData, fetchLeagueData } = useTeamDataFetching();

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
    fetchTeamData,
    fetchLeagueData
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
    teamExists: (teamId: string, leagueId: string) => findTeamData(teamList, teamId, leagueId) !== undefined,
    clearError
  };

  return (
    <TeamContext.Provider value={contextValue}>
      {children}
    </TeamContext.Provider>
  );
};

// ============================================================================
// HYDRATION COMPONENT
// ============================================================================

export const TeamHydrationHandler: React.FC = () => {
  const { activeTeam } = useTeamContext();
  const { fetchMatchesForTeam } = useDataCoordinator();
  const prevActiveTeam = useRef<{ teamId: string; leagueId: string } | null>(null);

  // On mount, hydrate matches for the active team (if any)
  useEffect(() => {
    if (activeTeam && (!prevActiveTeam.current || prevActiveTeam.current.teamId !== activeTeam.teamId || prevActiveTeam.current.leagueId !== activeTeam.leagueId)) {
      fetchMatchesForTeam(activeTeam.teamId, activeTeam.leagueId);
      prevActiveTeam.current = activeTeam;
    }
  }, [activeTeam, fetchMatchesForTeam]);

  return null;
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