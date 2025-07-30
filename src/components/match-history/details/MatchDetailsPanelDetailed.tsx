import React from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { Match } from '@/types/contexts/match-context-value';
import type { TeamMatchParticipation } from '@/types/contexts/team-context-value';

interface MatchDetailsPanelDetailedProps {
  match?: Match;
  teamMatch?: TeamMatchParticipation;
  className?: string;
}

// Mock hero data - in real implementation this would come from the match data
const heroes = [
  {
    name: 'Crystal Maiden',
    imageUrl: 'https://dota2protracker.com/static/heroes/crystal_maiden_vert.jpg',
    level: 25,
    kills: 8,
    deaths: 4,
    assists: 12,
    netWorth: 18000,
    gpm: 450,
    xpm: 600,
    lastHits: 120,
    denies: 8
  },
  {
    name: 'Juggernaut',
    imageUrl: 'https://dota2protracker.com/static/heroes/juggernaut_vert.jpg',
    level: 26,
    kills: 15,
    deaths: 3,
    assists: 8,
    netWorth: 25000,
    gpm: 650,
    xpm: 750,
    lastHits: 200,
    denies: 15
  },
  {
    name: 'Lina',
    imageUrl: 'https://dota2protracker.com/static/heroes/lina_vert.jpg',
    level: 24,
    kills: 12,
    deaths: 5,
    assists: 10,
    netWorth: 22000,
    gpm: 580,
    xpm: 680,
    lastHits: 180,
    denies: 12
  },
  {
    name: 'Pudge',
    imageUrl: 'https://dota2protracker.com/static/heroes/pudge_vert.jpg',
    level: 23,
    kills: 6,
    deaths: 8,
    assists: 15,
    netWorth: 16000,
    gpm: 420,
    xpm: 550,
    lastHits: 90,
    denies: 5
  },
  {
    name: 'Axe',
    imageUrl: 'https://dota2protracker.com/static/heroes/axe_vert.jpg',
    level: 22,
    kills: 4,
    deaths: 6,
    assists: 18,
    netWorth: 14000,
    gpm: 380,
    xpm: 520,
    lastHits: 80,
    denies: 3
  }
];

// Helper functions
const formatKDA = (kills: number, deaths: number, assists: number): string => {
  return `${kills}/${deaths}/${assists}`;
};

const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

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

// Extracted component for Team Performance
const TeamPerformance = () => (
  <div className="border rounded-lg p-4">
    <div className="pb-3">
      <h3 className="text-lg font-semibold">Team Performance</h3>
    </div>
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
  </div>
);

// Extracted component for Player Performance
const PlayerPerformance = () => (
  <div className="border rounded-lg p-4">
    <div className="pb-3">
      <h3 className="text-lg font-semibold">Player Performance</h3>
    </div>
    <div className="space-y-4">
      {heroes.map((hero) => (
        <div key={hero.name} className="border rounded-lg p-4">
          <div className="flex items-center gap-3 mb-3">
            <Avatar className="w-10 h-10">
              <AvatarImage 
                src={hero.imageUrl} 
                alt={hero.name}
                className="object-cover"
              />
              <AvatarFallback className="text-xs">
                {hero.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="font-medium">{hero.name}</div>
              <div className="text-sm text-muted-foreground">
                Level {hero.level} • {formatKDA(hero.kills, hero.deaths, hero.assists)} KDA
              </div>
            </div>
            <div className="text-right">
              <div className="font-mono text-sm">{hero.netWorth.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">
                {hero.gpm} GPM • {hero.xpm} XPM
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Last Hits</span>
                <span className="font-mono">{hero.lastHits}</span>
              </div>
              <div className="flex justify-between">
                <span>Denies</span>
                <span className="font-mono">{hero.denies}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>GPM</span>
                <span className="font-mono">{hero.gpm}</span>
              </div>
              <div className="flex justify-between">
                <span>XPM</span>
                <span className="font-mono">{hero.xpm}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Extracted component for Match Timeline
const MatchTimeline = () => (
  <div className="border rounded-lg p-4">
    <div className="pb-3">
      <h3 className="text-lg font-semibold">Match Timeline</h3>
    </div>
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        <span className="text-sm font-medium">First Blood</span>
        <span className="text-sm text-muted-foreground">{formatTime(120)}</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
        <span className="text-sm font-medium">Tower Destroyed</span>
        <span className="text-sm text-muted-foreground">{formatTime(480)}</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
        <span className="text-sm font-medium">Roshan Killed</span>
        <span className="text-sm text-muted-foreground">{formatTime(900)}</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
        <span className="text-sm font-medium">Ancient Destroyed</span>
        <span className="text-sm text-muted-foreground">{formatTime(1800)}</span>
      </div>
    </div>
  </div>
);

export const MatchDetailsPanelDetailed: React.FC<MatchDetailsPanelDetailedProps> = () => {
  return (
    <div className="space-y-4">
      <TeamPerformance />
      <PlayerPerformance />
      <MatchTimeline />
    </div>
  );
}; 