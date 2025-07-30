import React from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { Match } from '@/types/contexts/match-context-value';
import type { TeamMatchParticipation } from '@/types/contexts/team-context-value';

interface MatchDetailsPanelMinimalProps {
  match: Match;
  teamMatch?: TeamMatchParticipation;
  className?: string;
}

// Mock hero data for testing
const heroes = [
  {
    name: 'Crystal Maiden',
    imageUrl: 'https://dota2protracker.com/static/heroes/crystal_maiden_vert.jpg',
    level: 25,
    kills: 8,
    deaths: 3,
    assists: 12,
    netWorth: 18000,
    gpm: 450,
    xpm: 520,
    lastHits: 120,
    denies: 8
  },
  {
    name: 'Juggernaut',
    imageUrl: 'https://dota2protracker.com/static/heroes/juggernaut_vert.jpg',
    level: 26,
    kills: 15,
    deaths: 2,
    assists: 5,
    netWorth: 28000,
    gpm: 720,
    xpm: 800,
    lastHits: 250,
    denies: 25
  },
  {
    name: 'Lina',
    imageUrl: 'https://dota2protracker.com/static/heroes/lina_vert.jpg',
    level: 24,
    kills: 12,
    deaths: 4,
    assists: 8,
    netWorth: 22000,
    gpm: 580,
    xpm: 680,
    lastHits: 200,
    denies: 20
  },
  {
    name: 'Pudge',
    imageUrl: 'https://dota2protracker.com/static/heroes/pudge_vert.jpg',
    level: 23,
    kills: 10,
    deaths: 6,
    assists: 10,
    netWorth: 20000,
    gpm: 550,
    xpm: 700,
    lastHits: 160,
    denies: 12
  },
  {
    name: 'Axe',
    imageUrl: 'https://dota2protracker.com/static/heroes/axe_vert.jpg',
    level: 22,
    kills: 6,
    deaths: 8,
    assists: 15,
    netWorth: 15000,
    gpm: 480,
    xpm: 620,
    lastHits: 90,
    denies: 5
  }
];

export const MatchDetailsPanelMinimal: React.FC<MatchDetailsPanelMinimalProps> = () => {
  // Mock performance data
  const mockPerformance = {
    kda: { kills: 12, deaths: 3, assists: 8 },
    netWorth: 25000,
    winStreak: 3
  };

  return (
    <div className={`space-y-3`}>
      {/* Hero Avatars */}
      <div className="border rounded-lg p-4">
        <div className="flex items-center gap-2">
          {heroes.map((hero, index) => (
            <Avatar key={index} className="w-8 h-8 border border-background">
              <AvatarImage 
                src={hero.imageUrl} 
                alt={hero.name}
                className="object-cover"
              />
              <AvatarFallback className="text-xs">
                {hero.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          ))}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="border rounded-lg p-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-bold text-primary">
              {mockPerformance.kda.kills}/{mockPerformance.kda.deaths}/{mockPerformance.kda.assists}
            </div>
            <div className="text-xs text-muted-foreground">KDA</div>
          </div>
          <div>
            <div className="text-lg font-bold text-primary">
              {(mockPerformance.netWorth / 1000).toFixed(1)}k
            </div>
            <div className="text-xs text-muted-foreground">Net Worth</div>
          </div>
          <div>
            <div className="text-lg font-bold text-primary">
              {mockPerformance.winStreak}
            </div>
            <div className="text-xs text-muted-foreground">Win Streak</div>
          </div>
        </div>
      </div>
    </div>
  );
}; 