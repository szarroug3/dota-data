import React from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { Match } from '@/types/contexts/match-context-value';

interface MatchDetailsPanelSummaryProps {
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
    assists: 12
  },
  {
    name: 'Juggernaut',
    imageUrl: 'https://dota2protracker.com/static/heroes/juggernaut_vert.jpg',
    level: 26,
    kills: 15,
    deaths: 2,
    assists: 5
  },
  {
    name: 'Lina',
    imageUrl: 'https://dota2protracker.com/static/heroes/lina_vert.jpg',
    level: 24,
    kills: 12,
    deaths: 4,
    assists: 8
  },
  {
    name: 'Pudge',
    imageUrl: 'https://dota2protracker.com/static/heroes/pudge_vert.jpg',
    level: 23,
    kills: 10,
    deaths: 6,
    assists: 10
  },
  {
    name: 'Axe',
    imageUrl: 'https://dota2protracker.com/static/heroes/axe_vert.jpg',
    level: 22,
    kills: 6,
    deaths: 8,
    assists: 15
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

export const MatchDetailsPanelSummary: React.FC<MatchDetailsPanelSummaryProps> = ({
  match,
  className = ''
}) => {
  // Mock performance data
  const mockPerformance = {
    kda: { kills: 12, deaths: 3, assists: 8 },
    netWorth: 25000,
    heroDamage: 18500,
    towerDamage: 3200,
    healing: 2800,
    cs: 180,
    denies: 12
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

      {/* Hero Lineup */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Hero Lineup</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            {heroes.map((hero, index) => (
              <Avatar key={index} className="w-12 h-12 border-2 border-background">
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
        </CardContent>
      </Card>

      {/* Key Performance Metrics */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Performance Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* KDA */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">KDA Ratio</span>
            <span className="text-sm font-mono">
              {formatKDA(mockPerformance.kda.kills, mockPerformance.kda.deaths, mockPerformance.kda.assists)}
            </span>
          </div>

          {/* Net Worth */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Net Worth</span>
              <span className="text-sm font-mono">
                {mockPerformance.netWorth.toLocaleString()}
              </span>
            </div>
            <Progress value={75} className="h-2" />
          </div>

          {/* Damage Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Hero Damage</span>
                <span className="text-sm font-mono">
                  {mockPerformance.heroDamage.toLocaleString()}
                </span>
              </div>
              <Progress value={65} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Tower Damage</span>
                <span className="text-sm font-mono">
                  {mockPerformance.towerDamage.toLocaleString()}
                </span>
              </div>
              <Progress value={45} className="h-2" />
            </div>
          </div>

          {/* Additional Stats */}
          <div className="grid grid-cols-3 gap-4 pt-2">
            <div className="text-center">
              <div className="text-lg font-bold text-primary">
                {mockPerformance.healing.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">Healing</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-primary">
                {mockPerformance.cs}
              </div>
              <div className="text-xs text-muted-foreground">CS</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-primary">
                {mockPerformance.denies}
              </div>
              <div className="text-xs text-muted-foreground">Denies</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Match Timeline Preview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Key Events</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-green-600">First Blood</span>
              <span className="font-mono">02:15</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-blue-600">Roshan Kill</span>
              <span className="font-mono">18:32</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-orange-600">Aegis Expired</span>
              <span className="font-mono">23:45</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-red-600">Ancient Destroyed</span>
              <span className="font-mono">{duration}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 