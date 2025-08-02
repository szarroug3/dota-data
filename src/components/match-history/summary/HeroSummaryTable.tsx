import { ChevronDown, ChevronUp, Star } from 'lucide-react';
import React, { useMemo, useState } from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Toggle } from '@/components/ui/toggle';
import { useConstantsContext } from '@/contexts/constants-context';
import { useTeamContext } from '@/contexts/team-context';
import { cn } from '@/lib/utils';
import type { Hero } from '@/types/contexts/constants-context-value';
import type { HeroPick, Match } from '@/types/contexts/match-context-value';
import type { TeamMatchParticipation } from '@/types/contexts/team-context-value';

interface HeroSummary {
  heroId: string;
  heroName: string;
  heroImage?: string;
  count: number;
  winRate?: number;
  totalGames: number;
  primaryAttribute?: string;
  playedRoles?: { role: string; count: number }[]; // Roles with counts
}

interface HeroSummaryTableProps {
  matches: Match[];
  teamMatches: Record<number, TeamMatchParticipation>;
  allMatches?: Match[];
  showHighPerformersOnly?: boolean;
  className?: string;
}

type SortField = 'name' | 'count' | 'winRate';
type SortDirection = 'asc' | 'desc';

function aggregateHeroes(matches: Match[], teamMatches: Record<number, TeamMatchParticipation>, isActiveTeam: boolean, heroes: Hero[]): HeroSummary[] {
  const heroCounts: Record<string, { count: number; wins: number; totalGames: number; roles: Record<string, number> }> = {};
  
  if (matches.length === 0) return [];
  
  // Process each match to extract hero data
  matches.forEach(match => {
    const teamMatchData = teamMatches[match.id];
    if (!teamMatchData || !teamMatchData.side) return; // Skip if no team data or side info
    
    let heroPicks: HeroPick[] = [];
    
    if (isActiveTeam) {
      // For active team, use the side from teamMatches
      if (teamMatchData.side === 'radiant') {
        heroPicks = match.draft.radiantPicks;
      } else if (teamMatchData.side === 'dire') {
        heroPicks = match.draft.direPicks;
      }
    } else {
      // For opponent team, use the opposite side
      if (teamMatchData.side === 'radiant') {
        heroPicks = match.draft.direPicks;
      } else if (teamMatchData.side === 'dire') {
        heroPicks = match.draft.radiantPicks;
      }
    }
    
    // Count hero usage and wins, track roles
    heroPicks.forEach(pick => {
      const heroId = pick.hero.id;
      if (!heroCounts[heroId]) {
        heroCounts[heroId] = { count: 0, wins: 0, totalGames: 0, roles: {} };
      }
      
      heroCounts[heroId].count++;
      heroCounts[heroId].totalGames++;
      
      // Track the role this hero was played as (for all picks)
      if (pick.role) {
        if (!heroCounts[heroId].roles[pick.role]) {
          heroCounts[heroId].roles[pick.role] = 0;
        }
        heroCounts[heroId].roles[pick.role]++;
      }
      
      // Determine if this match was a win for the active team
      const isWin = (teamMatchData.side === match.result);
      
      if (isWin) {
        heroCounts[heroId].wins++;
      }
    });
  });
  
  return Object.entries(heroCounts)
    .map(([heroId, stats]) => {
      const heroData = heroes.find(h => h.id === heroId);
      return {
        heroId,
        heroName: heroData?.localizedName || `Hero ${heroId}`,
        heroImage: heroData?.imageUrl,
        count: stats.count,
        winRate: stats.count > 0 ? (stats.wins / stats.count) * 100 : 0,
        totalGames: stats.totalGames,
        primaryAttribute: heroData?.primaryAttribute,
        playedRoles: Object.entries(stats.roles).map(([role, count]) => ({ role, count })),
      };
    });
}

