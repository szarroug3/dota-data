import React, { useMemo } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { HeroAvatar } from '@/frontend/matches/components/stateless/common/HeroAvatar';
import type { Hero } from '@/types/contexts/constants-context-value';
import type { Match } from '@/types/contexts/match-context-value';
import type { Player } from '@/types/contexts/player-context-value';
import type { TeamData, TeamMatchParticipation } from '@/types/contexts/team-context-value';
import { processPlayerDetailedStats, type TeamHeroStats } from '@/utils/player-statistics';

interface PlayerDetailsPanelTeamProps {
  player: Player;
  _allPlayers?: Player[];
  _hiddenPlayerIds?: Set<number>;
  heroes: Record<string, Hero>;
  matchesArray: Match[];
  selectedTeam: TeamData | null | undefined;
}

type PlayerTeamStats = {
  totalGames: number;
  totalWins: number;
  winRate: number;
  averageKDA: number;
  averageGPM: number;
  averageXPM: number;
};

function getPlayerParticipatedMatches(
  matchesArray: Match[],
  teamMatches: Record<number, TeamMatchParticipation>,
  accountId: number,
) {
  return matchesArray.filter((match) => {
    if (!match.players || !match.players.radiant || !match.players.dire) return false;
    const teamMatch = teamMatches[match.id];
    if (!teamMatch || !teamMatch.side) return false;
    const teamPlayers = teamMatch.side === 'radiant' ? match.players.radiant : match.players.dire;
    return teamPlayers.some((p: { accountId: number }) => p.accountId === accountId);
  });
}

function computePlayerTeamStats(
  selectedTeam: TeamData | undefined | null,
  playerParticipatedMatches: Match[],
  accountId: number,
): PlayerTeamStats | null {
  if (!selectedTeam || playerParticipatedMatches.length === 0) return null;
  const totalGames = playerParticipatedMatches.length;
  const totalWins = playerParticipatedMatches.filter((match) => {
    if (!match.players) return false;
    const isRadiant = match.players.radiant?.some((p: { accountId: number }) => p.accountId === accountId);
    const playerTeamSide = isRadiant ? 'radiant' : 'dire';
    return playerTeamSide === match.result;
  }).length;
  return { totalGames, totalWins, winRate: 0, averageKDA: 0, averageGPM: 0, averageXPM: 0 };
}

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

function TeamRolesSection({
  teamStatsLocal,
}: {
  teamStatsLocal: { teamRoles: Array<{ role: string; games: number; winRate: number }> } | null;
}) {
  if (!teamStatsLocal || teamStatsLocal.teamRoles.length === 0) return null;
  return (
    <div className="space-y-4 min-w-0 @container">
      <h3 className="@[35px]:block hidden text-lg font-semibold text-foreground dark:text-foreground truncate">
        Team Roles
      </h3>
      <ul role="list" className="space-y-2">
        {teamStatsLocal.teamRoles.slice(0, 5).map((role, index) => (
          <li key={index} className="text-sm text-foreground dark:text-foreground flex items-center min-w-0">
            <span className="@[35px]:inline hidden font-semibold truncate flex-1 min-w-0">{role.role}</span>
            <span className="@[165px]:inline hidden ml-2 text-muted-foreground dark:text-muted-foreground flex-shrink-0">
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

function TeamHeroesSection({ heroesData }: { heroesData: TeamHeroStats[] }) {
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
            {heroesData.map((hero: TeamHeroStats, index: number) => {
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

export const PlayerDetailsPanelTeam: React.FC<PlayerDetailsPanelTeamProps> = React.memo(
  ({ player, heroes, matchesArray, selectedTeam }) => {
    const teamMatches = selectedTeam?.matches || {};
    const teamStats = selectedTeam ? processPlayerDetailedStats(player, selectedTeam, matchesArray, heroes) : null;
    const accountId = player.profile.profile.account_id;
    const playerParticipatedMatches = getPlayerParticipatedMatches(matchesArray, teamMatches, accountId);
    const playerTeamStats = computePlayerTeamStats(selectedTeam, playerParticipatedMatches, accountId);
    const sortedTeamHeroes: TeamHeroStats[] = useMemo(() => {
      if (!teamStats) return [] as TeamHeroStats[];
      return [...teamStats.teamHeroes].sort((a, b) => a.games - b.games);
    }, [teamStats]);

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

        <TeamRolesSection teamStatsLocal={teamStats} />
        <TeamHeroesSection heroesData={sortedTeamHeroes} />
      </div>
    );
  },
);

PlayerDetailsPanelTeam.displayName = 'PlayerDetailsPanelTeam';
