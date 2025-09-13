import { ChevronDown, ChevronUp, Star } from 'lucide-react';
import React, { useMemo, useState } from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Toggle } from '@/components/ui/toggle';
import { useConstantsContext } from '@/frontend/contexts/constants-context';
import { useTeamContext } from '@/frontend/teams/contexts/state/team-context';
import { cn } from '@/lib/utils';
import type { Hero } from '@/types/contexts/constants-context-value';
import type { HeroPick, Match } from '@/types/contexts/match-context-value';
import type { TeamMatchParticipation } from '@/types/contexts/team-context-value';

interface HeroSummary { heroId: string; heroName: string; heroImage?: string; count: number; winRate?: number; totalGames: number; primaryAttribute?: string; playedRoles?: { role: string; count: number }[]; }
interface HeroSummaryTableProps { matches: Match[]; teamMatches: Record<number, TeamMatchParticipation>; allMatches?: Match[]; showHighPerformersOnly?: boolean; className?: string; }
type SortField = 'name' | 'count' | 'winRate';
type SortDirection = 'asc' | 'desc';

function getHeroPicksForSide(match: Match, teamMatchData: TeamMatchParticipation, isActiveTeam: boolean): HeroPick[] {
  const draft = match.draft || { radiantPicks: [], direPicks: [] };
  if (isActiveTeam) {
    return teamMatchData.side === 'radiant' ? (draft.radiantPicks || []) : (draft.direPicks || []);
  }
  return teamMatchData.side === 'radiant' ? (draft.direPicks || []) : (draft.radiantPicks || []);
}

function aggregateHeroes(matches: Match[], teamMatches: Record<number, TeamMatchParticipation>, isActiveTeam: boolean, heroes: Hero[]): HeroSummary[] {
  const heroCounts: Record<string, { count: number; wins: number; totalGames: number; roles: Record<string, number> }> = {};
  if (matches.length === 0) return [];
  matches.forEach(match => {
    const teamMatchData = teamMatches[match.id];
    if (!teamMatchData || !teamMatchData.side) return;
    const heroPicks = getHeroPicksForSide(match, teamMatchData, isActiveTeam);
    heroPicks.forEach(pick => {
      const heroId = pick.hero.id;
      const entry = heroCounts[heroId] || (heroCounts[heroId] = { count: 0, wins: 0, totalGames: 0, roles: {} });
      entry.count++;
      entry.totalGames++;
      if (pick.role) entry.roles[pick.role] = (entry.roles[pick.role] || 0) + 1;
      if (teamMatchData.side === match.result) entry.wins++;
    });
  });
  return Object.entries(heroCounts).map(([heroId, stats]) => {
    const heroData = heroes.find(h => h.id === heroId);
    return { heroId, heroName: heroData?.localizedName || `Hero ${heroId}`, heroImage: heroData?.imageUrl, count: stats.count, winRate: stats.count > 0 ? (stats.wins / stats.count) * 100 : 0, totalGames: stats.totalGames, primaryAttribute: heroData?.primaryAttribute, playedRoles: Object.entries(stats.roles).map(([role, count]) => ({ role, count })) };
  });
}

function getBansForSide(match: Match, teamMatchData: TeamMatchParticipation, isActiveTeam: boolean): string[] {
  const draft = match.draft || ({ radiantPicks: [], direPicks: [], radiantBans: [], direBans: [] } as Match['draft']);
  return isActiveTeam
    ? (teamMatchData.side === 'radiant' ? (draft.radiantBans || []) : (draft.direBans || []))
    : (teamMatchData.side === 'radiant' ? (draft.direBans || []) : (draft.radiantBans || []));
}

function aggregateBans(matches: Match[], teamMatches: Record<number, TeamMatchParticipation>, isActiveTeam: boolean, heroes: Hero[]): HeroSummary[] {
  const heroCounts: Record<string, { count: number; wins: number; totalGames: number }> = {};
  if (matches.length === 0) return [];
  matches.forEach(match => {
    const teamMatchData = teamMatches[match.id];
    if (!teamMatchData || !teamMatchData.side) return;
    const heroIds = getBansForSide(match, teamMatchData, isActiveTeam);
    heroIds.forEach(heroId => {
      if (!heroCounts[heroId]) heroCounts[heroId] = { count: 0, wins: 0, totalGames: 0 };
      heroCounts[heroId].count++;
      heroCounts[heroId].totalGames++;
      const isWin = (teamMatchData.side === match.result);
      if (isWin) heroCounts[heroId].wins++;
    });
  });
  return Object.entries(heroCounts).map(([heroId, stats]) => {
    const heroData = heroes.find(h => h.id === heroId);
    return { heroId, heroName: heroData?.localizedName || `Hero ${heroId}`, heroImage: heroData?.imageUrl, count: stats.count, winRate: stats.count > 0 ? (stats.wins / stats.count) * 100 : 0, totalGames: stats.totalGames, primaryAttribute: heroData?.primaryAttribute, playedRoles: undefined };
  });
}

