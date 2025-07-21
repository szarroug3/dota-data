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
import { useConstantsContext } from '@/contexts/constants-context';
import { useDataCoordinator } from '@/contexts/data-coordinator-context';
import { useTeamDataFetching } from '@/contexts/team-data-fetching-context';
import type { TeamData, TeamContextValue, TeamContextProviderProps, TeamMatchParticipation } from '@/types/contexts/team-context-value';
import type { Match } from '@/types/contexts/match-context-value';
import type { Player } from '@/types/contexts/player-context-value';
import type { DotabuffLeague, DotabuffTeam, OpenDotaMatch, DotabuffMatchSummary } from '@/types/external-apis';

// ============================================================================
// DEFAULTS
// ============================================================================



// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const processTeamData = (teamId: string, leagueId: string, teamName: string, leagueName: string, teamResult: DotabuffTeam): TeamData => {
  // Convert API matches to TeamMatchParticipation format
  const matches: TeamMatchParticipation[] = teamResult.matches.map(match => {
    // For now, default to radiant side - this will be updated with detailed match data
    const side = 'radiant' as const;
    
    return {
      matchId: match.matchId,
      side
    };
  });

  // Calculate performance statistics
  const totalMatches = matches.length;
  const totalWins = teamResult.matches.filter(match => match.result === 'won').length;
  const totalLosses = teamResult.matches.filter(match => match.result === 'lost').length;
  const overallWinRate = totalMatches > 0 ? (totalWins / totalMatches) * 100 : 0;
  
  // Calculate average match duration
  const totalDuration = teamResult.matches.reduce((sum, match) => sum + match.duration, 0);
  const averageMatchDuration = totalMatches > 0 ? totalDuration / totalMatches : 0;

  return {
    team: {
      id: teamId,
      name: teamName,
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
    performance: {
      totalMatches,
      totalWins,
      totalLosses,
      overallWinRate,
      heroUsage: {
        picks: [],
        bans: [],
        picksAgainst: [],
        bansAgainst: [],
        picksByPlayer: {}
      },
      draftStats: {
        firstPickCount: 0,
        secondPickCount: 0,
        firstPickWinRate: 0,
        secondPickWinRate: 0,
        uniqueHeroesPicked: 0,
        uniqueHeroesBanned: 0,
        mostPickedHero: '',
        mostBannedHero: ''
      },
      currentWinStreak: 0,
      currentLoseStreak: 0,
      averageMatchDuration,
      averageKills: 0,
      averageDeaths: 0,
      averageGold: 0,
      averageExperience: 0
    }
  };
};

const findTeamData = (teamList: TeamData[], teamId: string, leagueId: string): TeamData | undefined => {
  return teamList.find(td => td.team.id === teamId && td.team.leagueId === leagueId);
};

// Helper function to determine if a team won based on their side and match result
function didTeamWin(match: Match, teamSide: 'radiant' | 'dire'): boolean {
  return match.result === teamSide;
}

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

function useAddMatch(teamList: TeamData[], setTeamList: (teams: TeamData[] | ((prev: TeamData[]) => TeamData[])) => void) {
  return useCallback((match: Match, matchSummary: DotabuffMatchSummary, matchData: OpenDotaMatch, teamId: string, leagueId: string) => {
    // Find the team data for this team/league combination
    const teamData = findTeamData(teamList, teamId, leagueId);
    if (!teamData) {
      console.warn(`Team ${teamId} not found when adding match ${match.id}`);
      return;
    }

    // Determine which side the team played on using the OpenDota match data
    const teamName = teamData.team.name;
    let teamSide: 'radiant' | 'dire' = 'radiant'; // Default fallback
    
    if (matchData.radiant_name && matchData.dire_name) {
      if (matchData.radiant_name === teamName) {
        teamSide = 'radiant';
      } else if (matchData.dire_name === teamName) {
        teamSide = 'dire';
      }
    }

    // Update the team data with the new match
    setTeamList(prevList => prevList.map(td => {
      if (td.team.id === teamId && td.team.leagueId === leagueId) {
        // Check if match already exists
        const matchExists = td.matches.some(m => m.id === match.id);
        if (matchExists) {
          return td; // Don't add duplicate
        }

        // Create the match with the determined team side and opponent from matchSummary
        const matchWithTeamSide = {
          ...match,
          teamSide,
          opponent: matchSummary.opponentName // Use opponent name from Dotabuff data
        };

        // Determine if this team won based on their side and the match result
        const teamWon = didTeamWin(matchWithTeamSide, teamSide);

        return {
          ...td,
          matches: [...td.matches, matchWithTeamSide],
          summary: {
            ...td.summary,
            totalMatches: td.matches.length + 1,
            totalWins: td.matches.filter(m => didTeamWin(m, m.teamSide)).length + (teamWon ? 1 : 0),
            totalLosses: td.matches.filter(m => !didTeamWin(m, m.teamSide)).length + (teamWon ? 0 : 1)
          }
        };
      }
      return td;
    }));
  }, [teamList, setTeamList]);
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

  const addMatch = useAddMatch(teamList, setTeamList);

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
    addMatch,
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
  const { items, isLoadingItems } = useConstantsContext();
  const prevActiveTeam = useRef<{ teamId: string; leagueId: string } | null>(null);

  // On mount, hydrate matches for the active team (if any)
  // Wait for items to be loaded before fetching matches
  useEffect(() => {
    if (activeTeam && 
        !isLoadingItems && 
        Object.keys(items).length > 0 && 
        (!prevActiveTeam.current || 
         prevActiveTeam.current.teamId !== activeTeam.teamId || 
         prevActiveTeam.current.leagueId !== activeTeam.leagueId)) {
      
      fetchMatchesForTeam(activeTeam.teamId, activeTeam.leagueId);
      prevActiveTeam.current = activeTeam;
    }
  }, [activeTeam, fetchMatchesForTeam, items, isLoadingItems]);

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