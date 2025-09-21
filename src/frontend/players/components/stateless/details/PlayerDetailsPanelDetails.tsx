import React, { useMemo, useState } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { HeroAvatar } from '@/frontend/matches/components/stateless/common/HeroAvatar';
import type { Hero } from '@/types/contexts/constants-context-value';
import type { Player } from '@/types/contexts/player-context-value';
import type { OpenDotaPlayerMatches } from '@/types/external-apis';

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

type DateRangeSelection = '7days' | '30days' | 'custom';

function getDateCutoffs(
  selection: DateRangeSelection,
  custom: { start: string | null; end: string | null },
): { startCutoffSec: number | null; endCutoffSec: number | null; referenceNowSec: number } {
  // Presets should represent whole calendar days ending yesterday (local time),
  // so they align with the Custom date inputs that are inclusive of full days.
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const yesterdayEnd = new Date(todayStart);
  yesterdayEnd.setMilliseconds(-1); // 23:59:59.999 of the previous day

  const yesterdayEndSec = Math.floor(yesterdayEnd.getTime() / 1000);

  if (selection === '7days') {
    const start = new Date(todayStart);
    start.setDate(start.getDate() - 7);
    return {
      startCutoffSec: Math.floor(start.getTime() / 1000),
      endCutoffSec: yesterdayEndSec,
      referenceNowSec: Math.floor(now.getTime() / 1000),
    };
  }
  if (selection === '30days') {
    const start = new Date(todayStart);
    start.setDate(start.getDate() - 30);
    return {
      startCutoffSec: Math.floor(start.getTime() / 1000),
      endCutoffSec: yesterdayEndSec,
      referenceNowSec: Math.floor(now.getTime() / 1000),
    };
  }
  let startCutoffSec: number | null = null;
  let endCutoffSec: number | null = null;
  if (custom.start) {
    // Interpret start as the start of the selected day in local time
    const startDate = new Date(custom.start);
    startDate.setHours(0, 0, 0, 0);
    startCutoffSec = Math.floor(startDate.getTime() / 1000);
  }
  if (custom.end) {
    // Interpret end as the end of the selected day inclusively in local time
    const endDate = new Date(custom.end);
    endDate.setHours(23, 59, 59, 999);
    endCutoffSec = Math.floor(endDate.getTime() / 1000);
  }
  return { startCutoffSec, endCutoffSec, referenceNowSec: Math.floor(now.getTime() / 1000) };
}

function filterMatchesByDateRange(
  matches: OpenDotaPlayerMatches[],
  cutoffs: { startCutoffSec: number | null; endCutoffSec: number | null },
): OpenDotaPlayerMatches[] {
  const { startCutoffSec, endCutoffSec } = cutoffs;
  return matches.filter((m) => {
    if (startCutoffSec !== null && m.start_time < startCutoffSec) return false;
    if (endCutoffSec !== null && m.start_time > endCutoffSec) return false;
    return true;
  });
}

function buildHeroRows(
  filtered: OpenDotaPlayerMatches[],
  heroesMap: Record<string, Hero>,
): Array<{ hero: Hero; games: number; winRate: number }> {
  const byHero: Record<string, { games: number; wins: number }> = {};
  for (const match of filtered) {
    const heroId = match.hero_id.toString();
    const isRadiantPlayer = match.player_slot < 128;
    const isWin = match.radiant_win ? isRadiantPlayer : !isRadiantPlayer;
    if (!byHero[heroId]) byHero[heroId] = { games: 0, wins: 0 };
    byHero[heroId].games += 1;
    if (isWin) byHero[heroId].wins += 1;
  }
  return Object.entries(byHero)
    .map(([heroId, agg]) => {
      const hero =
        heroesMap[heroId] ||
        ({
          id: heroId,
          name: `npc_dota_hero_${heroId}`,
          localizedName: `Hero ${heroId}`,
          primaryAttribute: 'strength',
          attackType: 'melee',
          roles: [],
          imageUrl: '',
        } as Hero);
      const winRate = agg.games > 0 ? (agg.wins / agg.games) * 100 : 0;
      return { hero, games: agg.games, winRate };
    })
    .filter(Boolean) as Array<{ hero: Hero; games: number; winRate: number }>;
}

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
  _allPlayers?: Player[];
  _hiddenPlayerIds?: Set<number>;
  heroes: Record<string, Hero>;
}

export const PlayerDetailsPanelDetails: React.FC<PlayerDetailsPanelDetailsProps> = React.memo(({ player, heroes }) => {
  const [sortKey] = useState<SortKey>('games');
  const [sortDirection] = useState<'asc' | 'desc'>('desc');
  const [dateRange, setDateRange] = useState<DateRangeSelection>('30days');
  const [customDateRange, setCustomDateRange] = useState<{ start: string | null; end: string | null }>({
    start: null,
    end: null,
  });

  const matches = useMemo(() => {
    return Array.isArray(player.recentMatches) ? (player.recentMatches as OpenDotaPlayerMatches[]) : [];
  }, [player.recentMatches]);

  const cutoffs = useMemo(() => getDateCutoffs(dateRange, customDateRange), [dateRange, customDateRange]);

  const filteredMatches = useMemo(() => filterMatchesByDateRange(matches, cutoffs), [matches, cutoffs]);

  const unsortedRows = useMemo(() => buildHeroRows(filteredMatches, heroes), [filteredMatches, heroes]);

  const rows = useMemo(() => {
    const comparator = (
      a: { hero: Hero; games: number; winRate: number },
      b: { hero: Hero; games: number; winRate: number },
    ) => {
      if (sortKey === 'name') return a.hero.localizedName.localeCompare(b.hero.localizedName);
      if (sortKey === 'games') return b.games - a.games;
      return b.winRate - a.winRate;
    };
    const sorted = [...unsortedRows].sort(comparator);
    return sortDirection === 'asc' ? sorted.reverse() : sorted;
  }, [unsortedRows, sortKey, sortDirection]);

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
          <CardTitle className="text-lg font-semibold text-foreground dark:text-foreground truncate">
            Hero Statistics
          </CardTitle>
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