function aggregateBans(matches: Match[], teamMatches: Record<number, TeamMatchParticipation>, isActiveTeam: boolean, heroes: Hero[]): HeroSummary[] {
  const heroCounts: Record<string, { count: number; wins: number; totalGames: number }> = {};
  
  if (matches.length === 0) return [];
  
  // Process each match to extract ban data
  matches.forEach(match => {
    const teamMatchData = teamMatches[match.id];
    if (!teamMatchData || !teamMatchData.side) return; // Skip if no team data or side info
    
    let heroIds: string[] = [];
    
    if (isActiveTeam) {
      // For active team bans, use the side from teamMatches
      if (teamMatchData.side === 'radiant') {
        heroIds = match.draft.radiantBans;
      } else if (teamMatchData.side === 'dire') {
        heroIds = match.draft.direBans;
      }
    } else {
      // For opponent team bans, use the opposite side
      if (teamMatchData.side === 'radiant') {
        heroIds = match.draft.direBans;
      } else if (teamMatchData.side === 'dire') {
        heroIds = match.draft.radiantBans;
      }
    }
    
    // Count hero bans
    heroIds.forEach(heroId => {
      if (!heroCounts[heroId]) {
        heroCounts[heroId] = { count: 0, wins: 0, totalGames: 0 };
      }
      
      heroCounts[heroId].count++;
      heroCounts[heroId].totalGames++;
      
      // For bans, we don't track wins since bans don't win games
      // But we can track if the team that banned won the match
      const isWin = (teamMatchData.side === match.result);
      
      if (isWin) {
        heroCounts[heroId].wins++;
      }
    });
  });
  
  return Object.entries(heroCounts)
    .map(([heroId, stats]) => {
      const heroData = heroes.find(h => h.id === heroId);
      return {
        heroId,
        heroName: heroData?.localizedName || `Hero ${heroId}`,
        heroImage: heroData?.imageUrl,
        count: stats.count,
        winRate: stats.count > 0 ? (stats.wins / stats.count) * 100 : 0,
        totalGames: stats.totalGames,
        primaryAttribute: heroData?.primaryAttribute,
        playedRoles: undefined, // Bans don't have played roles
      };
    });
}

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
  if (winRate >= 80) {
    return 'bg-primary';
  } else if (winRate >= 50) {
    return 'bg-blue-500';
  } else {
    return 'bg-yellow-600';
  }
}

function renderSortHeader(field: SortField, label: string, sortField: SortField, sortDirection: SortDirection, onSortChange?: (field: SortField) => void, alignment?: string) {
  return (
    <div 
      className={`flex items-center cursor-pointer hover:bg-muted/50 rounded ${alignment || ''}`}
      onClick={() => onSortChange?.(field)}
    >
      <span className={alignment === 'justify-center' ? 'flex-1 text-center' : ''}>{label}</span>
      {onSortChange && (
        sortField === field ? (
          sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
        ) : (
          <div className="w-3 h-3" />
        )
      )}
    </div>
  );
}

