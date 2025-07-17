import React from 'react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Hero } from '@/types/contexts/hero-context-value';
import type { Match } from '@/types/contexts/match-context-value';

interface HeroSummary {
  heroId: string;
  heroName: string;
  count: number;
  winRate?: number; // Only for active team
}

interface HeroSummaryTableProps {
  matches: Match[];
  className?: string;
}

// Mock hero data - this would come from hero context
const mockHeroes: Hero[] = [
  { id: '1', name: 'Crystal Maiden', localizedName: 'Crystal Maiden', primaryAttribute: 'intelligence', attackType: 'ranged', roles: ['Support', 'Disabler'], complexity: 1, imageUrl: '/heroes/crystal_maiden.png' },
  { id: '2', name: 'Juggernaut', localizedName: 'Juggernaut', primaryAttribute: 'agility', attackType: 'melee', roles: ['Carry', 'Pusher'], complexity: 2, imageUrl: '/heroes/juggernaut.png' },
  { id: '3', name: 'Lina', localizedName: 'Lina', primaryAttribute: 'intelligence', attackType: 'ranged', roles: ['Support', 'Nuker'], complexity: 2, imageUrl: '/heroes/lina.png' },
  { id: '4', name: 'Pudge', localizedName: 'Pudge', primaryAttribute: 'strength', attackType: 'melee', roles: ['Disabler', 'Initiator'], complexity: 3, imageUrl: '/heroes/pudge.png' },
  { id: '5', name: 'Axe', localizedName: 'Axe', primaryAttribute: 'strength', attackType: 'melee', roles: ['Initiator', 'Durable'], complexity: 2, imageUrl: '/heroes/axe.png' },
  { id: '6', name: 'Lion', localizedName: 'Lion', primaryAttribute: 'intelligence', attackType: 'ranged', roles: ['Support', 'Disabler'], complexity: 1, imageUrl: '/heroes/lion.png' },
  { id: '7', name: 'Shadow Fiend', localizedName: 'Shadow Fiend', primaryAttribute: 'agility', attackType: 'ranged', roles: ['Carry', 'Nuker'], complexity: 2, imageUrl: '/heroes/shadow_fiend.png' },
  { id: '8', name: 'Tidehunter', localizedName: 'Tidehunter', primaryAttribute: 'strength', attackType: 'melee', roles: ['Initiator', 'Durable'], complexity: 2, imageUrl: '/heroes/tidehunter.png' },
  { id: '9', name: 'Witch Doctor', localizedName: 'Witch Doctor', primaryAttribute: 'intelligence', attackType: 'ranged', roles: ['Support', 'Disabler'], complexity: 1, imageUrl: '/heroes/witch_doctor.png' },
  { id: '10', name: 'Phantom Assassin', localizedName: 'Phantom Assassin', primaryAttribute: 'agility', attackType: 'melee', roles: ['Carry', 'Escape'], complexity: 2, imageUrl: '/heroes/phantom_assassin.png' },
];

function getHeroName(heroId: string): string {
  const hero = mockHeroes.find(h => h.id === heroId);
  return hero ? hero.localizedName : `Hero ${heroId}`;
}

function aggregateHeroes(matches: Match[], isActiveTeam: boolean): HeroSummary[] {
  const heroCounts: Record<string, { count: number; wins: number }> = {};
  matches.forEach(match => {
    // For now, assume all heroes in the match are from the active team
    // In reality, this would need to be filtered based on team side
    match.heroes.forEach(heroId => {
      if (!heroCounts[heroId]) {
        heroCounts[heroId] = { count: 0, wins: 0 };
      }
      heroCounts[heroId].count++;
      if (match.result === 'win') {
        heroCounts[heroId].wins++;
      }
    });
  });
  return Object.entries(heroCounts)
    .map(([heroId, stats]) => ({
      heroId,
      heroName: getHeroName(heroId),
      count: stats.count,
      winRate: isActiveTeam ? (stats.wins / stats.count) * 100 : undefined,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

function HeroSummarySection({ title, heroes, showWinRate = false }: { title: string; heroes: HeroSummary[]; showWinRate?: boolean }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {heroes.map((hero) => (
            <div key={hero.heroId} className="flex items-center justify-between">
              <span className="text-sm">{hero.heroName}</span>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {hero.count}
                </Badge>
                {showWinRate && hero.winRate !== undefined && (
                  <span className="text-xs text-muted-foreground">
                    {hero.winRate.toFixed(1)}%
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export const HeroSummaryTable: React.FC<HeroSummaryTableProps> = ({ matches, className }) => {
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

  const activeTeamPicks = aggregateHeroes(matches, true);
  const opponentTeamPicks = aggregateHeroes(matches, false);
  const activeTeamBans = aggregateHeroes(matches, true); // Placeholder - would need ban data
  const opponentTeamBans = aggregateHeroes(matches, false); // Placeholder - would need ban data

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="text-lg font-semibold">Hero Summary</div>
      <div className="grid grid-cols-1 md:grid-cols-2 p-4 gap-4">
        <HeroSummarySection title="Active Team Picks" heroes={activeTeamPicks} showWinRate />
        <HeroSummarySection title="Opponent Team Picks" heroes={opponentTeamPicks} />
        <HeroSummarySection title="Active Team Bans" heroes={activeTeamBans} />
        <HeroSummarySection title="Opponent Team Bans" heroes={opponentTeamBans} />
      </div>
    </div>
  );
}; 