"use client";

/**
 * League Context
 * 
 * Manages league state and provides actions for league operations.
 * Handles team data extraction from league matches and player aggregation.
 * Uses config context for persistence of league list and active league.
 */

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

import { useConfigContext } from '@/contexts/config-context';
import { useDataCoordinator } from '@/contexts/data-coordinator-context';
import { useLeagueDataFetching } from '@/contexts/league-data-fetching-context';
import type { Match, Player, LeagueContextProviderProps, LeagueContextValue, LeagueData } from '@/types/contexts/league-types';
import type { SteamLeague } from '@/types/external-apis';

// ============================================================================
// DEFAULTS
// ============================================================================

const DEFAULT_LEAGUE_DATA: LeagueData = {
  league: {
    id: '',
    name: '',
    isActive: false,
    isLoading: false,
    error: undefined
  },
  matches: [],
  teams: [],
  players: [],
  summary: {
    totalMatches: 0,
    totalTeams: 0,
    totalPlayers: 0,
    lastMatchDate: null,
    averageMatchDuration: 0
  }
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const processLeagueData = (leagueId: string, leagueName: string, leagueResult: SteamLeague): LeagueData => {
  // Convert API matches to our Match format
  const matches: Match[] = leagueResult.matches.map(match => ({
    id: match.matchId.toString(),
    leagueId,
    radiantTeamId: match.radiantTeamId.toString(),
    direTeamId: match.direTeamId.toString(),
    startTime: match.startTime,
    duration: 0, // Will be calculated when detailed match data is fetched
    radiantWin: true, // Will be determined from match result
    lobbyType: match.lobbyType,
    seriesId: match.seriesId,
    seriesType: match.seriesType,
    players: match.players.map(player => ({
      accountId: player.accountId,
      playerSlot: player.playerSlot,
      teamNumber: player.teamNumber,
      teamSlot: player.teamSlot,
      heroId: player.heroId,
      heroVariant: player.heroVariant
    }))
  }));

  // Extract unique teams from matches
  const teamIds = new Set<string>();
  matches.forEach(match => {
    teamIds.add(match.radiantTeamId);
    teamIds.add(match.direTeamId);
  });

  const teams = Array.from(teamIds).map(teamId => ({
    id: teamId,
    name: `Team ${teamId}`, // Will be updated when team data is fetched
    matches: matches.filter(match => 
      match.radiantTeamId === teamId || match.direTeamId === teamId
    )
  }));

  // Extract unique players from matches
  const playerMap = new Map<number, Player>();
  matches.forEach(match => {
    match.players.forEach(player => {
      if (!playerMap.has(player.accountId)) {
        playerMap.set(player.accountId, {
          accountId: player.accountId,
          name: `Player ${player.accountId}`, // Will be updated when player data is fetched
          matches: matches.filter(m => 
            m.players.some(p => p.accountId === player.accountId)
          ),
          heroes: [] // Will be populated when detailed data is fetched
        });
      }
    });
  });

  const players = Array.from(playerMap.values());

  // Calculate summary statistics
  const totalMatches = matches.length;
  const totalTeams = teams.length;
  const totalPlayers = players.length;
  
  // Find last match date
  const lastMatchDate = matches.length > 0 
    ? new Date(Math.max(...matches.map(match => match.startTime * 1000))).toISOString()
    : null;

  return {
    league: {
      id: leagueId,
      name: leagueName,
      isActive: false,
      isLoading: false,
      error: undefined
    },
    matches,
    teams,
    players,
    summary: {
      totalMatches,
      totalTeams,
      totalPlayers,
      lastMatchDate,
      averageMatchDuration: 0 // Will be calculated when detailed data is fetched
    }
  };
};

const findLeagueData = (leagueList: LeagueData[], leagueId: string): LeagueData | undefined => {
  return leagueList.find(ld => ld.league.id === leagueId);
};

// ============================================================================
// CONTEXT CREATION
// ============================================================================

const LeagueContext = createContext<LeagueContextValue | undefined>(undefined);

// ============================================================================
// CUSTOM HOOKS
// ============================================================================

const useLeagueState = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return {
    isLoading,
    setIsLoading,
    error,
    setError
  };
};

