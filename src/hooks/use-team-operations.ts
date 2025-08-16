import React, { useCallback } from 'react';

import type { TeamDataFetchingContextValue } from '@/contexts/team-data-fetching-context';
import { abortTeamLeagueOperations, createTeamLeagueOperationKey, useAbortController, type AbortControllerManager } from '@/hooks/use-abort-controller';
import { processMatchAndExtractPlayers } from '@/lib/processing/team-processing';
import type { ConfigContextValue } from '@/types/contexts/config-context-value';
import type { Match, MatchContextValue } from '@/types/contexts/match-context-value';
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
    manualMatches: {},
    manualPlayers: [],
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
    manualMatches: {},
    manualPlayers: [],
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
    
    // Update state with fetched data, preserving existing manualMatches and manualPlayers
    setTeams(prev => {
      const newTeams = new Map(prev);
      const existingTeam = newTeams.get(teamKey);
      
      // Preserve existing manualMatches if they exist
      if (existingTeam?.manualMatches) {
        transformedTeam.manualMatches = { ...existingTeam.manualMatches };
        
        // Also add manual matches back to the matches object so they appear in the UI
        Object.entries(existingTeam.manualMatches).forEach(([matchId, matchData]) => {
          const matches = transformedTeam.matches as Record<string, any>;
          if (!matches[matchId]) {
            matches[matchId] = {
              matchId: parseInt(matchId),
              result: 'lost',
              duration: 0,
              opponentName: 'Unknown',
              leagueId: transformedTeam.league.id,
              startTime: Date.now(),
              side: matchData.side, // Use the original side from manual match data
              pickOrder: null
            };
          }
        });
      }
      
      // Preserve existing manualPlayers (and ensure their entries remain in players list)
      if (existingTeam?.manualPlayers) {
        const manualArray = Array.isArray(existingTeam.manualPlayers)
          ? existingTeam.manualPlayers
          : Object.keys(existingTeam.manualPlayers).map(id => Number(id));
        transformedTeam.manualPlayers = [...manualArray];
        if (existingTeam.players?.length) {
          const manualPlayerIds = new Set(manualArray);
          const manualPlayers = existingTeam.players.filter(p => manualPlayerIds.has(p.accountId));
          // Merge manual players with any players discovered from matches, de-duplicated by accountId
          const combinedById = new Map<number, typeof manualPlayers[number]>();
          manualPlayers.forEach(p => combinedById.set(p.accountId, p));
          transformedTeam.players.forEach(p => combinedById.set(p.accountId, p));
          transformedTeam.players = Array.from(combinedById.values());
        }
      }
      
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
  teams: Map<string, TeamData>,
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
    
    setTeams(prev => {
      const newTeams = new Map(prev);
      const team = newTeams.get(teamKey);
      
      if (team) {
        // Check if match already exists in team's matches
        const matchExists = matchId in team.matches;
        
        if (!matchExists) {
          // Create team match entry - either with full data or optimistic data
          let teamMatch: TeamMatchParticipation;
          
          if (match && !match.isLoading && !match.error) {
            // We have full match data
            const result = match.result === teamSide ? 'won' : 'lost';
            const startTime = new Date(match.date).getTime();
            const opponentName = teamSide === 'radiant' ? match.radiant?.name : match.dire?.name;
            const pickOrder = match.pickOrder?.[teamSide] || null;

            teamMatch = {
              matchId,
              result,
              duration: match.duration,
              opponentName: opponentName || '',
              leagueId: selectedTeamId.leagueId.toString(),
              startTime,
              side: teamSide,
              pickOrder,
            };
          } else {
            // We have optimistic data or the match is still loading
            const startTime = Date.now(); // Use current time for optimistic match
            const opponentName = match?.isLoading ? 'Loading...' : 'Unknown';
            
            teamMatch = {
              matchId,
              result: 'lost', // Use 'lost' as default for optimistic matches
              duration: 0,
              opponentName,
              leagueId: selectedTeamId.leagueId.toString(),
              startTime,
              side: teamSide,
              pickOrder: null,
            };
          }
          
          // Add new match to team's matches record
          team.matches[matchId] = teamMatch;
          
          // Add to manual matches for persistence
          if (!team.manualMatches) {
            team.manualMatches = {};
          }
          team.manualMatches[matchId] = { side: teamSide };
          
          newTeams.set(teamKey, {
            ...team,
            matches: team.matches,
            manualMatches: team.manualMatches
          });
        } else {
        }
      } else {
      }
      
      return newTeams;
    });
    
    // If we don't have match data yet, don't throw an error
    // The optimistic match will be updated when real data arrives
    if (!match) {
    }
  }, [selectedTeamId, matchContext, setTeams]);

  // Update team match when real match data arrives
  const updateTeamMatchFromMatch = useCallback((matchId: number, match: Match) => {
    if (!selectedTeamId) return;
    
    const teamKey = generateTeamKey(selectedTeamId.teamId, selectedTeamId.leagueId);
    const team = teams.get(teamKey);
    const teamMatch = team?.matches[matchId];
    
    if (teamMatch && !match.isLoading && !match.error) {
      // Update the team match with real data
      const teamSide = teamMatch.side as 'radiant' | 'dire' | null;
      const result = teamSide ? (match.result === teamSide ? 'won' : 'lost') : teamMatch.result;
      const startTime = new Date(match.date).getTime();
      const opponentName = teamSide === 'radiant' ? match.radiant?.name : teamSide === 'dire' ? match.dire?.name : teamMatch.opponentName;
      const pickOrder = teamSide ? (match.pickOrder?.[teamSide] || null) : teamMatch.pickOrder;

      setTeams(prev => {
        const newTeams = new Map(prev);
        const team = newTeams.get(teamKey);
        
        if (team && team.matches[matchId]) {
          team.matches[matchId] = {
            ...team.matches[matchId],
            result,
            duration: match.duration,
            opponentName: opponentName || '',
            startTime,
            pickOrder,
          };
          
          newTeams.set(teamKey, {
            ...team,
            matches: team.matches
          });
        }
        
        return newTeams;
      });
    }
  }, [selectedTeamId, teams, setTeams]);

  // Watch for match updates and update team matches accordingly
  React.useEffect(() => {
    if (!selectedTeamId) return;
    
    const teamKey = generateTeamKey(selectedTeamId.teamId, selectedTeamId.leagueId);
    const team = teams.get(teamKey);
    
    if (!team) return;
    
    // Check each match in the team and update if real data is available
    Object.keys(team.matches).forEach(matchIdStr => {
      const matchId = parseInt(matchIdStr, 10);
      const match = matchContext.getMatch(matchId);
      const teamMatch = team.matches[matchId];
      
      if (match && teamMatch && (teamMatch.opponentName === 'Loading...' || teamMatch.opponentName === 'Unknown') && !match.isLoading && !match.error) {
        updateTeamMatchFromMatch(matchId, match);
      }
    });
  }, [selectedTeamId, teams, matchContext, updateTeamMatchFromMatch]);

  // Add player to team
  const addPlayerToTeam = useCallback(async (playerId: number) => {
    if (!selectedTeamId) {
      throw new Error('No active team selected');
    }
    
    const teamKey = generateTeamKey(selectedTeamId.teamId, selectedTeamId.leagueId);
    const player = await playerContext.addPlayer(playerId);

    setTeams(prev => {
      const newTeams = new Map(prev);
      const team = newTeams.get(teamKey);
      if (team) {
        // Ensure manualPlayers is updated and persisted regardless of player fetch success
        const existingManual = Array.isArray(team.manualPlayers)
          ? team.manualPlayers
          : Object.keys(team.manualPlayers || {}).map(n => Number(n));
        const updatedManualPlayers = Array.from(new Set([...existingManual, playerId]));

        let updatedPlayers = team.players;
        if (player) {
          const playerExists = updatedPlayers.some(p => p.accountId === player.profile.profile.account_id);
          if (!playerExists) {
            const newTeamPlayer = {
              accountId: player.profile.profile.account_id,
              playerName: player.profile.profile.personaname || 'Unknown Player',
              roles: [],
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
            updatedPlayers = [...updatedPlayers, newTeamPlayer];
          }
        }

        newTeams.set(teamKey, {
          ...team,
          players: updatedPlayers,
          manualPlayers: updatedManualPlayers
        });
      }
      return newTeams;
    });
  }, [selectedTeamId, playerContext, setTeams]);

  // Remove manual player from team and persist
  const removeManualPlayer = useCallback((playerId: number) => {
    if (!selectedTeamId) return;
    const teamKey = generateTeamKey(selectedTeamId.teamId, selectedTeamId.leagueId);
    setTeams(prev => {
      const newTeams = new Map(prev);
      const team = newTeams.get(teamKey);
      if (team) {
        // Remove from manualPlayers
        const manual = Array.isArray(team.manualPlayers) ? team.manualPlayers : Object.keys(team.manualPlayers || {}).map(n => Number(n));
        team.manualPlayers = manual.filter(id => id !== playerId);
        // Remove from team players list
        team.players = team.players.filter(p => p.accountId !== playerId);
        newTeams.set(teamKey, { ...team });
      }
      return newTeams;
    });
    // Also remove from global player context so it disappears from list
    playerContext.removePlayer(playerId);
  }, [selectedTeamId, setTeams, playerContext]);

  // Edit manual player ID (update array and team players list)
  const editManualPlayer = useCallback(async (oldPlayerId: number, newPlayerId: number) => {
    if (!selectedTeamId) return;
    const teamKey = generateTeamKey(selectedTeamId.teamId, selectedTeamId.leagueId);
    setTeams(prev => {
      const newTeams = new Map(prev);
      const team = newTeams.get(teamKey);
      if (team) {
        const manual = Array.isArray(team.manualPlayers) ? team.manualPlayers : Object.keys(team.manualPlayers || {}).map(n => Number(n));
        // If new id already present, just remove old one
        const nextManual = Array.from(new Set([...manual.filter(id => id !== oldPlayerId), newPlayerId]));
        team.manualPlayers = nextManual;
        // Update players list: replace old accountId entry if present
        team.players = team.players.map(p => p.accountId === oldPlayerId ? { ...p, accountId: newPlayerId } : p)
          .filter((p, idx, arr) => arr.findIndex(x => x.accountId === p.accountId) === idx);
        newTeams.set(teamKey, { ...team });
      }
      return newTeams;
    });
    // Trigger player fetch for new id and remove old from global context
    await playerContext.addPlayer(newPlayerId);
    // Defer removal of old id slightly to avoid flicker where neither id exists
    setTimeout(() => {
      try {
        playerContext.removePlayer(oldPlayerId);
      } catch (_e) {
        // no-op
      }
    }, 50);
  }, [selectedTeamId, setTeams, playerContext]);

  return { addMatchToTeam, addPlayerToTeam, removeManualPlayer, editManualPlayer };
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
  const { addMatchToTeam, addPlayerToTeam, removeManualPlayer, editManualPlayer } = useTeamSpecificOperations(selectedTeamId, teams, setTeams, matchContext, playerContext);

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
        const matchProcessingPromises = Object.values(transformedTeam.matches).map(match => {
          // Check if this is a manual match by looking up the team's manual matches
          const teamKey = generateTeamKey(teamId, leagueId);
          const team = teams.get(teamKey);
          const isManualMatch = team?.manualMatches?.[match.matchId];
          const knownSide = isManualMatch?.side;
          
          return processMatchAndExtractPlayers(
            match.matchId, 
            teamId, 
            matchContext, 
            playerContext,
            knownSide
          );
        });
        
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

  // Load manual matches after normal team loading
  const loadManualMatches = useCallback(async () => {
    // Process manual matches to ensure they have corresponding team match participation records
    const manualMatches = new Set<number>();
    
    teams.forEach((teamData, teamKey) => {
      if (teamData.manualMatches) {
        Object.entries(teamData.manualMatches).forEach(([matchId, manualMatch]) => {
          const matchIdNum = parseInt(matchId, 10);
          manualMatches.add(matchIdNum);
          
          // If this manual match doesn't have a corresponding team match participation record,
          // create an optimistic entry
          if (!teamData.matches[matchIdNum]) {
            // Create optimistic team match entry
            const optimisticMatch: TeamMatchParticipation = {
              matchId: matchIdNum,
              result: 'lost', // Default for optimistic matches
              duration: 0,
              opponentName: 'Loading...',
              leagueId: teamData.league.id.toString(),
              startTime: Date.now(),
              side: manualMatch.side,
              pickOrder: null,
            };
            
            // Update the team data with the optimistic match
            setTeams(prev => {
              const newTeams = new Map(prev);
              const team = newTeams.get(teamKey);
              if (team) {
                team.matches[matchIdNum] = optimisticMatch;
                newTeams.set(teamKey, { ...team });
              }
              return newTeams;
            });
          }
        });
      }
    });
    
    // Add manual matches to match context for data fetching
    for (const matchId of manualMatches) {
      await matchContext.addMatch(matchId);
    }
  }, [teams, setTeams, matchContext]);

  // Load manual players after team loading
  const loadManualPlayers = useCallback(async () => {
    const manualPlayerIds = new Set<number>();
    teams.forEach((teamData) => {
      if (Array.isArray(teamData.manualPlayers)) {
        teamData.manualPlayers.forEach(id => manualPlayerIds.add(id));
      } else if (teamData.manualPlayers && typeof teamData.manualPlayers === 'object') {
        // Back-compat if legacy object shape is encountered in-memory
        Object.keys(teamData.manualPlayers).forEach(id => manualPlayerIds.add(Number(id)));
      }
    });
    for (const playerId of manualPlayerIds) {
      await playerContext.addPlayer(playerId);
    }
  }, [teams, playerContext]);

  // Remove manual match from team
  const removeManualMatch = useCallback((matchId: number) => {
    if (!selectedTeamId) return;
    
    const teamKey = generateTeamKey(selectedTeamId.teamId, selectedTeamId.leagueId);
    
    setTeams(prev => {
      const newTeams = new Map(prev);
      const team = newTeams.get(teamKey);
      
      if (team) {
        // Remove from manual matches
        if (team.manualMatches) {
          delete team.manualMatches[matchId];
        }
        
        // Remove from matches
        if (team.matches) {
          delete team.matches[matchId];
        }
        
        newTeams.set(teamKey, { ...team });
      }
      
      return newTeams;
    });
  }, [selectedTeamId, setTeams]);

  // Edit manual match in team
  const editManualMatch = useCallback(async (oldMatchId: number, newMatchId: number, teamSide: 'radiant' | 'dire') => {
    
    if (!selectedTeamId) {
      return;
    }
    
    const teamKey = generateTeamKey(selectedTeamId.teamId, selectedTeamId.leagueId);
    const team = teams.get(teamKey);
    
    if (!team) {
      return;
    }
    
    // Validate that new match ID is not already in use
    if (oldMatchId !== newMatchId) {
      // Check if new match ID already exists in manual matches
      if (team.manualMatches && newMatchId in team.manualMatches) {
        throw new Error(`Match ${newMatchId} is already added as a manual match`);
      }
      
      // Check if new match ID already exists in regular matches
      if (team.matches && newMatchId in team.matches) {
        throw new Error(`Match ${newMatchId} is already in the team's match history`);
      }
    }
    
    // Update team data first
    setTeams(prev => {
      const newTeams = new Map(prev);
      const team = newTeams.get(teamKey);
      
      if (team) {
        // Remove old match from manual matches
        if (team.manualMatches) {
          delete team.manualMatches[oldMatchId];
        }
        
        // Remove old match from matches
        if (team.matches) {
          delete team.matches[oldMatchId];
        }
        
        // Add new match to manual matches
        if (!team.manualMatches) {
          team.manualMatches = {};
        }
        team.manualMatches[newMatchId] = { side: teamSide };
        
        // Also add to regular matches for the match list to pick it up
        if (!team.matches) {
          team.matches = {};
        }
        team.matches[newMatchId] = {
          matchId: newMatchId,
          result: 'lost', // Set to 'lost' so it gets updated when real data arrives
          duration: 0,
          opponentName: 'Loading...',
          leagueId: team.league.id.toString(),
          startTime: Date.now(),
          side: teamSide,
          pickOrder: null,
        };
        
        newTeams.set(teamKey, { ...team });
      }
      
      return newTeams;
    });
    
    // Handle match context updates after state update
    if (oldMatchId !== newMatchId) {
      // Only remove old match if ID changed
      matchContext.removeMatch(oldMatchId);
      // Add new match and await the result
      const newMatch = await matchContext.addMatch(newMatchId);
    } else {
      // If only team side changed, just refresh the match
      const refreshedMatch = await matchContext.refreshMatch(newMatchId);
    }
  }, [selectedTeamId, setTeams, matchContext, teams]);

  return {
    // Core operations
    addTeam,
    refreshTeam,
    removeTeam,
    editTeam,
    
    // Team-specific operations
    addMatchToTeam,
    addPlayerToTeam,
    removeManualPlayer,
    editManualPlayer,
    removeManualMatch,
    editManualMatch,
    
    // Team list management
    setTeams,
    loadTeamsFromConfig,
    loadManualMatches,
    loadManualPlayers,
    
    // Data access
    setSelectedTeamId: setSelectedTeam,
    clearSelectedTeamId: clearSelectedTeam,
    getTeam,
    getSelectedTeam,
    getAllTeams,
  };
} 