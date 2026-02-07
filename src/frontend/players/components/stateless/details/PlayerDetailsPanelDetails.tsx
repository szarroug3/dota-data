import React, { useEffect, useMemo, useState } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAppData } from '@/contexts/app-data-context';
import type { Hero, Player } from '@/frontend/lib/app-data/app-data-types';
import { HeroAvatar } from '@/frontend/matches/components/stateless/common/HeroAvatar';

type SortKey = 'games' | 'winRate' | 'name';

function getWinRateBarColor(winRate: number): string {
  if (winRate >= 80) return 'bg-primary';
  if (winRate >= 50) return 'bg-blue-500';
  return 'bg-yellow-600';
}

const renderHeroWithAvatar = (hero: Hero) => (
  <div className="flex items-center space-x-2 min-w-0 w-full">
    <HeroAvatar hero={hero} avatarSize={{ width: 'w-6', height: 'h-6' }} />
    <span className="text-muted-foreground dark:text-muted-foreground @[335px]:block hidden truncate flex-1">
      {hero.localizedName}
    </span>
  </div>
);

type DateRangeSelection = 'all' | '7days' | '30days' | 'custom';

function HeroStatsHeaderControls({
  dateRange,
  setDateRange,
  customDateRange,
  setCustomDateRange,
}: {
  dateRange: DateRangeSelection;
  setDateRange: (v: DateRangeSelection) => void;
  customDateRange: { start: string | null; end: string | null };
  setCustomDateRange: (v: { start: string | null; end: string | null }) => void;
}) {
  return (
    <div className="flex items-end gap-3">
      <div className="w-40 hidden @[145px]:block">
        <Label className="text-sm font-medium">Time Range</Label>
        <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRangeSelection)}>
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="7days">Last 7 Days</SelectItem>
            <SelectItem value="30days">Last 30 Days</SelectItem>
            <SelectItem value="custom">Custom</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="w-40 @[145px]:hidden block h-15" aria-hidden="true" />
      {dateRange === 'custom' && (
        <div className="items-end gap-3 hidden @[480px]:flex">
          <div className="flex flex-col">
            <Label className="text-sm font-medium" htmlFor="custom-start">
              Start
            </Label>
            <Input
              type="date"
              id="custom-start"
              value={customDateRange.start || ''}
              onChange={(e) => setCustomDateRange({ ...customDateRange, start: e.target.value || null })}
              className="mt-1 text-xs"
            />
          </div>
          <div className="flex flex-col">
            <Label className="text-sm font-medium" htmlFor="custom-end">
              End
            </Label>
            <Input
              type="date"
              id="custom-end"
              value={customDateRange.end || ''}
              onChange={(e) => setCustomDateRange({ ...customDateRange, end: e.target.value || null })}
              className="mt-1 text-xs"
            />
          </div>
        </div>
      )}
      {dateRange === 'custom' && <div className="hidden @[480px]:block h-15" aria-hidden="true" />}
    </div>
  );
}

interface PlayerDetailsPanelDetailsProps {
  player: Player;
}

export const PlayerDetailsPanelDetails: React.FC<PlayerDetailsPanelDetailsProps> = React.memo(({ player }) => {
  const appData = useAppData();
  const [sortKey] = useState<SortKey>('games');
  const [sortDirection] = useState<'asc' | 'desc'>('desc');
  const [dateRange, setDateRange] = useState<DateRangeSelection>('all');
  const [customDateRange, setCustomDateRange] = useState<{ start: string | null; end: string | null }>({
    start: null,
    end: null,
  });

  // Auto-refresh player if recentMatches is missing (e.g., loaded from storage before this field was added)
  useEffect(() => {
    if (player.recentMatches === undefined || player.recentMatches === null) {
      appData.refreshPlayer(player.accountId).catch((error) => {
        console.error(`Failed to refresh player ${player.accountId}:`, error);
      });
    }
  }, [appData, player.accountId, player.recentMatches]);

  const { rows, totalGames } = useMemo(() => {
    return appData.getPlayerRecentHeroRows(player.accountId, dateRange, customDateRange, sortKey, sortDirection);
  }, [appData, player.accountId, dateRange, customDateRange, sortKey, sortDirection]);

  return (
    <div className="space-y-6">
      <HeroStatsHeaderControls
        dateRange={dateRange}
        setDateRange={setDateRange}
        customDateRange={customDateRange}
        setCustomDateRange={setCustomDateRange}
      />
      <Card className="@container">
        <CardHeader className="min-w-0">
          <div className="flex items-center justify-between gap-2 min-w-0">
            <CardTitle className="text-lg font-semibold text-foreground dark:text-foreground truncate">
              Hero Statistics
            </CardTitle>
            <div className="text-sm text-muted-foreground" aria-label="Games in list">
              {totalGames} games
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table className="table-fixed w-full">
            <TableHeader>
              <TableRow>
                <TableHead className="truncate" role="columnheader">
                  Hero
                </TableHead>
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
