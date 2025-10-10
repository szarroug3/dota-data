import { ChevronDown, ChevronUp, Star } from 'lucide-react';
import React, { useMemo, useState } from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Toggle } from '@/components/ui/toggle';
import type { HeroSummaryEntry, TeamHeroSummary } from '@/frontend/lib/app-data-types';
import { cn } from '@/lib/utils';

interface HeroSummaryTableProps {
  summary: TeamHeroSummary;
  showHighPerformersOnly?: boolean;
  className?: string;
  highPerformingHeroes?: Set<string>;
}
type HeroSummary = HeroSummaryEntry;
type SortField = 'name' | 'count' | 'winRate';
type SortDirection = 'asc' | 'desc';

function sortHeroes(heroes: HeroSummary[], sortField: SortField, sortDirection: SortDirection): HeroSummary[] {
  return [...heroes].sort((a, b) => {
    let comparison = 0;
    switch (sortField) {
      case 'name':
        comparison = a.heroName.localeCompare(b.heroName);
        break;
      case 'count':
        comparison = a.count - b.count;
        break;
      case 'winRate':
        comparison = (a.winRate || 0) - (b.winRate || 0);
        break;
    }
    return sortDirection === 'asc' ? comparison : -comparison;
  });
}

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
  const filteredHeroes = useMemo(() => {
    return showToggle && toggleState ? heroes.filter((hero) => highPerformingHeroes?.has(hero.heroId)) : heroes;
  }, [heroes, showToggle, toggleState, highPerformingHeroes]);
  const sortedHeroes = useMemo(
    () => sortHeroes(filteredHeroes, sortField, sortDirection),
    [filteredHeroes, sortField, sortDirection],
  );
  if (filteredHeroes.length === 0) {
    return (
      <Card className="flex flex-col min-h-[calc(100vh-2rem)] max-h-[calc(100vh-2rem)]">
        <CardHeader className="flex-shrink-0">
          <CardTitle className="text-sm">{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <div className="text-sm text-muted-foreground text-center py-4">No data available</div>
        </CardContent>
      </Card>
    );
  }
  return (
    <Card className="flex flex-col min-h-[calc(100vh-2rem)] max-h-[calc(100vh-2rem)]">
      <CardHeader className="flex-shrink-0">
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
            {sortedHeroes.map((hero) =>
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

export const HeroSummaryTable: React.FC<HeroSummaryTableProps> = ({
  summary,
  showHighPerformersOnly,
  className,
  highPerformingHeroes = new Set(),
}) => {
  const [activeTeamSort, setActiveTeamSort] = useState<{ field: SortField; direction: SortDirection }>({
    field: 'winRate',
    direction: 'desc',
  });
  const [opponentTeamSort, setOpponentTeamSort] = useState<{ field: SortField; direction: SortDirection }>({
    field: 'count',
    direction: 'desc',
  });
  const [activeTeamBansSort, setActiveTeamBansSort] = useState<{ field: SortField; direction: SortDirection }>({
    field: 'count',
    direction: 'desc',
  });
  const [opponentTeamBansSort, setOpponentTeamBansSort] = useState<{ field: SortField; direction: SortDirection }>({
    field: 'count',
    direction: 'desc',
  });
  const [activeTeamPicksToggle, setActiveTeamPicksToggle] = useState(false);
  if (summary.matchesCount === 0) return <NoMatchesNotice className={className} />;

  const {
    matchesCount,
    activeTeamPicks,
    opponentTeamPicks,
    activeTeamBans,
    opponentTeamBans,
  } = summary;

  const filterHighPerformers = (heroes: HeroSummary[]) =>
    !showHighPerformersOnly ? heroes : heroes.filter((hero) => highPerformingHeroes.has(hero.heroId));
  const filteredActiveTeamPicks = filterHighPerformers(activeTeamPicks);
  const filteredOpponentTeamPicks = filterHighPerformers(opponentTeamPicks);
  const filteredActiveTeamBans = filterHighPerformers(activeTeamBans);
  const filteredOpponentTeamBans = filterHighPerformers(opponentTeamBans);
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
  return (
    <HeroSummaryGrid
      className={className}
      matchesCount={matchesCount}
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
