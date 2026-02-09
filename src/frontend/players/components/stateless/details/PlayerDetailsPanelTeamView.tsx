import React, { useMemo } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAppData } from '@/frontend/contexts/app-data-context';
import type { TeamRoleStats, TeamPlayerDetailStats } from '@/frontend/lib/app-data/app-data-statistics-ops';
import type { Player } from '@/frontend/lib/app-data/app-data-types';
import type { HeroStats } from '@/frontend/lib/player/player-statistics-calculator';
import { HeroAvatar } from '@/frontend/matches/components/stateless/common/HeroAvatar';

interface PlayerDetailsPanelTeamProps {
  player: Player;
}

// PlayerTeamStats type matches TeamPlayerStats from player-statistics-calculator
type PlayerTeamStats = {
  totalGames: number;
  totalWins: number;
  winRate: number;
  averageKDA: number;
  averageGPM: number;
  averageXPM: number;
};

function getWinRateBarColor(winRate: number): string {
  if (winRate >= 80) return 'bg-primary';
  if (winRate >= 50) return 'bg-blue-500';
  return 'bg-yellow-600';
}

function PlayerOverviewMetrics({ stats }: { stats: PlayerTeamStats }) {
  return (
    <div className="grid grid-cols-1 @[280px]:grid-cols-2 @[340px]:grid-cols-3 @[400px]:grid-cols-4 gap-4">
      <div className="space-y-2 @[110px]:block hidden">
        <div className="text-sm text-muted-foreground dark:text-muted-foreground">Games Played</div>
        <div className="text-foreground dark:text-foreground">{stats.totalGames}</div>
      </div>
      <div className="space-y-2 @[280px]:block hidden">
        <div className="text-sm text-muted-foreground dark:text-muted-foreground">Win Rate</div>
        <div className="text-foreground dark:text-foreground">{stats.winRate.toFixed(1)}%</div>
      </div>
      <div className="space-y-2 @[340px]:block hidden">
        <div className="text-sm text-muted-foreground dark:text-muted-foreground">Avg KDA</div>
        <div className="text-foreground dark:text-foreground">{stats.averageKDA.toFixed(2)}</div>
      </div>
      <div className="space-y-2 @[420px]:block hidden">
        <div className="text-sm text-muted-foreground dark:text-muted-foreground">Avg GPM</div>
        <div className="text-foreground dark:text-foreground">{stats.averageGPM.toFixed(0)}</div>
      </div>
    </div>
  );
}