function useAddLeague(leagueList: LeagueData[], setLeagueList: (leagues: LeagueData[] | ((prev: LeagueData[]) => LeagueData[])) => void, setIsLoading: (loading: boolean) => void, setError: (error: string | null) => void, fetchLeagueData: (leagueId: string, force?: boolean) => Promise<SteamLeague | { error: string }>) {
  return useCallback(async (leagueId: string) => {
    if (findLeagueData(leagueList, leagueId)) {
      throw new Error('League already exists');
    }
    setIsLoading(true);
    setError(null);
    try {
      const newLeagueData = {
        ...DEFAULT_LEAGUE_DATA,
        league: { 
          id: leagueId, 
          name: `Loading ${leagueId}...`, 
          isActive: false, 
          isLoading: true, 
          error: undefined 
        }
      };
      const updatedLeagueList = [...leagueList, newLeagueData];
      setLeagueList(updatedLeagueList);
      
      const leagueResult = await fetchLeagueData(leagueId);
      if ('error' in leagueResult) throw new Error('Failed to fetch league data');
      
      const finalLeagueData = processLeagueData(leagueId, leagueResult.name, leagueResult);
      const finalLeagueList = updatedLeagueList.map(ld => 
        ld.league.id === leagueId ? finalLeagueData : ld
      );
      setLeagueList(finalLeagueList);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add league';
      setError(errorMessage);
      setLeagueList((prevList: LeagueData[]) => prevList.map((ld: LeagueData) => {
        if (ld.league.id === leagueId) {
          return {
            ...ld,
            league: {
              ...ld.league,
              isLoading: false,
              error: errorMessage
            }
          };
        }
        return ld;
      }));
    } finally {
      setIsLoading(false);
    }
  }, [leagueList, setLeagueList, fetchLeagueData, setIsLoading, setError]);
}

function useRemoveLeague(leagueList: LeagueData[], setLeagueList: (leagues: LeagueData[] | ((prev: LeagueData[]) => LeagueData[])) => void, activeLeague: string | null, setActiveLeague: (leagueId: string | null) => void) {
  return useCallback(async (leagueId: string) => {
    const updatedLeagueList = leagueList.filter(leagueData => leagueData.league.id !== leagueId);
    setLeagueList(updatedLeagueList);
    if (activeLeague === leagueId) {
      setActiveLeague(null);
    }
  }, [leagueList, setLeagueList, activeLeague, setActiveLeague]);
}

function useSetActiveLeagueHandler(setActiveLeague: (leagueId: string | null) => void) {
  return useCallback(async (leagueId: string | null) => {
    setActiveLeague(leagueId);
  }, [setActiveLeague]);
}

function useRefreshLeague(leagueList: LeagueData[], setLeagueList: (leagues: LeagueData[] | ((prev: LeagueData[]) => LeagueData[])) => void, setIsLoading: (loading: boolean) => void, setError: (error: string | null) => void, fetchLeagueData: (leagueId: string, force?: boolean) => Promise<SteamLeague | { error: string }>) {
  return useCallback(async (leagueId: string) => {
    if (!findLeagueData(leagueList, leagueId)) throw new Error('League not found');
    setIsLoading(true);
    setError(null);
    try {
      setLeagueList((prevList: LeagueData[]) => prevList.map((ld: LeagueData) => {
        if (ld.league.id === leagueId) {
          return {
            ...ld,
            league: {
              ...ld.league,
              isLoading: true,
              error: undefined
            }
          };
        }
        return ld;
      }));

      const leagueResult = await fetchLeagueData(leagueId, true);
      if ('error' in leagueResult) throw new Error('Failed to refresh league data');
      
      const finalLeagueData = processLeagueData(leagueId, leagueResult.name, leagueResult);
      setLeagueList((prevList: LeagueData[]) => prevList.map((ld: LeagueData) => 
        ld.league.id === leagueId ? finalLeagueData : ld
      ));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh league';
      setError(errorMessage);
      setLeagueList((prevList: LeagueData[]) => prevList.map((ld: LeagueData) => {
        if (ld.league.id === leagueId) {
          return {
            ...ld,
            league: {
              ...ld.league,
              isLoading: false,
              error: errorMessage
            }
          };
        }
        return ld;
      }));
    } finally {
      setIsLoading(false);
    }
  }, [leagueList, setLeagueList, fetchLeagueData, setIsLoading, setError]);
}

