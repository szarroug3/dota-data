import { ChevronDown, ChevronUp, Star } from 'lucide-react';
import React, { useMemo, useState } from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Toggle } from '@/components/ui/toggle';
import { useAppData } from '@/contexts/app-data-context';
import type { HeroSummaryEntry, Match } from '@/frontend/lib/app-data/app-data-types';
import { cn } from '@/lib/utils/utils';

interface HeroSummary {
  heroId: string;
  heroName: string;
  heroImage?: string;
  count: number;
  winRate?: number;
  totalGames: number;
  primaryAttribute?: string;
  playedRoles?: { role: string; count: number }[];
}
interface HeroSummaryTableProps {
  matches: Match[];
  showHighPerformersOnly?: boolean;
  className?: string;
  highPerformingHeroes?: Set<string>;
}
type SortField = 'name' | 'count' | 'winRate';
type SortDirection = 'asc' | 'desc';
type SortState = { field: SortField; direction: SortDirection };

function getProgressBarColor(count: number, winRate: number): string {
  if (winRate >= 80) return 'bg-primary';
  if (winRate >= 50) return 'bg-blue-500';
  return 'bg-yellow-600';
}

function renderSortHeader(
  field: SortField,
  label: string,
  sortField: SortField,
  sortDirection: SortDirection,
  onSortChange?: (field: SortField) => void,
  alignment?: string,
) {
  return (
    <div
      className={`flex items-center cursor-pointer hover:bg-muted/50 rounded ${alignment || ''}`}
      onClick={() => onSortChange?.(field)}
    >
      <span className={alignment === 'justify-center' ? 'flex-1 text-center' : ''}>{label}</span>
      {onSortChange &&
        (sortField === field ? (
          sortDirection === 'asc' ? (
            <ChevronUp className="w-3 h-3" />
          ) : (
            <ChevronDown className="w-3 h-3" />
          )
        ) : (
          <div className="w-3 h-3" />
        ))}
    </div>
  );
}

function renderTableHeaders(
  sortField: SortField,
  sortDirection: SortDirection,
  onSortChange?: (field: SortField) => void,
) {
  return (
    <TableHeader>
      <TableRow>
        <TableHead>{renderSortHeader('name', 'Hero', sortField, sortDirection, onSortChange)}</TableHead>
        <TableHead className="text-center @[285px]:table-cell hidden">
          {renderSortHeader('count', 'Count', sortField, sortDirection, onSortChange, 'justify-center')}
        </TableHead>
        <TableHead className="text-right">
          {renderSortHeader('winRate', 'Win Rate', sortField, sortDirection, onSortChange, 'justify-end')}
        </TableHead>
      </TableRow>
    </TableHeader>
  );
}

