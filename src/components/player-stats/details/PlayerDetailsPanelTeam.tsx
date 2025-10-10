import { ChevronDown, ChevronUp } from 'lucide-react';
import React, { useMemo, useState } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useConstantsContext } from '@/contexts/constants-context';
import { useMatchContext } from '@/contexts/match-context';
import { useTeamContext } from '@/contexts/team-context';
import type { Player } from '@/types/contexts/player-context-value';
import { processPlayerDetailedStats, type TeamHeroStats } from '@/utils/player-statistics';

import { HeroAvatar } from '../../match-history/common/HeroAvatar';

interface PlayerDetailsPanelTeamProps {
  player: Player;
  allPlayers?: Player[];
  hiddenPlayerIds?: Set<number>;
}

// Helper function to render hero with avatar
const renderHeroWithAvatar = (hero: TeamHeroStats) => (
  <div className="flex items-center space-x-2 min-w-0 w-full">
    <HeroAvatar 
      hero={hero.hero}
      avatarSize={{ width: 'w-6', height: 'h-6' }}
    />
    <span className="text-muted-foreground dark:text-muted-foreground @[335px]:block hidden truncate flex-1">
      {hero.hero.localizedName}
    </span>
  </div>
);

type SortKey = 'games' | 'winRate' | 'name';

function compareStrings(a: string, b: string): number {
  return a.localeCompare(b, undefined, { sensitivity: 'base' });
}

function createComparator(sortKey: SortKey, sortDirection: 'asc' | 'desc') {
  return (a: TeamHeroStats, b: TeamHeroStats) => {
    let result = 0;
    if (sortKey === 'games') {
      result = a.games - b.games;
    } else if (sortKey === 'winRate') {
      result = a.winRate - b.winRate;
    } else if (sortKey === 'name') {
      result = compareStrings(a.hero.localizedName, b.hero.localizedName);
    }
    return sortDirection === 'asc' ? result : -result;
  };
}

function getWinRateBarColor(winRate: number): string {
  if (winRate >= 80) {
    return 'bg-primary';
  } else if (winRate >= 50) {
    return 'bg-blue-500';
  } else {
    return 'bg-yellow-600';
  }
}

function abbreviateRole(role: string): string {
  const normalized = role.trim().toLowerCase();
  switch (normalized) {
    case 'offlane':
      return 'O';
    case 'carry':
      return 'C';
    case 'hard support':
      return 'HS';
    case 'support':
      return 'S';
    case 'mid':
      return 'M';
    default:
      // Fallback: keep original or first letter if unknown mapping
      return role;
  }
}

