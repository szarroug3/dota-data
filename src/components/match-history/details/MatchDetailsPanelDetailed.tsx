import React from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Match } from '@/types/contexts/match-context-value';

interface MatchDetailsPanelDetailedProps {
  match: Match;
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

const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const formatKDA = (kills: number, deaths: number, assists: number): string => {
  return `${kills}/${deaths}/${assists}`;
};

const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export const MatchDetailsPanelDetailed: React.FC<MatchDetailsPanelDetailedProps> = ({
  match,
  className = ''
}) => {
  // Mock team performance data
  const mockTeamPerformance = {
    radiant: {
      score: 25,
      netWorth: 85000,
      towers: 8,
      barracks: 2,
      roshanKills: 2
    },
    dire: {
      score: 18,
      netWorth: 72000,
      towers: 4,
      barracks: 0,
      roshanKills: 1
    }
  };

  const isWin = match.result === 'win';
  const duration = formatDuration(match.duration);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Match Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge 
                variant={isWin ? 'success' : 'destructive'}
                className="text-sm font-medium"
              >
                {isWin ? 'Victory' : 'Defeat'}
              </Badge>
              <Badge variant="outline" className="text-sm">
                {match.teamSide === 'radiant' ? 'Radiant' : 'Dire'}
              </Badge>
              <Badge variant="secondary" className="text-sm">
                {match.pickOrder === 'first' ? 'First Pick' : 'Second Pick'}
              </Badge>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-muted-foreground">
                {duration}
              </div>
              <div className="text-sm text-muted-foreground">
                Match #{match.id}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Opponent:</span>
              <span className="text-sm">{match.opponent}</span>
            </div>
            <div className="text-sm text-muted-foreground">
              {new Date(match.date).toLocaleDateString()}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Team Performance Comparison */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Team Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            {/* Radiant */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="font-medium">Radiant</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Score</span>
                  <span className="font-mono">{mockTeamPerformance.radiant.score}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Net Worth</span>
                  <span className="font-mono">{mockTeamPerformance.radiant.netWorth.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Towers</span>
                  <span className="font-mono">{mockTeamPerformance.radiant.towers}/11</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Barracks</span>
                  <span className="font-mono">{mockTeamPerformance.radiant.barracks}/6</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Roshan</span>
                  <span className="font-mono">{mockTeamPerformance.radiant.roshanKills}</span>
                </div>
              </div>
            </div>

            {/* Dire */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="font-medium">Dire</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Score</span>
                  <span className="font-mono">{mockTeamPerformance.dire.score}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Net Worth</span>
                  <span className="font-mono">{mockTeamPerformance.dire.netWorth.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Towers</span>
                  <span className="font-mono">{mockTeamPerformance.dire.towers}/11</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Barracks</span>
                  <span className="font-mono">{mockTeamPerformance.dire.barracks}/6</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Roshan</span>
                  <span className="font-mono">{mockTeamPerformance.dire.roshanKills}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Player Details */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Player Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {heroes.map((hero) => (
              <div key={hero.name} className="border rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage 
                      src={hero.imageUrl} 
                      alt={hero.name}
                    />
                    <AvatarFallback className="text-xs">
                      {hero.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="font-medium">{hero.name}</div>
                    <div className="text-sm text-muted-foreground">Level {hero.level}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-sm">
                      {formatKDA(hero.kills, hero.deaths, hero.assists)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {hero.gpm} GPM / {hero.xpm} XPM
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span>Net Worth</span>
                      <span className="font-mono">{hero.netWorth.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Last Hits</span>
                      <span className="font-mono">{hero.lastHits}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Denies</span>
                      <span className="font-mono">{hero.denies}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Match Timeline */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Match Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-green-600 font-medium">First Blood</span>
              <span className="font-mono">{formatTime(135)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-blue-600 font-medium">First Tower</span>
              <span className="font-mono">{formatTime(420)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-orange-600 font-medium">Roshan Kill</span>
              <span className="font-mono">{formatTime(1110)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-purple-600 font-medium">Aegis Expired</span>
              <span className="font-mono">{formatTime(1410)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-red-600 font-medium">Ancient Destroyed</span>
              <span className="font-mono">{duration}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Draft Information */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Draft Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-green-600 mb-2">Radiant Picks</h4>
              <div className="space-y-1 text-sm">
                <div>1. Crystal Maiden</div>
                <div>2. Juggernaut</div>
                <div>3. Lina</div>
                <div>4. Pudge</div>
                <div>5. Axe</div>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-red-600 mb-2">Dire Picks</h4>
              <div className="space-y-1 text-sm">
                <div>1. Lion</div>
                <div>2. Phantom Assassin</div>
                <div>3. Shadow Fiend</div>
                <div>4. Tidehunter</div>
                <div>5. Witch Doctor</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 