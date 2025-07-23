import { ChevronUp, ChevronDown } from 'lucide-react';
import React, { useState, useMemo } from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useConstantsContext } from '@/contexts/constants-context';
import { cn } from '@/lib/utils';
import type { Hero } from '@/types/contexts/constants-context-value';
import type { Match } from '@/types/contexts/match-context-value';

interface HeroSummary {
  heroId: string;
  heroName: string;
  heroImage?: string;
  count: number;
  winRate?: number;
  totalGames: number;
  primaryAttribute?: string;
  roles?: string[];
}

interface HeroSummaryTableProps {
  matches: Match[];
  className?: string;
}

type SortField = 'name' | 'count' | 'winRate';
type SortDirection = 'asc' | 'desc';

// Mock hero data for demonstration
const mockHeroes: Hero[] = [
  { id: '1', name: 'crystal_maiden', localizedName: 'Crystal Maiden', primaryAttribute: 'intelligence', attackType: 'ranged', roles: ['Support', 'Disabler'], complexity: 1, imageUrl: 'https://dota2protracker.com/static/heroes/crystal_maiden_vert.jpg' },
  { id: '2', name: 'juggernaut', localizedName: 'Juggernaut', primaryAttribute: 'agility', attackType: 'melee', roles: ['Carry', 'Pusher'], complexity: 2, imageUrl: 'https://dota2protracker.com/static/heroes/juggernaut_vert.jpg' },
  { id: '3', name: 'lina', localizedName: 'Lina', primaryAttribute: 'intelligence', attackType: 'ranged', roles: ['Support', 'Nuker'], complexity: 2, imageUrl: 'https://dota2protracker.com/static/heroes/lina_vert.jpg' },
  { id: '4', name: 'pudge', localizedName: 'Pudge', primaryAttribute: 'strength', attackType: 'melee', roles: ['Disabler', 'Initiator'], complexity: 2, imageUrl: 'https://dota2protracker.com/static/heroes/pudge_vert.jpg' },
  { id: '5', name: 'lion', localizedName: 'Lion', primaryAttribute: 'intelligence', attackType: 'ranged', roles: ['Support', 'Disabler'], complexity: 1, imageUrl: 'https://dota2protracker.com/static/heroes/lion_vert.jpg' },
  { id: '6', name: 'phantom_assassin', localizedName: 'Phantom Assassin', primaryAttribute: 'agility', attackType: 'melee', roles: ['Carry', 'Escape'], complexity: 1, imageUrl: 'https://dota2protracker.com/static/heroes/phantom_assassin_vert.jpg' },
  { id: '7', name: 'earthshaker', localizedName: 'Earthshaker', primaryAttribute: 'strength', attackType: 'melee', roles: ['Initiator', 'Disabler'], complexity: 2, imageUrl: 'https://dota2protracker.com/static/heroes/earthshaker_vert.jpg' },
  { id: '8', name: 'windranger', localizedName: 'Windranger', primaryAttribute: 'agility', attackType: 'ranged', roles: ['Carry', 'Support'], complexity: 2, imageUrl: 'https://dota2protracker.com/static/heroes/windranger_vert.jpg' },
  { id: '9', name: 'axe', localizedName: 'Axe', primaryAttribute: 'strength', attackType: 'melee', roles: ['Initiator', 'Durable'], complexity: 1, imageUrl: 'https://dota2protracker.com/static/heroes/axe_vert.jpg' },
  { id: '10', name: 'nevermore', localizedName: 'Shadow Fiend', primaryAttribute: 'agility', attackType: 'ranged', roles: ['Carry', 'Nuker'], complexity: 3, imageUrl: 'https://dota2protracker.com/static/heroes/nevermore_vert.jpg' },
];