function TeamRolesSection({ teamRoles }: { teamRoles: TeamRoleStats[] }) {
  if (teamRoles.length === 0) return null;
  return (
    <div className="space-y-4 min-w-0 @container">
      <h3 className="@[35px]:block hidden text-lg font-semibold text-foreground dark:text-foreground truncate">
        Team Roles
      </h3>
      <ul role="list" className="space-y-2">
        {teamRoles.slice(0, 5).map((role, index) => (
          <li key={index} className="text-sm text-foreground dark:text-foreground flex items-center min-w-0">
            <span className="@[35px]:inline hidden font-semibold truncate flex-1 min-w-0">{role.role}</span>
            <span className="@[165px]:inline hidden ml-2 text-muted-foreground dark:text-muted-foreground shrink-0">
              <span className="@[280px]:inline hidden">
                {role.games} Games{' '}
                <span className="mx-1" aria-hidden="true">
                  •
                </span>{' '}
                {role.winRate.toFixed(1)}% Win Rate
              </span>
              <span className="@[280px]:hidden inline">
                {role.games}{' '}
                <span className="mx-1" aria-hidden="true">
                  •
                </span>{' '}
                {role.winRate.toFixed(1)}%
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function TeamHeroesSection({ heroesData }: { heroesData: HeroStats[] }) {
  if (!heroesData || heroesData.length === 0) return null;
  return (
    <Card className="@container">
      <CardHeader className="min-w-0">
        <CardTitle className="text-lg font-semibold text-foreground dark:text-foreground truncate">
          Team Heroes
        </CardTitle>
      </CardHeader>
      <CardContent className="min-w-0">
        <Table className="table-fixed w-full">
          <TableHeader>
            <TableRow>
              <TableHead className="truncate">Hero</TableHead>
              <TableHead className="text-center @[340px]:table-cell hidden">Roles</TableHead>
              <TableHead className="text-center @[260px]:table-cell hidden">Games</TableHead>
              <TableHead className="text-right @[205px]:table-cell hidden">Win Rate</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {heroesData.map((hero: HeroStats, index: number) => {
              const roleCounts = new Map<string, number>();
              (hero.roles || []).forEach((r) => {
                const current = roleCounts.get(r) || 0;
                roleCounts.set(r, current + 1);
              });
              const entries = Array.from(roleCounts.entries()).map(([role, count]) => ({
                label: `${role} (${count})`,
                key: role,
              }));
              return (
                <TableRow key={`${hero.hero.id}-${index}`}>
                  <TableCell className="min-w-0">
                    <div className="flex items-center space-x-2 min-w-0 w-full">
                      <HeroAvatar hero={hero.hero} avatarSize={{ width: 'w-6', height: 'h-6' }} />
                      <span className="text-muted-foreground dark:text-muted-foreground @[335px]:block hidden truncate flex-1">
                        {hero.hero.localizedName}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center @[340px]:table-cell hidden">
                    <div className="flex flex-wrap items-center justify-center gap-1 max-w-full min-w-0">
                      {entries.length > 0 ? (
                        entries.map(({ label, key }) => (
                          <span
                            key={key}
                            className="inline-flex items-center whitespace-nowrap rounded bg-muted px-1.5 py-0.5 text-xs font-medium text-foreground dark:text-foreground"
                          >
                            {label}
                          </span>
                        ))
                      ) : (
                        <span className="text-muted-foreground dark:text-muted-foreground text-xs">—</span>
                      )}
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
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export const PlayerDetailsPanelTeam: React.FC<PlayerDetailsPanelTeamProps> = React.memo(({ player }) => {
  const appData = useAppData();
  const selectedTeamId = appData.state.selectedTeamId;

  console.log('[PlayerDetailsPanelTeam] Component rendering:', {
    accountId: player.accountId,
    selectedTeamId,
    playerRecentMatchIdsCount: player.recentMatchIds.length,
  });

  // Get team-specific player stats from AppData
  const playerTeamStats = useMemo(() => {
    const stats = appData.getTeamPlayerStats(player.accountId, selectedTeamId);
    console.log('[PlayerDetailsPanelTeam] getTeamPlayerStats result:', {
      accountId: player.accountId,
      selectedTeamId,
      stats,
      totalGames: stats.totalGames,
      totalWins: stats.totalWins,
      winRate: stats.winRate,
    });
    // Return null if no games (matches AppData behavior)
    const result = stats.totalGames > 0 ? stats : null;
    console.log('[PlayerDetailsPanelTeam] playerTeamStats (final):', {
      isNull: result === null,
      stats: result,
    });
    return result;
    // Dependencies:
    // - appData: access to methods
    // - player.accountId: re-run when player changes
    // - selectedTeamId: re-run when selected team changes
    // - appData.matches: re-run when matches change (triggered by updateMatchesRef)
    // - appData.teams: re-run when teams change (triggered by updateTeamsRef)
    // Intentional: use appData.matches/teams ref updates to refresh this memo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appData, player.accountId, selectedTeamId, appData.matches, appData.teams]);

  const teamDetailStats: TeamPlayerDetailStats = useMemo(() => {
    const stats = appData.getTeamPlayerDetailStats(player.accountId, selectedTeamId);
    console.log('[PlayerDetailsPanelTeam] getTeamPlayerDetailStats result:', {
      accountId: player.accountId,
      selectedTeamId,
      teamRolesCount: stats.teamRoles.length,
      teamHeroesCount: stats.teamHeroes.length,
      teamRoles: stats.teamRoles.slice(0, 5),
      teamHeroes: stats.teamHeroes.slice(0, 5).map((hero) => ({
        heroName: hero.hero.localizedName,
        games: hero.games,
      })),
    });
    return stats;
    // Dependencies:
    // - appData: access to methods
    // - player.accountId: re-run when player changes
    // - selectedTeamId: re-run when selected team changes
    // - appData.matches: re-run when matches change (triggered by updateMatchesRef)
    // - appData.teams: re-run when teams change (triggered by updateTeamsRef)
    // Intentional: use appData.matches/teams ref updates to refresh this memo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appData, player.accountId, selectedTeamId, appData.matches, appData.teams]);

  return (
    <div className="space-y-6">
      <div className="space-y-4 min-w-0 @container">
        <h3 className="@[110px]:block hidden text-lg font-semibold text-foreground dark:text-foreground truncate">
          Team Overview
        </h3>
        {playerTeamStats ? (
          <>
            <div className="@[110px]:hidden block h-[28px]" aria-hidden="true" />
            <PlayerOverviewMetrics stats={playerTeamStats} />
          </>
        ) : (
          <div className="text-center p-6 bg-muted dark:bg-muted rounded-lg">
            <p className="text-muted-foreground dark:text-muted-foreground">No team statistics available.</p>
          </div>
        )}
      </div>

      <TeamRolesSection teamRoles={teamDetailStats.teamRoles} />
      <TeamHeroesSection heroesData={teamDetailStats.teamHeroes} />
    </div>
  );
});

PlayerDetailsPanelTeam.displayName = 'PlayerDetailsPanelTeam';
