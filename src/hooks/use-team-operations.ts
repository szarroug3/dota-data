import { useCallback } from 'react';

import type { TeamDataFetchingContextValue } from '@/contexts/team-data-fetching-context';
import { abortTeamLeagueOperations, createTeamLeagueOperationKey, useAbortController, type AbortControllerManager } from '@/hooks/use-abort-controller';
import { processMatchAndExtractPlayers } from '@/lib/processing/team-processing';
import type { ConfigContextValue } from '@/types/contexts/config-context-value';
import type { MatchContextValue } from '@/types/contexts/match-context-value';
import type { PlayerContextValue } from '@/types/contexts/player-context-value';
import type { TeamData, TeamMatchParticipation, TeamState } from '@/types/contexts/team-context-value';
import type { DotabuffLeague, DotabuffTeam } from '@/types/external-apis';
import { updateMapItemError } from '@/utils/error-handling';
import { clearMapItemLoading, setMapItemLoading } from '@/utils/loading-state';
import { generateTeamKey } from '@/utils/team-helpers';

// ============================================================================
// HELPER FUNCTIONS FOR TEAM OPERATIONS
// ============================================================================

/**
 * Create error team data
 */
function createErrorTeamData(teamId: number, leagueId: number, error: string): TeamData {
  return {
    team: {
      id: teamId,
      name: `Team ${teamId}`
    },
    league: {
      id: leagueId,
      name: `League ${leagueId}`
    },
    timeAdded: new Date().toISOString(),
    error,
    matches: {},
    players: [],
    performance: {
      totalMatches: 0,
      totalWins: 0,
      totalLosses: 0,
      overallWinRate: 0,
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
      averageMatchDuration: 0,
      averageKills: 0,
      averageDeaths: 0,
      averageGold: 0,
      averageExperience: 0
    }
  };
}

/**
 * Transform DotabuffTeam and DotabuffLeague to TeamData
 */
function transformTeamData(teamId: number, leagueId: number, dotabuffTeam: DotabuffTeam, dotabuffLeague?: { name: string }): TeamData {
  const matchesArray = Object.values(dotabuffTeam.matches);
  
  return {
    team: {
      id: teamId,
      name: dotabuffTeam.name
    },
    league: {
      id: leagueId,
      name: dotabuffLeague?.name || `League ${leagueId}` // Use actual league name if available
    },
    timeAdded: new Date().toISOString(),
    matches: (() => {
      const matches: Record<number, TeamMatchParticipation> = {};
      Object.entries(dotabuffTeam.matches).forEach(([matchId, match]) => {
        matches[Number(matchId)] = {
          ...match,
          side: null, // Will be determined from match data
          pickOrder: null, // Will be determined from match data
        };
      });
      return matches;
    })(),
    players: [], // Will be populated from match data
    performance: {
      totalMatches: matchesArray.length,
      totalWins: matchesArray.filter((m) => m.result === 'won').length,
      totalLosses: matchesArray.filter((m) => m.result === 'lost').length,
      overallWinRate: matchesArray.length > 0 
        ? matchesArray.filter((m) => m.result === 'won').length / matchesArray.length 
        : 0,
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
      averageMatchDuration: matchesArray.reduce((sum: number, m) => sum + m.duration, 0) / matchesArray.length || 0,
      averageKills: 0,
      averageDeaths: 0,
      averageGold: 0,
      averageExperience: 0
    }
  };
}

/**
 * Handle error cases for team data operation
 */
function handleTeamDataErrors(
  teamId: number,
  leagueId: number,
  teamData: DotabuffTeam | { error: string },
  leagueData: DotabuffLeague | { error: string },
  teamKey: string,
  setTeams: React.Dispatch<React.SetStateAction<Map<string, TeamData>>>
): boolean {
  const teamError = 'error' in teamData ? teamData.error : null;
  const leagueError = 'error' in leagueData ? leagueData.error : null;
  
  if (teamError && leagueError) {
    // Both failed - create error team
    const errorTeam = createErrorTeamData(teamId, leagueId, 'Failed to fetch team and league');
    setTeams(prev => {
      const newTeams = new Map(prev);
      newTeams.set(teamKey, errorTeam);
      return newTeams;
    });
    return true;
  } else if (teamError) {
    // Only team failed - use league data if available
    const errorTeam = createErrorTeamData(teamId, leagueId, 'Failed to fetch team');
    errorTeam.league.name = (leagueData as DotabuffLeague).name;
    setTeams(prev => {
      const newTeams = new Map(prev);
      newTeams.set(teamKey, errorTeam);
      return newTeams;
    });
    return true;
  } else if (leagueError) {
    // Only league failed - use team data if available
    const transformedTeam = transformTeamData(teamId, leagueId, teamData as DotabuffTeam, undefined);
    transformedTeam.error = 'Failed to fetch league';
      setTeams(prev => {
        const newTeams = new Map(prev);
        newTeams.set(teamKey, transformedTeam);
        return newTeams;
      });
    return true;
  }
  
  return false;
}

