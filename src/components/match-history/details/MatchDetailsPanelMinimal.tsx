import React from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import type { Match } from '@/types/contexts/match-context-value';

interface MatchDetailsPanelMinimalProps {
  match: Match;
  className?: string;
}

// Mock hero data for demonstration
const mockHeroes = [
  {
    id: '1',
    name: 'crystal_maiden',
    localizedName: 'Crystal Maiden',
    imageUrl: 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/crystal_maiden.png?'
  },
  {
    id: '2',
    name: 'juggernaut',
    localizedName: 'Juggernaut',
    imageUrl: 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/juggernaut.png?'
  },
  {
    id: '3',
    name: 'lina',
    localizedName: 'Lina',
    imageUrl: 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/lina.png?'
  },
  {
    id: '4',
    name: 'pudge',
    localizedName: 'Pudge',
    imageUrl: 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/pudge.png?'
  },
  {
    id: '5',
    name: 'axe',
    localizedName: 'Axe',
    imageUrl: 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/axe.png?'
  }
];

const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
  
  if (diffInHours < 1) return 'Just now';
  if (diffInHours < 24) return `${diffInHours}h ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;
  
  return date.toLocaleDateString();
};

const formatKDA = (kills: number, deaths: number, assists: number): string => {
  const ratio = deaths > 0 ? ((kills + assists) / deaths).toFixed(1) : '∞';
  return `${kills}/${deaths}/${assists} (${ratio})`;
};

export const MatchDetailsPanelMinimal: React.FC<MatchDetailsPanelMinimalProps> = ({
  match,
  className = ''
}) => {
  // Mock performance data
  const mockPerformance = {
    kda: { kills: 12, deaths: 3, assists: 8 },
    netWorth: 25000,
    winStreak: 3
  };

  const isWin = match.result === 'win';
  const duration = formatDuration(match.duration);
  const relativeTime = formatRelativeTime(match.date);

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Compact Match Header */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge 
                variant={isWin ? 'success' : 'destructive'}
                className="text-xs font-medium"
              >
                {isWin ? 'W' : 'L'}
              </Badge>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{match.opponent}</span>
                <span className="text-xs text-muted-foreground">{relativeTime}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-muted-foreground">
                {duration}
              </div>
              <div className="text-xs text-muted-foreground">
                {match.teamSide === 'radiant' ? 'R' : 'D'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hero Avatars */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex -space-x-1">
              {mockHeroes.slice(0, 3).map((hero, index) => (
                <Avatar key={index} className="w-8 h-8 border-2 border-background">
                  <AvatarImage 
                    src={hero.imageUrl} 
                    alt={hero.localizedName}
                    className="object-cover"
                  />
                  <AvatarFallback className="text-xs">
                    {hero.localizedName.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              ))}
              {mockHeroes.length > 3 && (
                <div className="w-8 h-8 bg-muted rounded-full border-2 border-background flex items-center justify-center">
                  <span className="text-xs font-medium text-muted-foreground">
                    +{mockHeroes.length - 3}
                  </span>
                </div>
              )}
            </div>
            <div className="text-right">
              <div className="text-sm font-mono">
                {formatKDA(mockPerformance.kda.kills, mockPerformance.kda.deaths, mockPerformance.kda.assists)}
              </div>
              <div className="text-xs text-muted-foreground">
                {mockPerformance.netWorth.toLocaleString()} NW
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-primary">
                {isWin ? '✓' : '✗'}
              </div>
              <div className="text-xs text-muted-foreground">Result</div>
            </div>
            <div>
              <div className="text-lg font-bold text-primary">
                {mockPerformance.winStreak}
              </div>
              <div className="text-xs text-muted-foreground">Streak</div>
            </div>
            <div>
              <div className="text-lg font-bold text-primary">
                {match.pickOrder === 'first' ? 'FP' : 'SP'}
              </div>
              <div className="text-xs text-muted-foreground">Pick</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Match ID */}
      <Card>
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Match ID</span>
            <span className="text-xs font-mono text-muted-foreground">
              #{match.id}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 