import React from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import type { Match } from '@/types/contexts/match-context-value';

interface MatchDetailsPanelPlayersProps {
  match: Match;
}

interface Player {
  id: string;
  name: string;
  hero: string;
  team: 'radiant' | 'dire';
  level: number;
  kills: number;
  deaths: number;
  assists: number;
  gpm: number;
  xpm: number;
  netWorth: number;
  lastHits: number;
  denies: number;
  items: string[];
  heroImageUrl: string;
}

export const MatchDetailsPanelPlayers: React.FC<MatchDetailsPanelPlayersProps> = ({ match }) => {
  // Mock player data - in real implementation this would come from the match data
  const players: Player[] = [
    {
      id: '1',
      name: 'Player1',
      hero: 'Lina',
      team: 'radiant',
      level: 25,
      kills: 12,
      deaths: 3,
      assists: 8,
      gpm: 650,
      xpm: 750,
      netWorth: 25000,
      lastHits: 180,
      denies: 15,
      items: ['Bloodstone', 'Boots of Travel', 'Aghanim\'s Scepter', 'Blink Dagger', 'Force Staff', 'Glimmer Cape'],
      heroImageUrl: 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/lina.png?'
    },
    {
      id: '2',
      name: 'Player2',
      hero: 'Lion',
      team: 'radiant',
      level: 22,
      kills: 5,
      deaths: 7,
      assists: 15,
      gpm: 450,
      xpm: 520,
      netWorth: 18000,
      lastHits: 80,
      denies: 8,
      items: ['Blink Dagger', 'Aghanim\'s Scepter', 'Force Staff', 'Glimmer Cape', 'Observer Ward', 'Sentry Ward'],
      heroImageUrl: 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/lion.png?'
    },
    {
      id: '3',
      name: 'Player3',
      hero: 'Witch Doctor',
      team: 'radiant',
      level: 20,
      kills: 3,
      deaths: 9,
      assists: 18,
      gpm: 380,
      xpm: 450,
      netWorth: 15000,
      lastHits: 60,
      denies: 5,
      items: ['Aghanim\'s Scepter', 'Glimmer Cape', 'Force Staff', 'Observer Ward', 'Sentry Ward', 'Dust of Appearance'],
      heroImageUrl: 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/witch_doctor.png?'
    },
    {
      id: '4',
      name: 'Player4',
      hero: 'Pudge',
      team: 'dire',
      level: 24,
      kills: 8,
      deaths: 5,
      assists: 12,
      gpm: 580,
      xpm: 680,
      netWorth: 22000,
      lastHits: 120,
      denies: 12,
      items: ['Blink Dagger', 'Aghanim\'s Scepter', 'Heart of Tarrasque', 'Pipe of Insight', 'Crimson Guard', 'Boots of Travel'],
      heroImageUrl: 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/pudge.png?'
    },
    {
      id: '5',
      name: 'Player5',
      hero: 'Axe',
      team: 'dire',
      level: 23,
      kills: 6,
      deaths: 8,
      assists: 14,
      gpm: 520,
      xpm: 600,
      netWorth: 20000,
      lastHits: 140,
      denies: 10,
      items: ['Blink Dagger', 'Blade Mail', 'Crimson Guard', 'Heart of Tarrasque', 'Boots of Travel', 'Observer Ward'],
      heroImageUrl: 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/axe.png?'
    },
    {
      id: '6',
      name: 'Player6',
      hero: 'Phantom Assassin',
      team: 'dire',
      level: 26,
      kills: 15,
      deaths: 4,
      assists: 6,
      gpm: 720,
      xpm: 800,
      netWorth: 28000,
      lastHits: 220,
      denies: 20,
      items: ['Battle Fury', 'Desolator', 'Black King Bar', 'Butterfly', 'Boots of Travel', 'Divine Rapier'],
      heroImageUrl: 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/phantom_assassin.png?'
    }
  ];

  const radiantPlayers = players.filter(p => p.team === 'radiant');
  const direPlayers = players.filter(p => p.team === 'dire');

  const PlayerCard: React.FC<{ player: Player }> = ({ player }) => (
    <Card className="p-4">
      <div className="flex items-start gap-4">
        <Avatar className="w-12 h-12">
          <AvatarImage src={player.heroImageUrl} alt={player.hero} />
          <AvatarFallback>{player.hero.substring(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        
        <div className="flex-1 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">{player.name}</h3>
              <p className="text-sm text-muted-foreground">{player.hero}</p>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold">Level {player.level}</div>
              <div className="text-sm text-muted-foreground">
                {player.kills}/{player.deaths}/{player.assists}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="flex justify-between">
                <span>GPM:</span>
                <span className="font-medium">{player.gpm}</span>
              </div>
              <div className="flex justify-between">
                <span>XPM:</span>
                <span className="font-medium">{player.xpm}</span>
              </div>
              <div className="flex justify-between">
                <span>Net Worth:</span>
                <span className="font-medium">{player.netWorth.toLocaleString()}</span>
              </div>
            </div>
            <div>
              <div className="flex justify-between">
                <span>Last Hits:</span>
                <span className="font-medium">{player.lastHits}</span>
              </div>
              <div className="flex justify-between">
                <span>Denies:</span>
                <span className="font-medium">{player.denies}</span>
              </div>
              <div className="flex justify-between">
                <span>KDA:</span>
                <span className="font-medium">
                  {((player.kills + player.assists) / Math.max(player.deaths, 1)).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-2">Final Items</h4>
            <div className="flex flex-wrap gap-1">
              {player.items.map((item, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {item}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Team Performance Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Team Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium mb-4">Radiant</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Total Kills:</span>
                  <span className="font-medium">{radiantPlayers.reduce((sum, p) => sum + p.kills, 0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Total Deaths:</span>
                  <span className="font-medium">{radiantPlayers.reduce((sum, p) => sum + p.deaths, 0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Average GPM:</span>
                  <span className="font-medium">
                    {Math.round(radiantPlayers.reduce((sum, p) => sum + p.gpm, 0) / radiantPlayers.length)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Average XPM:</span>
                  <span className="font-medium">
                    {Math.round(radiantPlayers.reduce((sum, p) => sum + p.xpm, 0) / radiantPlayers.length)}
                  </span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-medium mb-4">Dire</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Total Kills:</span>
                  <span className="font-medium">{direPlayers.reduce((sum, p) => sum + p.kills, 0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Total Deaths:</span>
                  <span className="font-medium">{direPlayers.reduce((sum, p) => sum + p.deaths, 0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Average GPM:</span>
                  <span className="font-medium">
                    {Math.round(direPlayers.reduce((sum, p) => sum + p.gpm, 0) / direPlayers.length)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Average XPM:</span>
                  <span className="font-medium">
                    {Math.round(direPlayers.reduce((sum, p) => sum + p.xpm, 0) / direPlayers.length)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Radiant Players */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Radiant Players</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {radiantPlayers.map((player) => (
              <PlayerCard key={player.id} player={player} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Dire Players */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Dire Players</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {direPlayers.map((player) => (
              <PlayerCard key={player.id} player={player} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance Highlights */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Performance Highlights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-green-600">15</div>
                <div className="text-sm text-muted-foreground">Most Kills</div>
                <div className="text-xs">Phantom Assassin</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-blue-600">18</div>
                <div className="text-sm text-muted-foreground">Most Assists</div>
                <div className="text-xs">Witch Doctor</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-purple-600">720</div>
                <div className="text-sm text-muted-foreground">Highest GPM</div>
                <div className="text-xs">Phantom Assassin</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 