function renderTableHeaders(sortField: SortField, sortDirection: SortDirection, onSortChange?: (field: SortField) => void) {
  return (
    <TableHeader>
      <TableRow>
        <TableHead className="w-12">
          {/* Avatar column - no header */}
        </TableHead>
        <TableHead>
          {renderSortHeader('name', 'Name', sortField, sortDirection, onSortChange)}
        </TableHead>
        <TableHead className="text-center">
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
      <TableCell className="w-12">
        <Avatar className={`w-8 h-8 border-2 ${isHighPerforming ? 'border-primary' : 'border-background'}`}>
          <AvatarImage 
            src={hero.heroImage} 
            alt={hero.heroName}
            className="object-cover object-center"
          />
          <AvatarFallback className="text-xs">
            {hero.heroName.split(' ').map(word => word[0]).join('').toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </TableCell>
      <TableCell>
        <div>
          <div className="font-medium flex items-center gap-2">
            {hero.heroName}
            {showStar && isHighPerforming && (
              <Star className="w-4 h-4 text-yellow-500" />
            )}
          </div>
          {hero.playedRoles && hero.playedRoles.length > 0 && (
            <div className="text-xs text-muted-foreground">
              {hero.playedRoles.map(role => `${role.role} (${role.count})`).join(', ')}
            </div>
          )}
        </div>
      </TableCell>
      <TableCell className="text-center">
        <Badge variant="secondary" className="text-xs">
          {hero.count}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-2">
          <span className="text-xs text-muted-foreground">
            {hero.winRate?.toFixed(1)}%
          </span>
          <div className="w-12">
            <Progress 
              value={hero.winRate || 0} 
              indicatorClassName={cn(
                getProgressBarColor(hero.count, hero.winRate || 0)
              )}
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
  highPerformingHeroes
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
    if (showToggle && toggleState) {
      return heroes.filter(hero => highPerformingHeroes?.has(hero.heroId));
    }
    return heroes;
  }, [heroes, showToggle, toggleState, highPerformingHeroes]);

  const sortedHeroes = useMemo(() => sortHeroes(filteredHeroes, sortField, sortDirection), [filteredHeroes, sortField, sortDirection]);

  if (filteredHeroes.length === 0) {
    return (
      <Card className="flex flex-col min-h-[calc(100vh-2rem)] max-h-[calc(100vh-2rem)]">
        <CardHeader className="flex-shrink-0">
          <CardTitle className="text-sm">{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <div className="text-sm text-muted-foreground text-center py-4">
            No data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col min-h-[calc(100vh-2rem)] max-h-[calc(100vh-2rem)]">
      <CardHeader className="flex-shrink-0">
        <div className="flex items-center justify-between h-8">
          <CardTitle className="text-sm">{title}</CardTitle>
          {showToggle && (
            <Toggle
              pressed={toggleState}
              onPressedChange={onToggleChange}
              className="text-xs"
            >
              Show High Performing Heroes Only
            </Toggle>
          )}
          {!showToggle && <div className="w-[200px]" />}
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto min-h-0">
        <Table>
          {renderTableHeaders(sortField, sortDirection, onSortChange)}
          <TableBody>
            {sortedHeroes.map(hero => renderHeroRow(hero, title === "Active Team Picks", highPerformingHeroes?.has(hero.heroId)))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export const HeroSummaryTable: React.FC<HeroSummaryTableProps> = ({ matches, teamMatches, showHighPerformersOnly, className }) => {
  const { highPerformingHeroes } = useTeamContext();
  const { heroes } = useConstantsContext();
  const [activeTeamSort, setActiveTeamSort] = useState<{ field: SortField; direction: SortDirection }>({ field: 'winRate', direction: 'desc' });
  const [opponentTeamSort, setOpponentTeamSort] = useState<{ field: SortField; direction: SortDirection }>({ field: 'count', direction: 'desc' });
  const [activeTeamBansSort, setActiveTeamBansSort] = useState<{ field: SortField; direction: SortDirection }>({ field: 'count', direction: 'desc' });
  const [opponentTeamBansSort, setOpponentTeamBansSort] = useState<{ field: SortField; direction: SortDirection }>({ field: 'count', direction: 'desc' });
  const [activeTeamPicksToggle, setActiveTeamPicksToggle] = useState(false);
  
  if (matches.length === 0) {
    return (
      <div className={`flex items-center justify-center p-8 text-muted-foreground ${className}`}>
        <div className="text-center">
          <div className="text-lg font-medium mb-2">No matches to analyze</div>
          <div className="text-sm">Add matches to see hero summary.</div>
        </div>
      </div>
    );
  }

  // Convert heroes object to array
  const heroesArray = Object.values(heroes);

  const activeTeamPicks = aggregateHeroes(matches, teamMatches, true, heroesArray);
  const opponentTeamPicks = aggregateHeroes(matches, teamMatches, false, heroesArray);
  const activeTeamBans = aggregateBans(matches, teamMatches, true, heroesArray);
  const opponentTeamBans = aggregateBans(matches, teamMatches, false, heroesArray);

  // Filter for high performers if enabled
  const filterHighPerformers = (heroes: HeroSummary[]) => {
    if (!showHighPerformersOnly) return heroes;
    return heroes.filter(hero => highPerformingHeroes.has(hero.heroId));
  };

  const filteredActiveTeamPicks = filterHighPerformers(activeTeamPicks);
  const filteredOpponentTeamPicks = filterHighPerformers(opponentTeamPicks);
  const filteredActiveTeamBans = filterHighPerformers(activeTeamBans);
  const filteredOpponentTeamBans = filterHighPerformers(opponentTeamBans);

  const handleActiveTeamSort = (field: SortField) => {
    setActiveTeamSort(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const handleOpponentTeamSort = (field: SortField) => {
    setOpponentTeamSort(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const handleActiveTeamBansSort = (field: SortField) => {
    setActiveTeamBansSort(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const handleOpponentTeamBansSort = (field: SortField) => {
    setOpponentTeamBansSort(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Hero Summary</h3>
        <div className="text-sm text-muted-foreground">
          Based on {matches.length} match{matches.length !== 1 ? 'es' : ''}
        </div>
      </div>
      
      {/* 2x2 Grid Layout */}
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