function aggregateHeroes(matches: Match[], isActiveTeam: boolean, heroes: Hero[]): HeroSummary[] {
  // Create mock hero usage data based on matches
  const heroCounts: Record<string, { count: number; wins: number; totalGames: number }> = {};
  
  // Generate mock data based on match count
  const matchCount = matches.length;
  if (matchCount === 0) return [];
  
  // Use a subset of mock heroes for demonstration
  const availableHeroes = mockHeroes.slice(0, 5);
  
  availableHeroes.forEach((hero, index) => {
    const usageCount = Math.max(1, Math.floor(matchCount * (0.8 - index * 0.15)));
    const winCount = Math.floor(usageCount * (0.6 + Math.random() * 0.3)); // 60-90% win rate
    
    heroCounts[hero.id] = {
      count: usageCount,
      wins: winCount,
      totalGames: usageCount
    };
  });
  
  return [];
  return Object.entries(heroCounts)
    .map(([heroId, stats]) => {
      const heroData = heroes.find(h => h.id === heroId) || mockHeroes.find(h => h.id === heroId);
      return {
        heroId,
        heroName: heroData?.localizedName || `Hero ${heroId}`,
        heroImage: heroData?.imageUrl,
        count: stats.count,
        winRate: (stats.wins / stats.count) * 100, // Always calculate win rate
        totalGames: stats.totalGames,
        primaryAttribute: heroData?.primaryAttribute,
        roles: heroData?.roles,
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
  // Blue for high performance heroes
  if ((count >= 5 && winRate >= 80) || (count >= 8 && winRate >= 70)) {
    return 'bg-blue-500';
  }
  // Default color for other heroes
  return 'bg-primary';
}

function HeroSummarySection({ 
  title, 
  heroes, 
  showWinRate = false,
  showHeroImages = false,
  sortField = 'winRate' as SortField,
  sortDirection = 'desc' as SortDirection,
  onSortChange
}: { 
  title: string; 
  heroes: HeroSummary[]; 
  showWinRate?: boolean;
  showHeroImages?: boolean;
  sortField?: SortField;
  sortDirection?: SortDirection;
  onSortChange?: (field: SortField) => void;
}) {
  const sortedHeroes = useMemo(() => sortHeroes(heroes, sortField, sortDirection), [heroes, sortField, sortDirection]);

  if (heroes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground text-center py-4">
            No data available
          </div>
        </CardContent>
      </Card>
    );
  }

  const SortButton = ({ field, label }: { field: SortField; label: string }) => (
    <Button
      variant="ghost"
      size="sm"
      className="h-auto p-1 text-xs inline-flex items-center gap-1"
      onClick={() => onSortChange?.(field)}
    >
      {label}
      {sortField === field && (
        sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
      )}
    </Button>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              {showHeroImages && (
                <TableHead className="w-12">
                  {/* Avatar column - no header */}
                </TableHead>
              )}
              <TableHead>
                <div 
                  className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 rounded px-1 py-1"
                  onClick={() => onSortChange?.('name')}
                >
                  <span>Name</span>
                  {onSortChange && (
                    sortField === 'name' ? (
                      sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                    ) : (
                      <div className="w-3 h-3" />
                    )
                  )}
                </div>
              </TableHead>
              <TableHead className="text-center">
                <div 
                  className="flex items-center justify-center gap-2 cursor-pointer hover:bg-muted/50 rounded px-1 py-1"
                  onClick={() => onSortChange?.('count')}
                >
                  <span>Count</span>
                  {onSortChange && (
                    sortField === 'count' ? (
                      sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                    ) : (
                      <div className="w-3 h-3" />
                    )
                  )}
                </div>
              </TableHead>
              {showWinRate && (
                <TableHead className="text-center">
                  <div 
                    className="flex items-center justify-center gap-2 cursor-pointer hover:bg-muted/50 rounded px-1 py-1"
                    onClick={() => onSortChange?.('winRate')}
                  >
                    <span>Win Rate</span>
                    {onSortChange && (
                      sortField === 'winRate' ? (
                        sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                      ) : (
                        <div className="w-3 h-3" />
                      )
                    )}
                  </div>
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedHeroes.map((hero) => (
              <TableRow key={hero.heroId}>
                {showHeroImages && (
                  <TableCell className="w-12">
                    <Avatar className="w-8 h-8 border-2 border-background">
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
                )}
                <TableCell>
                  <div>
                    <div className="font-medium">{hero.heroName}</div>
                    {hero.roles && (
                      <div className="text-xs text-muted-foreground">
                        {hero.roles.join(', ')}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="secondary" className="text-xs">
                    {hero.count}
                  </Badge>
                </TableCell>
                {showWinRate && hero.winRate !== undefined && (
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {hero.winRate.toFixed(1)}%
                      </span>
                      <div className="w-12">
                        <Progress 
                          value={hero.winRate} 
                          className="h-1" 
                          indicatorClassName={cn(
                            getProgressBarColor(hero.count, hero.winRate)
                          )}
                        />
                      </div>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export const HeroSummaryTable: React.FC<HeroSummaryTableProps> = ({ matches, className }) => {
  const { heroes } = useConstantsContext();
  const [activeTeamSort, setActiveTeamSort] = useState<{ field: SortField; direction: SortDirection }>({ field: 'winRate', direction: 'desc' });
  const [opponentTeamSort, setOpponentTeamSort] = useState<{ field: SortField; direction: SortDirection }>({ field: 'count', direction: 'desc' });
  const [activeTeamBansSort, setActiveTeamBansSort] = useState<{ field: SortField; direction: SortDirection }>({ field: 'count', direction: 'desc' });
  const [opponentTeamBansSort, setOpponentTeamBansSort] = useState<{ field: SortField; direction: SortDirection }>({ field: 'count', direction: 'desc' });
  
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

  const activeTeamPicks = aggregateHeroes(matches, true, heroes);
  const opponentTeamPicks = aggregateHeroes(matches, false, heroes);
  const activeTeamBans = aggregateHeroes(matches, true, heroes);
  const opponentTeamBans = aggregateHeroes(matches, false, heroes);

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
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Hero Summary</h3>
        <div className="text-sm text-muted-foreground">
          Based on {matches.length} match{matches.length !== 1 ? 'es' : ''}
        </div>
      </div>
      
      {/* 2x2 Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <HeroSummarySection 
          title="Active Team Picks" 
          heroes={activeTeamPicks} 
          showWinRate={true}
          showHeroImages={true}
          sortField={activeTeamSort.field}
          sortDirection={activeTeamSort.direction}
          onSortChange={handleActiveTeamSort}
        />
        <HeroSummarySection 
          title="Opponent Team Picks" 
          heroes={opponentTeamPicks}
          showWinRate={true}
          showHeroImages={true}
          sortField={opponentTeamSort.field}
          sortDirection={opponentTeamSort.direction}
          onSortChange={handleOpponentTeamSort}
        />
        <HeroSummarySection 
          title="Active Team Bans" 
          heroes={activeTeamBans}
          showWinRate={true}
          showHeroImages={true}
          sortField={activeTeamBansSort.field}
          sortDirection={activeTeamBansSort.direction}
          onSortChange={handleActiveTeamBansSort}
        />
        <HeroSummarySection 
          title="Opponent Team Bans" 
          heroes={opponentTeamBans}
          showWinRate={true}
          showHeroImages={true}
          sortField={opponentTeamBansSort.field}
          sortDirection={opponentTeamBansSort.direction}
          onSortChange={handleOpponentTeamBansSort}
        />
      </div>
    </div>
  );
}; 