// ============================================================================
// TEAM DATA OPERATIONS
// ============================================================================

/**
 * Handle team summary data fetching and processing
 */
async function handleTeamSummaryOperation(
  teamId: number,
  leagueId: number,
  force: boolean,
  operationKey: string,
  abortController: AbortControllerManager,
  teamDataFetching: TeamDataFetchingContextValue,
  setTeams: React.Dispatch<React.SetStateAction<Map<string, TeamData>>>
): Promise<TeamData | null> {
  const teamKey = generateTeamKey(teamId, leagueId);
  
  // Check if there's already an ongoing operation for this team
  if (abortController.hasOngoingOperation(operationKey)) {
    return null;
  }

  // Get abort controller for this operation
  const controller = abortController.getAbortController(operationKey);

  try {
    // Fetch team and league data in parallel
    const [teamData, leagueData] = await Promise.all([
      teamDataFetching.fetchTeamData(teamId, force),
      teamDataFetching.fetchLeagueData(leagueId, force)
    ]);
    
    // Check if operation was aborted during fetch
    if (controller.signal.aborted) {
      return null;
    }
    
    // Handle any errors
    if (handleTeamDataErrors(teamId, leagueId, teamData, leagueData, teamKey, setTeams)) {
      return null;
    }
    
    // Both succeeded - transform data
    const transformedTeam = transformTeamData(teamId, leagueId, teamData as DotabuffTeam, leagueData as DotabuffLeague);
    
    // Update state with fetched data
    setTeams(prev => {
      const newTeams = new Map(prev);
      newTeams.set(teamKey, transformedTeam);
      return newTeams;
    });
    
    return transformedTeam;
    
  } catch (err) {
    // Only handle actual errors, not aborts
    if (!controller.signal.aborted) {
      console.error('Failed to add team:', err);
    }
    return null;
  } finally {
    // Clean up abort controller
    abortController.cleanupAbortController(operationKey);
  }
}

// ============================================================================
// TEAM STATE OPERATIONS
// ============================================================================

/**
 * Handle team selection operations
 */
function useTeamSelectionOperations(
  setSelectedTeamId: (team: { teamId: number; leagueId: number } | null) => void,
  configContext: ConfigContextValue
) {
  const setSelectedTeam = useCallback((teamId: number, leagueId: number) => {
    setSelectedTeamId({ teamId, leagueId });
    configContext.setActiveTeam({ teamId, leagueId });
  }, [setSelectedTeamId, configContext]);

  const clearSelectedTeam = useCallback(() => {
    setSelectedTeamId(null);
    configContext.setActiveTeam(null);
  }, [setSelectedTeamId, configContext]);

  return { setSelectedTeam, clearSelectedTeam };
}

/**
 * Handle team data access operations
 */
function useTeamDataAccessOperations(
  teams: Map<string, TeamData>,
  selectedTeamId: { teamId: number; leagueId: number } | null
) {
  const getTeam = useCallback((teamId: number, leagueId: number) => {
    const key = generateTeamKey(teamId, leagueId);
    return teams.get(key);
  }, [teams]);

  const getSelectedTeam = useCallback(() => {
    if (!selectedTeamId) return undefined;
    return getTeam(selectedTeamId.teamId, selectedTeamId.leagueId);
  }, [selectedTeamId, getTeam]);

  const getAllTeams = useCallback(() => {
    return Array.from(teams.values()).sort((a, b) => new Date(b.timeAdded).getTime() - new Date(a.timeAdded).getTime());
  }, [teams]);

  return { getTeam, getSelectedTeam, getAllTeams };
}

/**
 * Handle team-specific operations
 */