function renderHeroRow(hero: HeroSummary, showStar?: boolean, isHighPerforming?: boolean) {
  return (
    <TableRow key={hero.heroId}>
      <TableCell>
        <div className="flex items-center gap-3">
          <Avatar
            className={`w-8 h-8 border-2 ${showStar && isHighPerforming ? 'border-primary' : 'border-background'}`}
          >
            <AvatarImage src={hero.heroImage} alt={hero.heroName} className="object-cover object-center" />
            <AvatarFallback className="text-xs">
              {hero.heroName
                .split(' ')
                .map((word) => word[0])
                .join('')
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium flex items-center gap-2">
              {hero.heroName}
              {showStar && isHighPerforming && <Star className="w-4 h-4 text-yellow-500" />}
            </div>
            {hero.playedRoles && hero.playedRoles.length > 0 && (
              <div className="text-xs text-muted-foreground">
                {hero.playedRoles.map((role) => `${role.role} (${role.count})`).join(', ')}
              </div>
            )}
          </div>
        </div>
      </TableCell>
      <TableCell className="text-center @[285px]:table-cell hidden">{hero.count}</TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-2">
          <span className="text-xs text-muted-foreground">{hero.winRate?.toFixed(1)}%</span>
          <div className="w-12">
            <Progress
              value={hero.winRate || 0}
              indicatorClassName={cn(getProgressBarColor(hero.count, hero.winRate || 0))}
            />
          </div>
        </div>
      </TableCell>
    </TableRow>
  );
}

function HeroSummarySection({
  title,
  heroes,
  sortField = 'winRate' as SortField,
  sortDirection = 'desc' as SortDirection,
  onSortChange,
  showToggle = false,
  toggleState = false,
  onToggleChange,
  highPerformingHeroes,
}: {
  title: string;
  heroes: HeroSummary[];
  sortField?: SortField;
  sortDirection?: SortDirection;
  onSortChange?: (field: SortField) => void;
  showToggle?: boolean;
  toggleState?: boolean;
  onToggleChange?: (checked: boolean) => void;
  highPerformingHeroes?: Set<string>;
}) {
  // Always show the toggle button, even when there's no data, so users can untoggle
  if (heroes.length === 0) {
    return (
      <Card className="flex flex-col min-h-[calc(100vh-2rem)] max-h-[calc(100vh-2rem)]">
        <CardHeader className="shrink-0">
          <div className="flex items-center justify-between h-8">
            <CardTitle className="text-sm">{title}</CardTitle>
            {showToggle ? (
              <Toggle pressed={toggleState} onPressedChange={onToggleChange} className="text-xs">
                Show High Performing Heroes Only
              </Toggle>
            ) : (
              <div className="w-[200px]" />
            )}
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <div className="text-sm text-muted-foreground text-center py-4">No data available</div>
        </CardContent>
      </Card>
    );
  }
  return (
    <Card className="flex flex-col min-h-[calc(100vh-2rem)] max-h-[calc(100vh-2rem)]">
      <CardHeader className="shrink-0">
        <div className="flex items-center justify-between h-8">
          <CardTitle className="text-sm">{title}</CardTitle>
          {showToggle ? (
            <Toggle pressed={toggleState} onPressedChange={onToggleChange} className="text-xs">
              Show High Performing Heroes Only
            </Toggle>
          ) : (
            <div className="w-[200px]" />
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto min-h-0">
        <Table>
          {renderTableHeaders(sortField, sortDirection, onSortChange)}
          <TableBody>
            {heroes.map((hero) =>
              renderHeroRow(hero, title === 'Active Team Picks', highPerformingHeroes?.has(hero.heroId)),
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function NoMatchesNotice({ className }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center p-8 text-muted-foreground ${className}`}>
      <div className="text-center">
        <div className="text-lg font-medium mb-2">No matches to analyze</div>
        <div className="text-sm">Add matches to see hero summary.</div>
      </div>
    </div>
  );
}

interface HeroSummaryGridProps {
  className?: string;
  matchesCount: number;
  filteredActiveTeamPicks: HeroSummary[];
  filteredOpponentTeamPicks: HeroSummary[];
  filteredActiveTeamBans: HeroSummary[];
  filteredOpponentTeamBans: HeroSummary[];
  activeTeamSort: { field: SortField; direction: SortDirection };
  opponentTeamSort: { field: SortField; direction: SortDirection };
  activeTeamBansSort: { field: SortField; direction: SortDirection };
  opponentTeamBansSort: { field: SortField; direction: SortDirection };
  handleActiveTeamSort: (field: SortField) => void;
  handleOpponentTeamSort: (field: SortField) => void;
  handleActiveTeamBansSort: (field: SortField) => void;
  handleOpponentTeamBansSort: (field: SortField) => void;
  activeTeamPicksToggle: boolean;
  setActiveTeamPicksToggle: (checked: boolean) => void;
  highPerformingHeroes: Set<string>;
}

const HeroSummaryGrid: React.FC<HeroSummaryGridProps> = ({
  className,
  matchesCount,
  filteredActiveTeamPicks,
  filteredOpponentTeamPicks,
  filteredActiveTeamBans,
  filteredOpponentTeamBans,
  activeTeamSort,
  opponentTeamSort,
  activeTeamBansSort,
  opponentTeamBansSort,
  handleActiveTeamSort,
  handleOpponentTeamSort,
  handleActiveTeamBansSort,
  handleOpponentTeamBansSort,
  activeTeamPicksToggle,
  setActiveTeamPicksToggle,
  highPerformingHeroes,
}) => {
  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Hero Summary</h3>
        <div className="text-sm text-muted-foreground">
          Based on {matchesCount} match{matchesCount !== 1 ? 'es' : ''}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <HeroSummarySection
          title="Active Team Picks"
          heroes={filteredActiveTeamPicks}
          sortField={activeTeamSort.field}
          sortDirection={activeTeamSort.direction}
          onSortChange={handleActiveTeamSort}
          showToggle={true}
          toggleState={activeTeamPicksToggle}
          onToggleChange={setActiveTeamPicksToggle}
          highPerformingHeroes={highPerformingHeroes}
        />
        <HeroSummarySection
          title="Opponent Team Picks"
          heroes={filteredOpponentTeamPicks}
          sortField={opponentTeamSort.field}
          sortDirection={opponentTeamSort.direction}
          onSortChange={handleOpponentTeamSort}
          highPerformingHeroes={highPerformingHeroes}
        />
        <HeroSummarySection
          title="Active Team Bans"
          heroes={filteredActiveTeamBans}
          sortField={activeTeamBansSort.field}
          sortDirection={activeTeamBansSort.direction}
          onSortChange={handleActiveTeamBansSort}
          highPerformingHeroes={highPerformingHeroes}
        />
        <HeroSummarySection
          title="Opponent Team Bans"
          heroes={filteredOpponentTeamBans}
          sortField={opponentTeamBansSort.field}
          sortDirection={opponentTeamBansSort.direction}
          onSortChange={handleOpponentTeamBansSort}
          highPerformingHeroes={highPerformingHeroes}
        />
      </div>
    </div>
  );
};

// Helper function to map HeroSummaryEntry to HeroSummary (compatible types)
function mapHeroSummaryEntry(entry: HeroSummaryEntry): HeroSummary {
  return {
    heroId: entry.heroId,
    heroName: entry.heroName,
    heroImage: entry.heroImage,
    count: entry.count,
    winRate: entry.winRate,
    totalGames: entry.totalGames,
    primaryAttribute: entry.primaryAttribute,
    playedRoles: entry.playedRoles,
  };
}

function useHeroSummaryFilters({
  appData,
  heroSummary,
  highPerformingHeroes,
  showHighPerformersOnly,
  activeTeamPicksToggle,
  activeTeamSort,
  opponentTeamSort,
  activeTeamBansSort,
  opponentTeamBansSort,
}: {
  appData: ReturnType<typeof useAppData>;
  heroSummary: ReturnType<ReturnType<typeof useAppData>['getTeamHeroSummaryForMatches']>;
  highPerformingHeroes: Set<string>;
  showHighPerformersOnly: boolean | undefined;
  activeTeamPicksToggle: boolean;
  activeTeamSort: SortState;
  opponentTeamSort: SortState;
  activeTeamBansSort: SortState;
  opponentTeamBansSort: SortState;
}) {
  const filteredActiveTeamPicks = useMemo(() => {
    let heroes = heroSummary.activeTeamPicks;
    if (activeTeamPicksToggle && highPerformingHeroes.size > 0) {
      heroes = appData.filterHeroSummaryByHighPerformers(heroes, highPerformingHeroes);
    }
    heroes = appData.sortHeroSummaryEntries(heroes, activeTeamSort.field, activeTeamSort.direction);
    return heroes.map(mapHeroSummaryEntry);
  }, [appData, heroSummary.activeTeamPicks, activeTeamPicksToggle, highPerformingHeroes, activeTeamSort]);

  const filteredOpponentTeamPicks = useMemo(() => {
    let heroes = heroSummary.opponentTeamPicks;
    if (showHighPerformersOnly && highPerformingHeroes.size > 0) {
      heroes = appData.filterHeroSummaryByHighPerformers(heroes, highPerformingHeroes);
    }
    heroes = appData.sortHeroSummaryEntries(heroes, opponentTeamSort.field, opponentTeamSort.direction);
    return heroes.map(mapHeroSummaryEntry);
  }, [appData, heroSummary.opponentTeamPicks, showHighPerformersOnly, highPerformingHeroes, opponentTeamSort]);

  const filteredActiveTeamBans = useMemo(() => {
    let heroes = heroSummary.activeTeamBans;
    if (showHighPerformersOnly && highPerformingHeroes.size > 0) {
      heroes = appData.filterHeroSummaryByHighPerformers(heroes, highPerformingHeroes);
    }
    heroes = appData.sortHeroSummaryEntries(heroes, activeTeamBansSort.field, activeTeamBansSort.direction);
    return heroes.map(mapHeroSummaryEntry);
  }, [appData, heroSummary.activeTeamBans, showHighPerformersOnly, highPerformingHeroes, activeTeamBansSort]);

  const filteredOpponentTeamBans = useMemo(() => {
    let heroes = heroSummary.opponentTeamBans;
    if (showHighPerformersOnly && highPerformingHeroes.size > 0) {
      heroes = appData.filterHeroSummaryByHighPerformers(heroes, highPerformingHeroes);
    }
    heroes = appData.sortHeroSummaryEntries(heroes, opponentTeamBansSort.field, opponentTeamBansSort.direction);
    return heroes.map(mapHeroSummaryEntry);
  }, [appData, heroSummary.opponentTeamBans, showHighPerformersOnly, highPerformingHeroes, opponentTeamBansSort]);

  return {
    filteredActiveTeamPicks,
    filteredOpponentTeamPicks,
    filteredActiveTeamBans,
    filteredOpponentTeamBans,
  };
}

export const HeroSummaryTable: React.FC<HeroSummaryTableProps> = ({
  matches,
  showHighPerformersOnly,
  className,
  highPerformingHeroes = new Set(),
}) => {
  const appData = useAppData();
  const selectedTeamId = appData.state.selectedTeamId;

  // Get hero summary from AppData
  const heroSummary = useMemo(() => {
    if (!selectedTeamId || matches.length === 0) {
      return {
        matchesCount: 0,
        activeTeamPicks: [],
        opponentTeamPicks: [],
        activeTeamBans: [],
        opponentTeamBans: [],
      };
    }
    return appData.getTeamHeroSummaryForMatches(selectedTeamId, matches);
    // Dependencies:
    // - appData: access to methods
    // - selectedTeamId: re-run when team changes
    // - matches: re-run when matches change
    // - appData.teams: re-run when teams change (triggered by updateTeamsRef)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appData, selectedTeamId, matches, appData.teams]);

  const [activeTeamSort, setActiveTeamSort] = useState<SortState>({
    field: 'winRate',
    direction: 'desc',
  });
  const [opponentTeamSort, setOpponentTeamSort] = useState<SortState>({
    field: 'count',
    direction: 'desc',
  });
  const [activeTeamBansSort, setActiveTeamBansSort] = useState<SortState>({
    field: 'count',
    direction: 'desc',
  });
  const [opponentTeamBansSort, setOpponentTeamBansSort] = useState<SortState>({
    field: 'count',
    direction: 'desc',
  });
  const [activeTeamPicksToggle, setActiveTeamPicksToggle] = useState(false);

  const { filteredActiveTeamPicks, filteredOpponentTeamPicks, filteredActiveTeamBans, filteredOpponentTeamBans } =
    useHeroSummaryFilters({
      appData,
      heroSummary,
      highPerformingHeroes,
      showHighPerformersOnly,
      activeTeamPicksToggle,
      activeTeamSort,
      opponentTeamSort,
      activeTeamBansSort,
      opponentTeamBansSort,
    });
  const handleActiveTeamSort = (field: SortField) => {
    setActiveTeamSort((prev) => ({
      field,
      direction: prev.field === field && prev.direction === 'desc' ? 'asc' : 'desc',
    }));
  };
  const handleOpponentTeamSort = (field: SortField) => {
    setOpponentTeamSort((prev) => ({
      field,
      direction: prev.field === field && prev.direction === 'desc' ? 'asc' : 'desc',
    }));
  };
  const handleActiveTeamBansSort = (field: SortField) => {
    setActiveTeamBansSort((prev) => ({
      field,
      direction: prev.field === field && prev.direction === 'desc' ? 'asc' : 'desc',
    }));
  };
  const handleOpponentTeamBansSort = (field: SortField) => {
    setOpponentTeamBansSort((prev) => ({
      field,
      direction: prev.field === field && prev.direction === 'desc' ? 'asc' : 'desc',
    }));
  };
  if (matches.length === 0) return <NoMatchesNotice className={className} />;

  return (
    <HeroSummaryGrid
      className={className}
      matchesCount={matches.length}
      filteredActiveTeamPicks={filteredActiveTeamPicks}
      filteredOpponentTeamPicks={filteredOpponentTeamPicks}
      filteredActiveTeamBans={filteredActiveTeamBans}
      filteredOpponentTeamBans={filteredOpponentTeamBans}
      activeTeamSort={activeTeamSort}
      opponentTeamSort={opponentTeamSort}
      activeTeamBansSort={activeTeamBansSort}
      opponentTeamBansSort={opponentTeamBansSort}
      handleActiveTeamSort={handleActiveTeamSort}
      handleOpponentTeamSort={handleOpponentTeamSort}
      handleActiveTeamBansSort={handleActiveTeamBansSort}
      handleOpponentTeamBansSort={handleOpponentTeamBansSort}
      activeTeamPicksToggle={activeTeamPicksToggle}
      setActiveTeamPicksToggle={setActiveTeamPicksToggle}
      highPerformingHeroes={highPerformingHeroes}
    />
  );
};