const useLeagueOperations = (
  leagueList: LeagueData[],
  setLeagueList: (leagues: LeagueData[] | ((prev: LeagueData[]) => LeagueData[])) => void,
  activeLeague: string | null,
  setActiveLeague: (leagueId: string | null) => void,
  setIsLoading: (loading: boolean) => void,
  setError: (error: string | null) => void,
  fetchLeagueData: (leagueId: string, force?: boolean) => Promise<SteamLeague | { error: string }>
) => {
  const addLeague = useAddLeague(leagueList, setLeagueList, setIsLoading, setError, fetchLeagueData);
  const removeLeague = useRemoveLeague(leagueList, setLeagueList, activeLeague, setActiveLeague);
  const setActiveLeagueHandler = useSetActiveLeagueHandler(setActiveLeague);
  const refreshLeague = useRefreshLeague(leagueList, setLeagueList, setIsLoading, setError, fetchLeagueData);

  return {
    addLeague,
    removeLeague,
    setActiveLeague: setActiveLeagueHandler,
    refreshLeague
  };
};

const useTeamOperations = (leagueList: LeagueData[]) => {
  const getTeamsInLeague = useCallback((leagueId: string) => {
    const leagueData = findLeagueData(leagueList, leagueId);
    return leagueData?.teams || [];
  }, [leagueList]);

  const getTeamById = useCallback((leagueId: string, teamId: string) => {
    const leagueData = findLeagueData(leagueList, leagueId);
    return leagueData?.teams.find(team => team.id === teamId);
  }, [leagueList]);

  return {
    getTeamsInLeague,
    getTeamById
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
// PROVIDER COMPONENT
// ============================================================================

export const LeagueProvider: React.FC<LeagueContextProviderProps> = ({ children }) => {
  const { config, updateConfig } = useConfigContext();
  const { registerWorkflow, unregisterWorkflow } = useDataCoordinator();
  const { fetchLeagueData } = useLeagueDataFetching();
  
  const [leagueList, setLeagueList] = useState<LeagueData[]>([]);
  const [activeLeague, setActiveLeague] = useState<string | null>(null);
  const { isLoading, setIsLoading, error, setError } = useLeagueState();
  
  const { addLeague, removeLeague, setActiveLeague: setActiveLeagueHandler, refreshLeague } = useLeagueOperations(
    leagueList, setLeagueList, activeLeague, setActiveLeague, setIsLoading, setError, fetchLeagueData
  );
  const { getTeamsInLeague, getTeamById } = useTeamOperations(leagueList);
  const { clearError } = useErrorHandling(setError);

  // Persist league list and active league in config
  useEffect(() => {
    if (config.leagueList !== leagueList.map(ld => ld.league.id)) {
      updateConfig({ leagueList: leagueList.map(ld => ld.league.id) });
    }
  }, [leagueList, config.leagueList, updateConfig]);

  useEffect(() => {
    if (config.activeLeague !== activeLeague) {
      updateConfig({ activeLeague });
    }
  }, [activeLeague, config.activeLeague, updateConfig]);

  // Load persisted data on mount
  useEffect(() => {
    if (config.leagueList.length > 0) {
      // Load leagues from config
      config.leagueList.forEach(leagueId => {
        if (!findLeagueData(leagueList, leagueId)) {
          addLeague(leagueId);
        }
      });
    }
    
    if (config.activeLeague) {
      setActiveLeague(config.activeLeague);
    }
  }, []); // Only run on mount

  const contextValue: LeagueContextValue = {
    // State
    leagueList,
    activeLeague,
    isLoading,
    error,
    
    // Actions
    addLeague,
    removeLeague,
    setActiveLeague: setActiveLeagueHandler,
    refreshLeague,
    clearError,
    
    // Team operations
    getTeamsInLeague,
    getTeamById
  };

  return (
    <LeagueContext.Provider value={contextValue}>
      {children}
    </LeagueContext.Provider>
  );
};

// ============================================================================
// HYDRATION HANDLER
// ============================================================================

export const LeagueHydrationHandler: React.FC = () => {
  const { config } = useConfigContext();
  const { addLeague, setActiveLeague } = useContext(LeagueContext)!;
  
  useEffect(() => {
    if (config.leagueList.length > 0) {
      config.leagueList.forEach(leagueId => {
        addLeague(leagueId);
      });
    }
    
    if (config.activeLeague) {
      setActiveLeague(config.activeLeague);
    }
  }, [config.leagueList, config.activeLeague, addLeague, setActiveLeague]);

  return null;
};

// ============================================================================
// CUSTOM HOOK
// ============================================================================

export const useLeagueContext = (): LeagueContextValue => {
  const context = useContext(LeagueContext);
  if (!context) {
    throw new Error('useLeagueContext must be used within a LeagueProvider');
  }
  return context;
}; 