function sortHeroes(heroes: HeroSummary[], sortField: SortField, sortDirection: SortDirection): HeroSummary[] {
  return [...heroes].sort((a, b) => {
    let comparison = 0;
    switch (sortField) {
      case 'name': comparison = a.heroName.localeCompare(b.heroName); break;
      case 'count': comparison = a.count - b.count; break;
      case 'winRate': comparison = (a.winRate || 0) - (b.winRate || 0); break;
    }
    return sortDirection === 'asc' ? comparison : -comparison;
  });
}

function getProgressBarColor(count: number, winRate: number): string {
  if (winRate >= 80) return 'bg-primary';
  if (winRate >= 50) return 'bg-blue-500';
  return 'bg-yellow-600';
}

function renderSortHeader(field: SortField, label: string, sortField: SortField, sortDirection: SortDirection, onSortChange?: (field: SortField) => void, alignment?: string) {
  return (
    <div className={`flex items-center cursor-pointer hover:bg-muted/50 rounded ${alignment || ''}`} onClick={() => onSortChange?.(field)}>
      <span className={alignment === 'justify-center' ? 'flex-1 text-center' : ''}>{label}</span>
      {onSortChange && (sortField === field ? (sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : (<div className="w-3 h-3" />))}
    </div>
  );
}

function renderTableHeaders(sortField: SortField, sortDirection: SortDirection, onSortChange?: (field: SortField) => void) {
  return (
    <TableHeader>
      <TableRow>
        <TableHead>{renderSortHeader('name', 'Hero', sortField, sortDirection, onSortChange)}</TableHead>
        <TableHead className="text-center @[285px]:table-cell hidden">{renderSortHeader('count', 'Count', sortField, sortDirection, onSortChange, 'justify-center')}</TableHead>
        <TableHead className="text-right">{renderSortHeader('winRate', 'Win Rate', sortField, sortDirection, onSortChange, 'justify-end')}</TableHead>
      </TableRow>
    </TableHeader>
  );
}

function renderHeroRow(hero: HeroSummary, showStar?: boolean, isHighPerforming?: boolean) {
  return (
    <TableRow key={hero.heroId}>
      <TableCell>
        <div className="flex items-center gap-3">
          <Avatar className={`w-8 h-8 border-2 ${(showStar && isHighPerforming) ? 'border-primary' : 'border-background'}`}>
            <AvatarImage src={hero.heroImage} alt={hero.heroName} className="object-cover object-center" />
            <AvatarFallback className="text-xs">{hero.heroName.split(' ').map(word => word[0]).join('').toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium flex items-center gap-2">
              {hero.heroName}
              {showStar && isHighPerforming && (<Star className="w-4 h-4 text-yellow-500" />)}
            </div>
            {hero.playedRoles && hero.playedRoles.length > 0 && (
              <div className="text-xs text-muted-foreground">{hero.playedRoles.map(role => `${role.role} (${role.count})`).join(', ')}</div>
            )}
          </div>
        </div>
      </TableCell>
      <TableCell className="text-center @[285px]:table-cell hidden">{hero.count}</TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-2">
          <span className="text-xs text-muted-foreground">{hero.winRate?.toFixed(1)}%</span>
          <div className="w-12">
            <Progress value={hero.winRate || 0} indicatorClassName={cn(getProgressBarColor(hero.count, hero.winRate || 0))} />
          </div>
        </div>
      </TableCell>
    </TableRow>
  );
}

function HeroSummarySection({ title, heroes, sortField = 'winRate' as SortField, sortDirection = 'desc' as SortDirection, onSortChange, showToggle = false, toggleState = false, onToggleChange, highPerformingHeroes }: { title: string; heroes: HeroSummary[]; sortField?: SortField; sortDirection?: SortDirection; onSortChange?: (field: SortField) => void; showToggle?: boolean; toggleState?: boolean; onToggleChange?: (checked: boolean) => void; highPerformingHeroes?: Set<string>; }) {
  const filteredHeroes = useMemo(() => { return (showToggle && toggleState) ? heroes.filter(hero => highPerformingHeroes?.has(hero.heroId)) : heroes; }, [heroes, showToggle, toggleState, highPerformingHeroes]);
  const sortedHeroes = useMemo(() => sortHeroes(filteredHeroes, sortField, sortDirection), [filteredHeroes, sortField, sortDirection]);
  if (filteredHeroes.length === 0) {
    return (
      <Card className="flex flex-col min-h-[calc(100vh-2rem)] max-h-[calc(100vh-2rem)]">
        <CardHeader className="flex-shrink-0"><CardTitle className="text-sm">{title}</CardTitle></CardHeader>
        <CardContent className="flex-1 flex items-center justify-center"><div className="text-sm text-muted-foreground text-center py-4">No data available</div></CardContent>
      </Card>
    );
  }
  return (
    <Card className="flex flex-col min-h-[calc(100vh-2rem)] max-h-[calc(100vh-2rem)]">
      <CardHeader className="flex-shrink-0">
        <div className="flex items-center justify-between h-8">
          <CardTitle className="text-sm">{title}</CardTitle>
          {showToggle ? (
            <Toggle pressed={toggleState} onPressedChange={onToggleChange} className="text-xs">Show High Performing Heroes Only</Toggle>
          ) : (<div className="w-[200px]" />)}
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto min-h-0">
        <Table>
          {renderTableHeaders(sortField, sortDirection, onSortChange)}
          <TableBody>
            {sortedHeroes.map(hero => renderHeroRow(hero, title === 'Active Team Picks', highPerformingHeroes?.has(hero.heroId)))}
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

interface HeroSummaryGridProps { className?: string; matchesCount: number; filteredActiveTeamPicks: HeroSummary[]; filteredOpponentTeamPicks: HeroSummary[]; filteredActiveTeamBans: HeroSummary[]; filteredOpponentTeamBans: HeroSummary[]; activeTeamSort: { field: SortField; direction: SortDirection }; opponentTeamSort: { field: SortField; direction: SortDirection }; activeTeamBansSort: { field: SortField; direction: SortDirection }; opponentTeamBansSort: { field: SortField; direction: SortDirection }; handleActiveTeamSort: (field: SortField) => void; handleOpponentTeamSort: (field: SortField) => void; handleActiveTeamBansSort: (field: SortField) => void; handleOpponentTeamBansSort: (field: SortField) => void; activeTeamPicksToggle: boolean; setActiveTeamPicksToggle: (checked: boolean) => void; highPerformingHeroes: Set<string>; }

const HeroSummaryGrid: React.FC<HeroSummaryGridProps> = ({ className, matchesCount, filteredActiveTeamPicks, filteredOpponentTeamPicks, filteredActiveTeamBans, filteredOpponentTeamBans, activeTeamSort, opponentTeamSort, activeTeamBansSort, opponentTeamBansSort, handleActiveTeamSort, handleOpponentTeamSort, handleActiveTeamBansSort, handleOpponentTeamBansSort, activeTeamPicksToggle, setActiveTeamPicksToggle, highPerformingHeroes, }) => {
  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Hero Summary</h3>
        <div className="text-sm text-muted-foreground">Based on {matchesCount} match{matchesCount !== 1 ? 'es' : ''}</div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <HeroSummarySection title="Active Team Picks" heroes={filteredActiveTeamPicks} sortField={activeTeamSort.field} sortDirection={activeTeamSort.direction} onSortChange={handleActiveTeamSort} showToggle={true} toggleState={activeTeamPicksToggle} onToggleChange={setActiveTeamPicksToggle} highPerformingHeroes={highPerformingHeroes} />
        <HeroSummarySection title="Opponent Team Picks" heroes={filteredOpponentTeamPicks} sortField={opponentTeamSort.field} sortDirection={opponentTeamSort.direction} onSortChange={handleOpponentTeamSort} highPerformingHeroes={highPerformingHeroes} />
        <HeroSummarySection title="Active Team Bans" heroes={filteredActiveTeamBans} sortField={activeTeamBansSort.field} sortDirection={activeTeamBansSort.direction} onSortChange={handleActiveTeamBansSort} highPerformingHeroes={highPerformingHeroes} />
        <HeroSummarySection title="Opponent Team Bans" heroes={filteredOpponentTeamBans} sortField={opponentTeamBansSort.field} sortDirection={opponentTeamBansSort.direction} onSortChange={handleOpponentTeamBansSort} highPerformingHeroes={highPerformingHeroes} />
      </div>
    </div>
  );
};

export const HeroSummaryTable: React.FC<HeroSummaryTableProps> = ({ matches, teamMatches, showHighPerformersOnly, className }) => {
  const { highPerformingHeroes } = useTeamContext();
  const { heroes } = useConstantsContext();
  const [activeTeamSort, setActiveTeamSort] = useState<{ field: SortField; direction: SortDirection }>({ field: 'winRate', direction: 'desc' });
  const [opponentTeamSort, setOpponentTeamSort] = useState<{ field: SortField; direction: SortDirection }>({ field: 'count', direction: 'desc' });
  const [activeTeamBansSort, setActiveTeamBansSort] = useState<{ field: SortField; direction: SortDirection }>({ field: 'count', direction: 'desc' });
  const [opponentTeamBansSort, setOpponentTeamBansSort] = useState<{ field: SortField; direction: SortDirection }>({ field: 'count', direction: 'desc' });
  const [activeTeamPicksToggle, setActiveTeamPicksToggle] = useState(false);
  if (matches.length === 0) return <NoMatchesNotice className={className} />;
  const heroesArray = Object.values(heroes);
  const activeTeamPicks = aggregateHeroes(matches, teamMatches, true, heroesArray);
  const opponentTeamPicks = aggregateHeroes(matches, teamMatches, false, heroesArray);
  const activeTeamBans = aggregateBans(matches, teamMatches, true, heroesArray);
  const opponentTeamBans = aggregateBans(matches, teamMatches, false, heroesArray);
  const filterHighPerformers = (heroes: HeroSummary[]) => (!showHighPerformersOnly ? heroes : heroes.filter(hero => highPerformingHeroes.has(hero.heroId)));
  const filteredActiveTeamPicks = filterHighPerformers(activeTeamPicks);
  const filteredOpponentTeamPicks = filterHighPerformers(opponentTeamPicks);
  const filteredActiveTeamBans = filterHighPerformers(activeTeamBans);
  const filteredOpponentTeamBans = filterHighPerformers(opponentTeamBans);
  const handleActiveTeamSort = (field: SortField) => { setActiveTeamSort(prev => ({ field, direction: prev.field === field && prev.direction === 'desc' ? 'asc' : 'desc' })); };
  const handleOpponentTeamSort = (field: SortField) => { setOpponentTeamSort(prev => ({ field, direction: prev.field === field && prev.direction === 'desc' ? 'asc' : 'desc' })); };
  const handleActiveTeamBansSort = (field: SortField) => { setActiveTeamBansSort(prev => ({ field, direction: prev.field === field && prev.direction === 'desc' ? 'asc' : 'desc' })); };
  const handleOpponentTeamBansSort = (field: SortField) => { setOpponentTeamBansSort(prev => ({ field, direction: prev.field === field && prev.direction === 'desc' ? 'asc' : 'desc' })); };
  return (
    <HeroSummaryGrid className={className} matchesCount={matches.length} filteredActiveTeamPicks={filteredActiveTeamPicks} filteredOpponentTeamPicks={filteredOpponentTeamPicks} filteredActiveTeamBans={filteredActiveTeamBans} filteredOpponentTeamBans={filteredOpponentTeamBans} activeTeamSort={activeTeamSort} opponentTeamSort={opponentTeamSort} activeTeamBansSort={activeTeamBansSort} opponentTeamBansSort={opponentTeamBansSort} handleActiveTeamSort={handleActiveTeamSort} handleOpponentTeamSort={handleOpponentTeamSort} handleActiveTeamBansSort={handleActiveTeamBansSort} handleOpponentTeamBansSort={handleOpponentTeamBansSort} activeTeamPicksToggle={activeTeamPicksToggle} setActiveTeamPicksToggle={setActiveTeamPicksToggle} highPerformingHeroes={highPerformingHeroes} />
  );
};