function useTeamSpecificOperations(
  selectedTeamId: { teamId: number; leagueId: number } | null,
  setTeams: React.Dispatch<React.SetStateAction<Map<string, TeamData>>>,
  matchContext: MatchContextValue,
  playerContext: PlayerContextValue
) {
  // Add match to team
  const addMatchToTeam = useCallback(async (matchId: number, teamSide: 'radiant' | 'dire') => {
    if (!selectedTeamId) {
      throw new Error('No active team selected');
    }
    
    const teamKey = generateTeamKey(selectedTeamId.teamId, selectedTeamId.leagueId);
    const match = matchContext.getMatch(matchId);
    
    if (match) {
      const result = match?.result === teamSide ? 'won' : 'lost';
      const startTime = new Date(match.date).getTime();
      const opponentName = teamSide === 'radiant' ? match?.radiant.name : match?.dire.name;
      const pickOrder = match.pickOrder?.[teamSide] || null;

      setTeams(prev => {
        const newTeams = new Map(prev);
        const team = newTeams.get(teamKey);
        
        if (team) {
          // Check if match already exists in team's matches
          const matchExists = matchId in team.matches;
          
          if (!matchExists) {
            // Add new match to team's matches record
            team.matches[matchId] = {
              matchId,
              result,
              duration: match.duration,
              opponentName: opponentName || '',
              leagueId: selectedTeamId.leagueId.toString(),
              startTime,
              side: teamSide,
              pickOrder,
            };
            
            newTeams.set(teamKey, {
              ...team,
              matches: team.matches
            });
          }
        }
        
        return newTeams;
      });
    }
  }, [selectedTeamId, matchContext, setTeams]);

  // Add player to team
  const addPlayerToTeam = useCallback(async (playerId: number) => {
    if (!selectedTeamId) {
      throw new Error('No active team selected');
    }
    
    const teamKey = generateTeamKey(selectedTeamId.teamId, selectedTeamId.leagueId);
    const player = await playerContext.addPlayer(playerId);
    
    if (player) {
      setTeams(prev => {
        const newTeams = new Map(prev);
        const team = newTeams.get(teamKey);
        
        if (team) {
          // Check if player already exists in team's players
          const playerExists = team.players.some(p => p.accountId === player.profile.profile.account_id);
          
          if (!playerExists) {
            // Add new player to team's players list
            const newTeamPlayer = {
              accountId: player.profile.profile.account_id,
              playerName: player.profile.profile.personaname || 'Unknown Player',
              roles: [], // Will be populated based on match data
              totalMatches: 0,
              totalWins: 0,
              totalLosses: 0,
              winRate: 0,
              averageKDA: 0,
              averageGPM: 0,
              averageXPM: 0,
              averageLastHits: 0,
              averageDenies: 0
            };
            
            newTeams.set(teamKey, {
              ...team,
              players: [...team.players, newTeamPlayer]
            });
          }
        }
        
        return newTeams;
      });
    }
  }, [selectedTeamId, playerContext, setTeams]);

  return { addMatchToTeam, addPlayerToTeam };
}

// ============================================================================
// HOOKS
// ============================================================================

