import { ChevronDown, ChevronUp } from 'lucide-react';
import React, { useMemo, useState } from 'react';

import { HeroAvatar } from '@/components/match-history/common/HeroAvatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useConstantsContext } from '@/contexts/constants-context';
import type { Hero } from '@/types/contexts/constants-context-value';
import type { Player } from '@/types/contexts/player-context-value';

type SortKey = 'games' | 'winRate' | 'name';

function compareStrings(a: string, b: string): number {
  return a.localeCompare(b, undefined, { sensitivity: 'base' });
}

function createComparator(sortKey: SortKey, sortDirection: 'asc' | 'desc') {
  return (a: { games: number; winRate: number; hero: Hero }, b: { games: number; winRate: number; hero: Hero }) => {
    const primary = (() => {
      switch (sortKey) {
        case 'games':
          return b.games - a.games; // default desc
        case 'winRate':
          return b.winRate - a.winRate; // default desc
        case 'name':
          return compareStrings(a.hero.localizedName, b.hero.localizedName); // default asc
      }
    })();

    if (primary !== 0) {
      return sortKey === 'name'
        ? (sortDirection === 'asc' ? primary : -primary)
        : (sortDirection === 'desc' ? primary : -primary);
    }

    // Tie-breakers: games desc > winRate desc > name asc
    const byGames = b.games - a.games;
    if (byGames !== 0) return byGames;

    const byWin = b.winRate - a.winRate;
    if (byWin !== 0) return byWin;

    return compareStrings(a.hero.localizedName, b.hero.localizedName);
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

interface DateRangeControlsProps {
  selectedDateRange: string;
  setSelectedDateRange: (v: string) => void;
  customStartDate: Date | null;
  customEndDate: Date | null;
  onCustomDateChange: (type: 'start' | 'end', value: string) => void;
}

const DateRangeControls: React.FC<DateRangeControlsProps> = ({
  selectedDateRange,
  setSelectedDateRange,
  customStartDate,
  customEndDate,
  onCustomDateChange
}) => {
  return (
    <div className="flex items-center">
      <div className="block @[250px]:hidden h-9" aria-hidden="true" />
      <div className="hidden @[250px]:flex items-center space-x-2">
        {selectedDateRange === 'custom' && (
          <div className="hidden @[490px]:block">
            <div className="flex items-center space-x-2">
              <div className="flex flex-col">
              <Label htmlFor="player-details-start-date" className="sr-only">Start Date</Label>
              <Input
                id="player-details-start-date"
                type="date"
                value={customStartDate ? customStartDate.toISOString().split('T')[0] : ''}
                onChange={(e) => onCustomDateChange('start', e.target.value)}
                className="w-36 text-xs"
              />
              </div>
              <div className="flex flex-col">
              <Label htmlFor="player-details-end-date" className="sr-only">End Date</Label>
              <Input
                id="player-details-end-date"
                type="date"
                value={customEndDate ? customEndDate.toISOString().split('T')[0] : ''}
                onChange={(e) => onCustomDateChange('end', e.target.value)}
                className="w-36 text-xs"
              />
              </div>
            </div>
          </div>
        )}

        <Select value={selectedDateRange} onValueChange={setSelectedDateRange}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DATE_RANGE_OPTIONS.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

interface StatsGridProps {
  avgKDA: number;
  avgKills: string;
  avgDeaths: string;
  avgAssists: string;
}

const StatsGrid: React.FC<StatsGridProps> = ({ avgKDA, avgKills, avgDeaths, avgAssists }) => (
  <div className="grid grid-cols-1 @[280px]:grid-cols-2 @[340px]:grid-cols-3 @[400px]:grid-cols-4 gap-4">
    <div className="space-y-2 @[110px]:block hidden">
      <div className="text-sm text-muted-foreground dark:text-muted-foreground">Avg KDA</div>
      <div className="text-foreground dark:text-foreground">{avgKDA.toFixed(2)}</div>
    </div>
    <div className="space-y-2 @[280px]:block hidden">
      <div className="text-sm text-muted-foreground dark:text-muted-foreground">Avg Kills</div>
      <div className="text-foreground dark:text-foreground">{avgKills}</div>
    </div>
    <div className="space-y-2 @[340px]:block hidden">
      <div className="text-sm text-muted-foreground dark:text-muted-foreground">Avg Deaths</div>
      <div className="text-foreground dark:text-foreground">{avgDeaths}</div>
    </div>
    <div className="space-y-2 @[400px]:block hidden">
      <div className="text-sm text-muted-foreground dark:text-muted-foreground">Avg Assists</div>
      <div className="text-foreground dark:text-foreground">{avgAssists}</div>
    </div>
  </div>
);

interface HeroRowData {
  hero: Hero;
  games: number;
  wins: number;
  winRate: number;
  withGames: number;
  withWins: number;
  againstGames: number;
  againstWins: number;
}

interface HeroStatisticsTableProps {
  rows: HeroRowData[];
  sortKey: SortKey;
  sortDirection: 'asc' | 'desc';
  onHeaderClick: (key: SortKey) => void;
}

const HeroStatisticsTable: React.FC<HeroStatisticsTableProps> = ({ rows, sortKey, sortDirection, onHeaderClick }) => (
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
        <TableHead
          className="text-center @[260px]:table-cell hidden w-[72px]"
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
          className="text-right @[205px]:table-cell hidden w-[96px]"
          role="columnheader"
          aria-sort={sortKey === 'winRate' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
        >
          <div
            className="flex items-center justify-end cursor-pointer hover:bg-muted/50 rounded px-1"
            onClick={() => onHeaderClick('winRate')}
          >
            <span className="">Win Rate</span>
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
      {rows.map((row, index) => (
        <TableRow key={`${row.hero.id}-${index}`}>
          <TableCell className="min-w-0">
            {renderHeroWithAvatar(row.hero)}
          </TableCell>
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
);

interface PlayerDetailsPanelDetailsProps {
  player: Player;
  _allPlayers?: Player[];
  _hiddenPlayerIds?: Set<number>;
}

// Helper function to render hero with avatar
const renderHeroWithAvatar = (hero: Hero) => (
  <div className="flex items-center space-x-2 min-w-0 w-full">
    <HeroAvatar 
      hero={hero}
      avatarSize={{ width: 'w-6', height: 'h-6' }}
    />
    <span className="text-muted-foreground dark:text-muted-foreground @[335px]:block hidden truncate flex-1">
      {hero.localizedName}
    </span>
  </div>
);

// Date range options
const DATE_RANGE_OPTIONS = [
  { value: 'all', label: 'All Time' },
  { value: '2weeks', label: '2 Weeks' },
  { value: '3months', label: '3 Months' },
  { value: 'custom', label: 'Custom Range' }
];

export const PlayerDetailsPanelDetails: React.FC<PlayerDetailsPanelDetailsProps> = React.memo(({
  player,
  _allPlayers = [],
  _hiddenPlayerIds = new Set<number>(),
}) => {
  const { heroes } = useConstantsContext();
  const [selectedDateRange, setSelectedDateRange] = useState('all');
  const [customStartDate, setCustomStartDate] = useState<Date | null>(null);
  const [customEndDate, setCustomEndDate] = useState<Date | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('games');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(() => (sortKey === 'name' ? 'asc' : 'desc'));
  
  const onHeaderClick = (key: SortKey) => {
    if (key === sortKey) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDirection(key === 'name' ? 'asc' : 'desc');
    }
  };

  // Calculate date range based on selection
  const { startDate, endDate } = useMemo(() => {
    const now = new Date();
    let start: Date;
    let end: Date = now;
    
    switch (selectedDateRange) {
      case 'all':
        start = new Date(0);
        break;
      case '2weeks':
        start = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
        break;
      case '3months':
        start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'custom':
        start = customStartDate || new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
        end = customEndDate || now;
        break;
      default:
        start = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    }
    
    return { startDate: start, endDate: end };
  }, [selectedDateRange, customStartDate, customEndDate]);
  
  // Filter matches based on date range
  const filteredMatches = useMemo(() => {
    if (selectedDateRange === 'all') {
      return player.recentMatches;
    }
    return player.recentMatches.filter(match => {
      const matchDate = new Date(match.start_time * 1000);
      return matchDate >= startDate && matchDate <= endDate;
    });
  }, [player.recentMatches, startDate, endDate, selectedDateRange]);
  
  // Get all heroes with detailed stats (filtered by date range) and sort
  const allHeroes = useMemo(() => {
    const heroStats = new Map<number, { games: number; wins: number; withGames: number; withWins: number; againstGames: number; againstWins: number }>();
    
    player.heroes.forEach(hero => {
      heroStats.set(hero.hero_id, {
        games: 0,
        wins: 0,
        withGames: hero.with_games,
        withWins: hero.with_win,
        againstGames: hero.against_games,
        againstWins: hero.against_win
      });
    });
    
    filteredMatches.forEach(match => {
      const heroId = match.hero_id;
      const currentStats = heroStats.get(heroId) || { games: 0, wins: 0, withGames: 0, withWins: 0, againstGames: 0, againstWins: 0 };
      currentStats.games += 1;
      if ((match.radiant_win && match.player_slot < 128) || (!match.radiant_win && match.player_slot >= 128)) {
        currentStats.wins += 1;
      }
      heroStats.set(heroId, currentStats);
    });

    const rows = Array.from(heroStats.entries())
      .filter(([_, stats]) => stats.games > 0)
      .map(([heroId, stats]) => {
        const heroData = heroes[heroId.toString()];
        const hero: Hero = heroData || {
          id: heroId.toString(),
          name: `npc_dota_hero_${heroId}`,
          localizedName: `Hero ${heroId}`,
          primaryAttribute: 'strength',
          attackType: 'melee',
          roles: [],
          imageUrl: ''
        };
        return {
          hero,
          games: stats.games,
          wins: stats.wins,
          winRate: stats.games > 0 ? (stats.wins / stats.games) * 100 : 0,
          withGames: stats.withGames,
          withWins: stats.withWins,
          againstGames: stats.againstGames,
          againstWins: stats.againstWins
        };
      });

    const comparator = createComparator(sortKey, sortDirection);
    return rows.sort(comparator);
  }, [player.heroes, filteredMatches, heroes, sortKey, sortDirection]);

  // Calculate average stats from filtered matches
  const avgStats = filteredMatches.reduce((acc, match) => {
    acc.kills += match.kills || 0;
    acc.deaths += match.deaths || 0;
    acc.assists += match.assists || 0;
    return acc;
  }, {
    kills: 0, deaths: 0, assists: 0
  });

  const matchCount = filteredMatches.length;
  const avgKDA = avgStats.deaths > 0 ? (avgStats.kills + avgStats.assists) / avgStats.deaths : avgStats.kills + avgStats.assists;

  // Handle custom date selection
  const handleCustomDateChange = (type: 'start' | 'end', value: string) => {
    const date = new Date(value);
    if (type === 'start') {
      setCustomStartDate(date);
    } else {
      setCustomEndDate(date);
    }
  };

  return (
    <div className="space-y-6">
      {/* Performance Statistics */}
      <div className="space-y-4">
        <div className="flex items-center justify-between min-w-0 gap-2 @container">
          <h3 className="text-lg font-semibold text-foreground dark:text-foreground truncate min-w-0 flex-1">Player Statistics</h3>
          <DateRangeControls
            selectedDateRange={selectedDateRange}
            setSelectedDateRange={setSelectedDateRange}
            customStartDate={customStartDate}
            customEndDate={customEndDate}
            onCustomDateChange={handleCustomDateChange}
          />
        </div>
        
        <StatsGrid
          avgKDA={avgKDA}
          avgKills={matchCount > 0 ? (avgStats.kills / matchCount).toFixed(1) : '0.0'}
          avgDeaths={matchCount > 0 ? (avgStats.deaths / matchCount).toFixed(1) : '0.0'}
          avgAssists={matchCount > 0 ? (avgStats.assists / matchCount).toFixed(1) : '0.0'}
        />
      </div>

      {/* Hero Statistics */}
      <Card className="@container">
        <CardHeader className="min-w-0">
          <div className="flex items-center justify-between gap-2 min-w-0">
            <CardTitle className="text-lg font-semibold text-foreground dark:text-foreground truncate min-w-0 flex-1">
              Hero Statistics
            </CardTitle>
            <div className="text-sm text-muted-foreground dark:text-muted-foreground @[225px]:inline hidden whitespace-nowrap text-right flex-none pl-1 truncate">
              {matchCount} Games
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <HeroStatisticsTable
            rows={allHeroes}
            sortKey={sortKey}
            sortDirection={sortDirection}
            onHeaderClick={onHeaderClick}
          />
        </CardContent>
      </Card>
    </div>
  );
});

PlayerDetailsPanelDetails.displayName = 'PlayerDetailsPanelDetails'; 