import React from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useConstantsContext } from '@/contexts/constants-context';
import { useMatchContext } from '@/contexts/match-context';
import { useTeamContext } from '@/contexts/team-context';
import type { Player } from '@/types/contexts/player-context-value';
import { processPlayerDetailedStats } from '@/utils/player-statistics';

import { HeroAvatar } from '../../match-history/common/HeroAvatar';

interface PlayerDetailsPanelTeamProps {
  player: Player;
  allPlayers?: Player[];
  hiddenPlayerIds?: Set<number>;
}

// Helper function to render hero with avatar
const renderHeroWithAvatar = (hero: any) => (
  <div className="flex items-center space-x-2">
    <HeroAvatar 
      hero={hero.hero}
      avatarSize={{ width: 'w-6', height: 'h-6' }}
    />
    <span className="text-muted-foreground dark:text-muted-foreground">
      {hero.hero.localizedName}
    </span>
  </div>
);

export const PlayerDetailsPanelTeam: React.FC<PlayerDetailsPanelTeamProps> = React.memo(({
  player,
  allPlayers = [],
  hiddenPlayerIds = new Set<number>(),
}) => {
  const { heroes } = useConstantsContext();
  const { matches } = useMatchContext();
  const { getSelectedTeam } = useTeamContext();
  
  const selectedTeam = getSelectedTeam();
  const matchesArray = Array.from(matches.values());
  
  // Debug logging
  console.log('PlayerDetailsPanelTeam Debug:', {
    selectedTeam,
    matchesCount: matchesArray.length,
    playerId: player.profile.profile.account_id,
    playerName: player.profile.profile.personaname,
    // Check if we have any matches loaded
    hasMatches: matchesArray.length > 0,
    // Log the first match structure if available
    firstMatch: matchesArray[0] ? {
      id: matchesArray[0].id,
      hasPlayers: !!matchesArray[0].players,
      hasRadiantPlayers: !!matchesArray[0].players?.radiant,
      hasDirePlayers: !!matchesArray[0].players?.dire,
      radiantPlayerCount: matchesArray[0].players?.radiant?.length || 0,
      direPlayerCount: matchesArray[0].players?.dire?.length || 0
    } : null
  });
  
  // Get team match participation data
  const teamMatches = selectedTeam?.matches || {};
  
  // Process team-specific statistics
  const teamStats = selectedTeam ? 
    processPlayerDetailedStats(player, selectedTeam, matchesArray, heroes) : 
    null;
  
  // Filter team matches to only include games where the player participated
  const playerParticipatedMatches = matchesArray.filter(match => {
    // Check if match.players exists and has the expected structure
    if (!match.players || !match.players.radiant || !match.players.dire) {
      console.log('Match missing players data:', match.id);
      return false;
    }
    
    // Get the team's side for this match
    const teamMatch = teamMatches[match.id];
    if (!teamMatch || !teamMatch.side) {
      console.log('No team side data for match:', match.id);
      return false;
    }
    
    // Debug: Log the first few matches to see the structure
    if (match === matchesArray[0]) {
      console.log('First match analysis:', {
        matchId: match.id,
        teamSide: teamMatch.side,
        radiantPlayers: match.players.radiant.slice(0, 3).map(p => ({
          accountId: p.accountId,
          playerName: p.playerName
        })),
        direPlayers: match.players.dire.slice(0, 3).map(p => ({
          accountId: p.accountId,
          playerName: p.playerName
        }))
      });
      console.log('Looking for player ID:', player.profile.profile.account_id, 'type:', typeof player.profile.profile.account_id);
      
      // Debug: Log ALL player IDs in the first match
      console.log('All player IDs in first match:', {
        radiant: match.players.radiant.map(p => ({ accountId: p.accountId, name: p.playerName })),
        dire: match.players.dire.map(p => ({ accountId: p.accountId, name: p.playerName }))
      });
    }
    
    // Check if player is in the team's side
    const teamPlayers = teamMatch.side === 'radiant' ? match.players.radiant : match.players.dire;
    const playerInMatch = teamPlayers.some(p => {
      const matchFound = p.accountId === player.profile.profile.account_id;
      if (match === matchesArray[0] && matchFound) {
        console.log('Player FOUND in team side:', {
          matchId: match.id,
          teamSide: teamMatch.side,
          playerId: player.profile.profile.account_id,
          playerName: p.playerName
        });
      }
      return matchFound;
    });
    
    if (match.id === matchesArray[0]?.id) {
      console.log('Checking first match for player:', {
        matchId: match.id,
        teamSide: teamMatch.side,
        playerId: player.profile.profile.account_id,
        playerInMatch,
        // Check if any player has the same ID in the team's side
        hasMatchingId: teamPlayers.some(p => p.accountId === player.profile.profile.account_id)
      });
    }
    
    if (!playerInMatch) {
      console.log('Player not found in match:', match.id, 'team side:', teamMatch.side);
    } else {
      console.log('Player FOUND in match:', match.id, 'team side:', teamMatch.side);
    }
    return playerInMatch;
  });

  // Calculate team stats based only on games where player participated
  const playerTeamStats = selectedTeam && playerParticipatedMatches.length > 0 ? {
    totalGames: playerParticipatedMatches.length,
    totalWins: playerParticipatedMatches.filter(match => {
      // Check if match.players exists
      if (!match.players) {
        return false;
      }
      const playerInMatch = (match.players.radiant?.find(p => p.accountId === player.profile.profile.account_id) ||
                            match.players.dire?.find(p => p.accountId === player.profile.profile.account_id));
      if (!playerInMatch) return false;
      
      // Determine if the player's team won
      const playerTeamSide = match.players.radiant?.some(p => p.accountId === player.profile.profile.account_id) ? 'radiant' : 'dire';
      return playerTeamSide === match.result;
    }).length,
    winRate: 0, // Will calculate below
    averageKDA: 0, // Will calculate below
    averageGPM: 0, // Will calculate below
    averageXPM: 0 // Will calculate below
  } : null;

  // Calculate averages
  if (playerTeamStats) {
    playerTeamStats.winRate = playerTeamStats.totalGames > 0 ? 
      (playerTeamStats.totalWins / playerTeamStats.totalGames) * 100 : 0;

    let totalKDA = 0;
    let totalGPM = 0;
    let totalXPM = 0;
    let matchCount = 0;

    playerParticipatedMatches.forEach(match => {
      // Check if match.players exists
      if (!match.players) {
        return;
      }
      const playerInMatch = (match.players.radiant?.find(p => p.accountId === player.profile.profile.account_id) ||
                            match.players.dire?.find(p => p.accountId === player.profile.profile.account_id));
      if (playerInMatch && playerInMatch.stats?.kills !== undefined && playerInMatch.stats?.deaths !== undefined && playerInMatch.stats?.assists !== undefined) {
        const kda = playerInMatch.stats.deaths > 0 ? 
          (playerInMatch.stats.kills + playerInMatch.stats.assists) / playerInMatch.stats.deaths : 
          playerInMatch.stats.kills + playerInMatch.stats.assists;
        totalKDA += kda;
        totalGPM += playerInMatch.stats.gpm || 0;
        totalXPM += playerInMatch.stats.xpm || 0;
        matchCount++;
      }
    });

    playerTeamStats.averageKDA = matchCount > 0 ? totalKDA / matchCount : 0;
    playerTeamStats.averageGPM = matchCount > 0 ? totalGPM / matchCount : 0;
    playerTeamStats.averageXPM = matchCount > 0 ? totalXPM / matchCount : 0;
  }

  // Debug logging for player participation
  console.log('Player participation debug:', {
    totalMatches: matchesArray.length,
    playerParticipatedMatches: playerParticipatedMatches.length,
    playerTeamStats: !!playerTeamStats,
    selectedTeam: !!selectedTeam,
    firstMatchId: matchesArray[0]?.id,
    firstMatchHasPlayers: !!matchesArray[0]?.players
  });

  // Show different messages based on the situation
  const getNoDataMessage = () => {
    if (!selectedTeam) {
      return "No team data available. Select a team to view team statistics.";
    }
    
    if (matchesArray.length === 0) {
      return "No matches loaded. Add matches to the team to see statistics.";
    }
    
    if (playerParticipatedMatches.length === 0) {
      return "No matches found where this player participated. Add matches to the team to see statistics.";
    }
    
    return "No team statistics available.";
  };

  return (
    <div className="space-y-6">
      {/* Team Overview */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground dark:text-foreground">Team Overview</h3>
        {selectedTeam ? (
          playerTeamStats ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground dark:text-muted-foreground">Games Played</div>
                <div className="text-foreground dark:text-foreground">{playerTeamStats.totalGames}</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground dark:text-muted-foreground">Win Rate</div>
                <div className="text-foreground dark:text-foreground">{playerTeamStats.winRate.toFixed(1)}%</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground dark:text-muted-foreground">Avg KDA</div>
                <div className="text-foreground dark:text-foreground">{playerTeamStats.averageKDA.toFixed(2)}</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground dark:text-muted-foreground">Avg GPM</div>
                <div className="text-foreground dark:text-foreground">{playerTeamStats.averageGPM.toFixed(0)}</div>
              </div>
            </div>
          ) : (
            <div className="text-center p-6 bg-muted dark:bg-muted rounded-lg">
              <p className="text-muted-foreground dark:text-muted-foreground">
                {getNoDataMessage()}
              </p>
              {matchesArray.length === 0 && (
                <p className="text-sm text-muted-foreground dark:text-muted-foreground mt-2">
                  Debug: {matchesArray.length} matches loaded, {playerParticipatedMatches.length} matches with player participation
                </p>
              )}
            </div>
          )
        ) : (
          <div className="text-center p-6 bg-muted dark:bg-muted rounded-lg">
            <p className="text-muted-foreground dark:text-muted-foreground">
              No team data available. Select a team to view team statistics.
            </p>
          </div>
        )}
      </div>

      {/* Team Roles */}
      {teamStats && teamStats.teamRoles.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground dark:text-foreground">Team Roles</h3>
          <div className="grid grid-cols-2 gap-4">
            {teamStats.teamRoles.map((role, index) => (
              <div key={index} className="space-y-2">
                <div className="text-sm font-semibold text-foreground dark:text-foreground">{role.role}</div>
                <div className="text-sm text-muted-foreground dark:text-muted-foreground">{role.games} Games • {role.winRate.toFixed(1)}% Win Rate</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Team Heroes */}
      {teamStats && teamStats.teamHeroes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground dark:text-foreground">Team Heroes</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rank</TableHead>
                  <TableHead>Hero</TableHead>
                  <TableHead className="text-center">Games</TableHead>
                  <TableHead className="text-center">Win Rate</TableHead>
                  <TableHead className="text-center">Roles</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teamStats.teamHeroes.map((hero, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-semibold text-foreground dark:text-foreground">{index + 1}</TableCell>
                    <TableCell>
                      {renderHeroWithAvatar(hero)}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="font-semibold text-foreground dark:text-foreground">{hero.games}</div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="font-semibold text-foreground dark:text-foreground">{hero.winRate.toFixed(1)}%</div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="font-semibold text-foreground dark:text-foreground">
                        {hero.roles.filter((role: string) => role !== 'Unknown').join(', ')}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}


    </div>
  );
});

PlayerDetailsPanelTeam.displayName = 'PlayerDetailsPanelTeam'; 