export function useTeamOperations(
  state: TeamState,
  teamDataFetching: TeamDataFetchingContextValue,
  matchContext: MatchContextValue,
  playerContext: PlayerContextValue,
  configContext: ConfigContextValue
) {
  const { teams, setTeams, setTeamsForLoading, selectedTeamId, setSelectedTeamId } = state;
  const abortController = useAbortController();

  // Team selection operations
  const { setSelectedTeam, clearSelectedTeam } = useTeamSelectionOperations(setSelectedTeamId, configContext);

  // Team data access operations
  const { getTeam, getSelectedTeam, getAllTeams } = useTeamDataAccessOperations(teams, selectedTeamId);

  // Team-specific operations
  const { addMatchToTeam, addPlayerToTeam } = useTeamSpecificOperations(selectedTeamId, setTeams, matchContext, playerContext);

  // Add team
  const addTeam = useCallback(async (teamId: number, leagueId: number, force = false): Promise<void> => {
    const operationKey = createTeamLeagueOperationKey(teamId, leagueId);
    const teamKey = generateTeamKey(teamId, leagueId);
    
    // Check if team already exists (unless force is true)
    if (!force && teams.has(teamKey)) {
      return;
    }

    // Set loading state (use non-persisting setter)
    setMapItemLoading(setTeamsForLoading, teamKey);

    try {
      // Step 1: Fetch summary data (use persisting setter for team data)
      const transformedTeam = await handleTeamSummaryOperation(teamId, leagueId, false, operationKey, abortController, teamDataFetching, setTeams);

      // Step 2: If summary succeeded, set the team as active and process full data
      if (transformedTeam && !transformedTeam.error) {
        setSelectedTeam(teamId, leagueId);
        
        // Process each match to get full data
        const matchProcessingPromises = Object.values(transformedTeam.matches).map(match => 
          processMatchAndExtractPlayers(match.matchId, teamId, matchContext, playerContext)
        );
        
        const processedMatches = await Promise.all(matchProcessingPromises);
        
        // Update team data with processed match participation data
        setTeams(prev => {
          const newTeams = new Map(prev);
          const team = newTeams.get(teamKey);
          
          if (team) {
            // Update matches with processed data
            const updatedMatches: Record<number, TeamMatchParticipation> = { ...team.matches };
            
            processedMatches.forEach((processedMatch, index) => {
              if (processedMatch) {
                const originalMatch = Object.values(transformedTeam.matches)[index];
                updatedMatches[originalMatch.matchId] = processedMatch;
              }
            });
            
            newTeams.set(teamKey, {
              ...team,
              matches: updatedMatches
            });
          }
          
          return newTeams;
        });
      }
    } catch (error) {
      // Handle errors using the error handling utilities
      const errorMessage = error instanceof Error ? error.message : 'Failed to add team';
      updateMapItemError(setTeams, teamKey, errorMessage);
    } finally {
      // Clear loading state (use non-persisting setter)
      clearMapItemLoading(setTeamsForLoading, teamKey);
    }
  }, [teams, teamDataFetching, setTeams, setTeamsForLoading, abortController, matchContext, playerContext, setSelectedTeam]);

  // Refresh team
  const refreshTeam = useCallback(async (teamId: number, leagueId: number): Promise<void> => {
    const operationKey = createTeamLeagueOperationKey(teamId, leagueId);
    await handleTeamSummaryOperation(teamId, leagueId, true, operationKey, abortController, teamDataFetching, setTeams);
  }, [teamDataFetching, setTeams, abortController]);

  // Remove team
  const removeTeam = useCallback((teamId: number, leagueId: number) => {
    const teamKey = generateTeamKey(teamId, leagueId);
    
    // ABORT ONGOING OPERATIONS: Abort any ongoing operations for this team
    abortTeamLeagueOperations(abortController, teamId, leagueId);
    
    setTeams((prev: Map<string, TeamData>) => {
      const newTeams = new Map(prev);
      newTeams.delete(teamKey);
      return newTeams;
    });
    
    // Clear selected team if it was the removed team
    if (selectedTeamId?.teamId === teamId && selectedTeamId?.leagueId === leagueId) {
      clearSelectedTeam();
    }
  }, [selectedTeamId, setTeams, clearSelectedTeam, abortController]);

  // Edit team (add new team if doesn't exist)
  const editTeam = useCallback(async (currentTeamId: number, currentLeagueId: number, newTeamId: number, newLeagueId: number): Promise<void> => {
    // If the team is being renamed to the same ID, just update the league
    if (currentTeamId === newTeamId && currentLeagueId === newLeagueId) {
      return;
    }
    
    // Remove the old team
    removeTeam(currentTeamId, currentLeagueId);
    
    // Add the new team
    await addTeam(newTeamId, newLeagueId);
  }, [removeTeam, addTeam]);

  // Load teams from config
  const loadTeamsFromConfig = useCallback(async (teams: Map<string, TeamData>) => {
    setTeams(teams);
  }, [setTeams]);

  return {
    // Core operations
    addTeam,
    refreshTeam,
    removeTeam,
    editTeam,
    
    // Team-specific operations
    addMatchToTeam,
    addPlayerToTeam,
    
    // Team list management
    setTeams,
    loadTeamsFromConfig,
    
    // Data access
    setSelectedTeamId: setSelectedTeam,
    clearSelectedTeamId: clearSelectedTeam,
    getTeam,
    getSelectedTeam,
    getAllTeams,
  };
} 