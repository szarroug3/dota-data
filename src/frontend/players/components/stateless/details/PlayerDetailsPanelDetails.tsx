import React, { useMemo, useState } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { HeroAvatar } from '@/frontend/matches/components/stateless/common/HeroAvatar';
import type { Hero } from '@/types/contexts/constants-context-value';
import type { Player } from '@/types/contexts/player-context-value';

type SortKey = 'games' | 'winRate' | 'name';

function getWinRateBarColor(winRate: number): string {
  if (winRate >= 80) return 'bg-primary';
  if (winRate >= 50) return 'bg-blue-500';
  return 'bg-yellow-600';
}

const renderHeroWithAvatar = (hero: Hero) => (
  <div className="flex items-center space-x-2 min-w-0 w-full">
    <HeroAvatar hero={hero} avatarSize={{ width: 'w-6', height: 'h-6' }} />
    <span className="text-muted-foreground dark:text-muted-foreground @[335px]:block hidden truncate flex-1">{hero.localizedName}</span>
  </div>
);

interface PlayerDetailsPanelDetailsProps { player: Player; _allPlayers?: Player[]; _hiddenPlayerIds?: Set<number>; heroes: Record<string, Hero>; }

export const PlayerDetailsPanelDetails: React.FC<PlayerDetailsPanelDetailsProps> = React.memo(({ player, heroes }) => {
  const [sortKey] = useState<SortKey>('games');
  const [sortDirection] = useState<'asc' | 'desc'>('desc');

  const rows = useMemo(() => {
    const data = player.heroes.map(h => {
      const hero = heroes[h.hero_id.toString()];
      const winRate = h.games > 0 ? (h.win / h.games) * 100 : 0;
      return hero ? { hero, games: h.games, winRate } : null;
    }).filter(Boolean) as Array<{ hero: Hero; games: number; winRate: number }>;
    const by = (a: { hero: Hero; games: number; winRate: number }, b: { hero: Hero; games: number; winRate: number }) => (
      sortKey === 'name' ? a.hero.localizedName.localeCompare(b.hero.localizedName) :
      sortKey === 'games' ? b.games - a.games :
      b.winRate - a.winRate
    );
    const sorted = [...data].sort(by);
    return sortDirection === 'asc' ? sorted.reverse() : sorted;
  }, [player.heroes, heroes, sortKey, sortDirection]);

  return (
    <div className="space-y-6">
      <Card className="@container">
        <CardHeader className="min-w-0">
          <CardTitle className="text-lg font-semibold text-foreground dark:text-foreground truncate">Hero Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <Table className="table-fixed w-full">
            <TableHeader>
              <TableRow>
                <TableHead className="truncate" role="columnheader">Hero</TableHead>
                <TableHead className="text-center @[260px]:table-cell hidden w-[72px]">Games</TableHead>
                <TableHead className="text-right @[205px]:table-cell hidden w-[96px]">Win Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, index) => (
                <TableRow key={`${row.hero.id}-${index}`}>
                  <TableCell className="min-w-0">{renderHeroWithAvatar(row.hero)}</TableCell>
                  <TableCell className="text-center @[260px]:table-cell hidden w-[72px]">
                    <div className="font-semibold text-foreground dark:text-foreground">{row.games}</div>
                  </TableCell>
                  <TableCell className="text-right @[205px]:table-cell hidden w-[96px]">
                    <div className="flex items-center justify-end gap-2">
                      <span className="text-xs text-muted-foreground">{row.winRate.toFixed(1)}%</span>
                      <div className="w-12">
                        <Progress value={row.winRate} indicatorClassName={getWinRateBarColor(row.winRate)} />
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
});

PlayerDetailsPanelDetails.displayName = 'PlayerDetailsPanelDetails';