export const PlayerDetailsPanelTeam: React.FC<PlayerDetailsPanelTeamProps> = React.memo(({ player }) => {
  const { heroes } = useConstantsContext();
  const { matches } = useMatchContext();
  const { getSelectedTeam } = useTeamContext();
  
  const selectedTeam = getSelectedTeam();
  const matchesArray = Array.from(matches.values());
  
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
      return false;
    }
    
    // Get the team's side for this match
    const teamMatch = teamMatches[match.id];
    if (!teamMatch || !teamMatch.side) {
      return false;
    }
    
    // Check if player is in the team's side
    const teamPlayers = teamMatch.side === 'radiant' ? match.players.radiant : match.players.dire;
    const playerInMatch = teamPlayers.some(p => {
      const matchFound = p.accountId === player.profile.profile.account_id;
      return matchFound;
    });
    
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

  // Show different messages based on the situation
  const getNoDataMessage = () => {
    if (!selectedTeam) {
      return "No team data available. Select a team to view team statistics.";
    }
    
    if (matchesArray.length === 0) {
      return "No matches loaded. Add matches to the team to see statistics.";
    }
    
    if (playerParticipatedMatches.length === 0) {
      return "No matches found where this player participated.";
    }
    
    return "No team statistics available.";
  };

  // Sorting state for Team Heroes table
  const [sortKey, setSortKey] = useState<SortKey>('games');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const onHeaderClick = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDirection('desc');
    }
  };

  const sortedTeamHeroes: TeamHeroStats[] = useMemo(() => {
    if (!teamStats) return [] as TeamHeroStats[];
    return [...teamStats.teamHeroes].sort(createComparator(sortKey, sortDirection));
  }, [teamStats, sortKey, sortDirection]);

  // Compute per-hero role counts from the player's participated matches
  const getRoleCountsForHero = (heroId: string | number): Map<string, number> => {
    const counts = new Map<string, number>();
    const heroIdStr = heroId.toString();
    playerParticipatedMatches.forEach(match => {
      if (!match.players) return;
      const radiantPlayer = match.players.radiant.find(p => p.accountId === player.profile.profile.account_id);
      const direPlayer = match.players.dire.find(p => p.accountId === player.profile.profile.account_id);
      const matchPlayer = radiantPlayer || direPlayer;
      if (!matchPlayer || !matchPlayer.hero) return;
      const matchHeroId = String(matchPlayer.hero.id);
      if (matchHeroId !== heroIdStr) return;
      const role = (matchPlayer.role || 'Unknown') as string;
      const prev = counts.get(role) || 0;
      counts.set(role, prev + 1);
    });
    return counts;
  };

  // No grid needed for Team Roles; render as vertical list

  return (
    <div className="space-y-6">
      {/* Team Overview */}
      <div className="space-y-4 min-w-0 @container">
        <h3 className="@[110px]:block hidden text-lg font-semibold text-foreground dark:text-foreground truncate">Team Overview</h3>
        {selectedTeam ? (
          playerTeamStats ? (
            <>
              {/* Placeholder to keep layout stable for header below 110px (match text-lg line-height 28px) */}
              <div className="@[110px]:hidden block h-[28px]" aria-hidden="true" />
              <div className="grid grid-cols-1 @[280px]:grid-cols-2 @[340px]:grid-cols-3 @[400px]:grid-cols-4 gap-4">
                {/* Placeholder only below 110px when no metrics are visible to avoid layout shift */}
                <div className="space-y-2 h-[52px] @[110px]:hidden block" aria-hidden="true">
                  <div className="text-sm text-muted-foreground dark:text-muted-foreground truncate">&nbsp;</div>
                  <div className="text-foreground dark:text-foreground">&nbsp;</div>
                </div>
              <div className="space-y-2 min-w-0 h-[52px] @[110px]:block hidden">
                <div className="text-sm text-muted-foreground dark:text-muted-foreground truncate">Games Played</div>
                <div className="text-foreground dark:text-foreground">{playerTeamStats.totalGames}</div>
              </div>
              <div className="space-y-2 h-[52px] @[280px]:block hidden">
                <div className="text-sm text-muted-foreground dark:text-muted-foreground">Win Rate</div>
                <div className="text-foreground dark:text-foreground">{playerTeamStats.winRate.toFixed(1)}%</div>
              </div>
              <div className="space-y-2 h-[52px] @[340px]:block hidden">
                <div className="text-sm text-muted-foreground dark:text-muted-foreground">Avg KDA</div>
                <div className="text-foreground dark:text-foreground">{playerTeamStats.averageKDA.toFixed(2)}</div>
              </div>
              {/* Last metric: Avg GPM – hide slightly earlier and provide a placeholder to keep layout stable */}
              <div className="space-y-2 h-[52px] @[420px]:block hidden">
                <div className="text-sm text-muted-foreground dark:text-muted-foreground">Avg GPM</div>
                <div className="text-foreground dark:text-foreground">{playerTeamStats.averageGPM.toFixed(0)}</div>
              </div>
              {/* Placeholder only between 400px–420px when the 4th metric is hidden */}
              <div className="space-y-2 h-[52px] hidden @[400px]:block @[420px]:hidden" aria-hidden="true">
                <div className="text-sm text-muted-foreground dark:text-muted-foreground truncate">&nbsp;</div>
                <div className="text-foreground dark:text-foreground">&nbsp;</div>
              </div>
              </div>
            </>
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
        <div className="space-y-4 min-w-0 @container" style={{ containerType: 'inline-size' }}>
          <h3 className="@[35px]:block hidden text-lg font-semibold text-foreground dark:text-foreground truncate">Team Roles</h3>
          <ul role="list" className="space-y-2">
            {teamStats.teamRoles.slice(0, 5).map((role, index) => (
              <li key={index} className="text-sm text-foreground dark:text-foreground flex items-center min-w-0">
                <span className="@[35px]:inline hidden font-semibold truncate flex-1 min-w-0">{role.role}</span>
                <span className="@[165px]:inline hidden ml-2 text-muted-foreground dark:text-muted-foreground flex-shrink-0">
                  <span className="@[280px]:inline hidden">
                    {role.games} Games <span className="mx-1" aria-hidden="true">•</span> {role.winRate.toFixed(1)}% Win Rate
                  </span>
                  <span className="@[280px]:hidden inline">
                    {role.games} <span className="mx-1" aria-hidden="true">•</span> {role.winRate.toFixed(1)}%
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Team Heroes */}
      {teamStats && teamStats.teamHeroes.length > 0 && (
        <Card className="@container">
          <CardHeader className="min-w-0">
            <CardTitle className="text-lg font-semibold text-foreground dark:text-foreground truncate">Team Heroes</CardTitle>
          </CardHeader>
          <CardContent className="min-w-0">
            <Table className="table-fixed w-full">
              <TableHeader>
                <TableRow>
                  <TableHead
                    className="truncate"
                    role="columnheader"
                    aria-sort={sortKey === 'name' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                  >
                    <div
                      className="flex items-center cursor-pointer hover:bg-muted/50 rounded px-1"
                      onClick={() => onHeaderClick('name')}
                    >
                      <span>Hero</span>
                      {sortKey === 'name' ? (
                        sortDirection === 'asc' ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />
                      ) : (
                        <div className="w-3 h-3 ml-1" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="text-center @[340px]:table-cell hidden">
                    Roles
                  </TableHead>
                  <TableHead
                    className="text-center @[260px]:table-cell hidden"
                    role="columnheader"
                    aria-sort={sortKey === 'games' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                  >
                    <div
                      className="flex items-center justify-center cursor-pointer hover:bg-muted/50 rounded px-1"
                      onClick={() => onHeaderClick('games')}
                    >
                      <span className="flex-1 text-center">Games</span>
                      {sortKey === 'games' ? (
                        sortDirection === 'asc' ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />
                      ) : (
                        <div className="w-3 h-3 ml-1" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead
                    className="text-right @[205px]:table-cell hidden"
                    role="columnheader"
                    aria-sort={sortKey === 'winRate' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                  >
                    <div
                      className="flex items-center justify-end cursor-pointer hover:bg-muted/50 rounded px-1"
                      onClick={() => onHeaderClick('winRate')}
                    >
                      <span>Win Rate</span>
                      {sortKey === 'winRate' ? (
                        sortDirection === 'asc' ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />
                      ) : (
                        <div className="w-3 h-3 ml-1" />
                      )}
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedTeamHeroes.map((hero: TeamHeroStats, index: number) => (
                  <TableRow key={`${hero.hero.id}-${index}`}>
                    <TableCell className="min-w-0">
                      {renderHeroWithAvatar(hero)}
                    </TableCell>
                    <TableCell className="text-center @[340px]:table-cell hidden">
                      <div className="flex flex-wrap items-center justify-center gap-1 max-w-full min-w-0">
                        {(() => {
                          const roleCounts = getRoleCountsForHero(hero.hero.id);
                          const entries = Array.from(roleCounts.entries())
                            .filter(([role]) => role !== 'Unknown')
                            .map(([role, count]) => ({ label: `${abbreviateRole(role)} (${count})`, key: role }));
                          return entries.length > 0 ? entries.map(({ label, key }) => (
                            <span
                              key={key}
                              className="inline-flex items-center whitespace-nowrap rounded bg-muted px-1.5 py-0.5 text-xs font-medium text-foreground dark:text-foreground"
                            >
                              {label}
                            </span>
                          )) : (
                            <span className="text-muted-foreground dark:text-muted-foreground text-xs">—</span>
                          );
                        })()}
                      </div>
                    </TableCell>
                    <TableCell className="text-center @[260px]:table-cell hidden">
                      <div className="font-semibold text-foreground dark:text-foreground">{hero.games}</div>
                    </TableCell>
                    <TableCell className="text-right @[205px]:table-cell hidden">
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-xs text-muted-foreground">{hero.winRate.toFixed(1)}%</span>
                        <div className="w-12">
                          <Progress value={hero.winRate} indicatorClassName={getWinRateBarColor(hero.winRate)} />
                        </div>
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