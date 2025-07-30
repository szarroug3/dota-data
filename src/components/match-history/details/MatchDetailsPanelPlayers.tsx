import React from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import type { Match } from '@/types/contexts/match-context-value';
import type { TeamMatchParticipation } from '@/types/contexts/team-context-value';

interface MatchDetailsPanelPlayersProps {
  match?: Match;
  teamMatch?: TeamMatchParticipation;
  className?: string;
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

// Mock player data - in real implementation this would come from the match data
const mockPlayers: Player[] = [
  {
    id: '1',
    name: 'Player1',
    hero: 'Lina',
    team: 'radiant' as const,
    heroImageUrl: 'https://dota2protracker.com/static/heroes/lina_vert.jpg',
    level: 25,
    kills: 12,
    deaths: 3,
    assists: 8,
    netWorth: 25000,
    lastHits: 180,
    denies: 15,
    gpm: 650,
    xpm: 750,
    items: ['Blink Dagger', 'Aghanim\'s Scepter', 'Boots of Travel', 'Eul\'s Scepter', 'Force Staff', 'Aether Lens']
  },
  {
    id: '2',
    name: 'Player2',
    hero: 'Lion',
    team: 'radiant' as const,
    heroImageUrl: 'https://dota2protracker.com/static/heroes/lion_vert.jpg',
    level: 22,
    kills: 8,
    deaths: 5,
    assists: 15,
    netWorth: 18000,
    lastHits: 120,
    denies: 8,
    gpm: 520,
    xpm: 680,
    items: ['Blink Dagger', 'Aghanim\'s Scepter', 'Boots of Travel', 'Force Staff', 'Glimmer Cape', 'Aether Lens']
  },
  {
    id: '3',
    name: 'Player3',
    hero: 'Witch Doctor',
    team: 'radiant' as const,
    heroImageUrl: 'https://dota2protracker.com/static/heroes/witch_doctor_vert.jpg',
    level: 20,
    kills: 6,
    deaths: 7,
    assists: 18,
    netWorth: 15000,
    lastHits: 90,
    denies: 5,
    gpm: 480,
    xpm: 620,
    items: ['Aghanim\'s Scepter', 'Boots of Travel', 'Glimmer Cape', 'Force Staff', 'Aether Lens', 'Blink Dagger']
  },
  {
    id: '4',
    name: 'Player4',
    hero: 'Pudge',
    team: 'dire' as const,
    heroImageUrl: 'https://dota2protracker.com/static/heroes/pudge_vert.jpg',
    level: 24,
    kills: 15,
    deaths: 4,
    assists: 10,
    netWorth: 22000,
    lastHits: 200,
    denies: 20,
    gpm: 580,
    xpm: 720,
    items: ['Blink Dagger', 'Aghanim\'s Scepter', 'Boots of Travel', 'Heart of Tarrasque', 'Pipe of Insight', 'Crimson Guard']
  },
  {
    id: '5',
    name: 'Player5',
    hero: 'Axe',
    team: 'dire' as const,
    heroImageUrl: 'https://dota2protracker.com/static/heroes/axe_vert.jpg',
    level: 23,
    kills: 10,
    deaths: 6,
    assists: 12,
    netWorth: 20000,
    lastHits: 160,
    denies: 12,
    gpm: 550,
    xpm: 700,
    items: ['Blink Dagger', 'Aghanim\'s Scepter', 'Boots of Travel', 'Crimson Guard', 'Pipe of Insight', 'Heart of Tarrasque']
  },
  {
    id: '6',
    name: 'Player6',
    hero: 'Phantom Assassin',
    team: 'dire' as const,
    heroImageUrl: 'https://dota2protracker.com/static/heroes/phantom_assassin_vert.jpg',
    level: 26,
    kills: 18,
    deaths: 2,
    assists: 5,
    netWorth: 28000,
    lastHits: 250,
    denies: 25,
    gpm: 720,
    xpm: 800,
    items: ['Battle Fury', 'Desolator', 'Boots of Travel', 'Black King Bar', 'Monkey King Bar', 'Butterfly']
  }
];

// Extracted component for Player Card
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
          <div className="flex items-center gap-4">
            <div className="flex flex-wrap gap-1">
              {player.items.map((item, index) => {
                // Convert item name to URL format (lowercase, replace spaces with hyphens, remove apostrophes)
                const itemKey = item.toLowerCase().replace(/\s+/g, '-').replace(/'/g, '');
                const itemImageUrl = `https://dotabuff.com/assets/items/${itemKey}.jpg`;
                
                return (
                  <Avatar key={index} className="w-6 h-6">
                    <AvatarImage 
                      src={itemImageUrl} 
                      alt={item}
                      className="object-cover object-center"
                    />
                    <AvatarFallback className="text-xs">
                      {item.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                );
              })}
            </div>
            <div className="text-right">
              <div className="text-lg font-bold">Level {player.level}</div>
              <div className="text-sm text-muted-foreground">
                {player.kills}/{player.deaths}/{player.assists}
              </div>
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
      </div>
    </div>
  </Card>
);

// Extracted component for Team Statistics
const TeamStatistics = () => {
  const radiantPlayers = mockPlayers.filter(p => p.team === 'radiant');
  const direPlayers = mockPlayers.filter(p => p.team === 'dire');

  return (
    <div className="border rounded-lg p-4">
      <div className="pb-3">
        <h3 className="text-lg font-semibold">Team Statistics</h3>
      </div>
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
    </div>
  );
};

// Extracted component for Radiant Players
const RadiantPlayers = () => {
  const radiantPlayers = mockPlayers.filter(p => p.team === 'radiant');

  return (
    <div className="border rounded-lg p-4">
      <div className="pb-3">
        <h3 className="text-lg font-semibold">Radiant Players</h3>
      </div>
      <div className="space-y-4">
        {radiantPlayers.map((player) => (
          <PlayerCard key={player.id} player={player} />
        ))}
      </div>
    </div>
  );
};

// Extracted component for Dire Players
const DirePlayers = () => {
  const direPlayers = mockPlayers.filter(p => p.team === 'dire');

  return (
    <div className="border rounded-lg p-4">
      <div className="pb-3">
        <h3 className="text-lg font-semibold">Dire Players</h3>
      </div>
      <div className="space-y-4">
        {direPlayers.map((player) => (
          <PlayerCard key={player.id} player={player} />
        ))}
      </div>
    </div>
  );
};

// Extracted component for Performance Highlights
const PerformanceHighlights = () => (
  <div className="border rounded-lg p-4">
    <div className="pb-3">
      <h3 className="text-lg font-semibold">Performance Highlights</h3>
    </div>
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
  </div>
);

export const MatchDetailsPanelPlayers: React.FC<MatchDetailsPanelPlayersProps> = () => {
  return (
    <div className="space-y-4">
      <TeamStatistics />
      <RadiantPlayers />
      <DirePlayers />
      <PerformanceHighlights />
    </div>
  );
}; 