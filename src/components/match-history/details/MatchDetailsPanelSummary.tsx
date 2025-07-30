import React from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import type { Match } from '@/types/contexts/match-context-value';
import type { TeamMatchParticipation } from '@/types/contexts/team-context-value';

interface MatchDetailsPanelSummaryProps {
  match?: Match;
  teamMatch?: TeamMatchParticipation;
  className?: string;
}

// Mock hero data - in real implementation this would come from the match data
const heroes = [
  {
    name: 'Crystal Maiden',
    imageUrl: 'https://dota2protracker.com/static/heroes/crystal_maiden_vert.jpg'
  },
  {
    name: 'Juggernaut',
    imageUrl: 'https://dota2protracker.com/static/heroes/juggernaut_vert.jpg'
  },
  {
    name: 'Lina',
    imageUrl: 'https://dota2protracker.com/static/heroes/lina_vert.jpg'
  },
  {
    name: 'Pudge',
    imageUrl: 'https://dota2protracker.com/static/heroes/pudge_vert.jpg'
  },
  {
    name: 'Axe',
    imageUrl: 'https://dota2protracker.com/static/heroes/axe_vert.jpg'
  }
];

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

// Extracted component for Hero Lineup
const HeroLineup = () => (
  <div className="border rounded-lg p-4">
    <div className="pb-3">
      <h3 className="text-lg font-semibold">Hero Lineup</h3>
    </div>
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
  </div>
);

// Extracted component for Key Performance Metrics
const KeyPerformanceMetrics = () => (
  <div className="border rounded-lg p-4">
    <div className="pb-3">
      <h3 className="text-lg font-semibold">Key Performance Metrics</h3>
    </div>
    <div className="space-y-4">
      <div>
        <div className="flex justify-between text-sm mb-1">
          <span>KDA</span>
          <span className="font-mono">{mockPerformance.kda.kills}/{mockPerformance.kda.deaths}/{mockPerformance.kda.assists}</span>
        </div>
        <Progress value={75} className="h-2" />
      </div>
      
      <div>
        <div className="flex justify-between text-sm mb-1">
          <span>Net Worth</span>
          <span className="font-mono">{mockPerformance.netWorth.toLocaleString()}</span>
        </div>
        <Progress value={85} className="h-2" />
      </div>
      
      <div>
        <div className="flex justify-between text-sm mb-1">
          <span>Hero Damage</span>
          <span className="font-mono">{mockPerformance.heroDamage.toLocaleString()}</span>
        </div>
        <Progress value={70} className="h-2" />
      </div>
      
      <div>
        <div className="flex justify-between text-sm mb-1">
          <span>Tower Damage</span>
          <span className="font-mono">{mockPerformance.towerDamage.toLocaleString()}</span>
        </div>
        <Progress value={60} className="h-2" />
      </div>
      
      <div>
        <div className="flex justify-between text-sm mb-1">
          <span>Healing</span>
          <span className="font-mono">{mockPerformance.healing.toLocaleString()}</span>
        </div>
        <Progress value={45} className="h-2" />
      </div>
      
      <div>
        <div className="flex justify-between text-sm mb-1">
          <span>Last Hits</span>
          <span className="font-mono">{mockPerformance.cs}</span>
        </div>
        <Progress value={80} className="h-2" />
      </div>
      
      <div>
        <div className="flex justify-between text-sm mb-1">
          <span>Denies</span>
          <span className="font-mono">{mockPerformance.denies}</span>
        </div>
        <Progress value={65} className="h-2" />
      </div>
    </div>
  </div>
);

// Extracted component for Match Statistics
const MatchStatistics = () => (
  <div className="border rounded-lg p-4">
    <div className="pb-3">
      <h3 className="text-lg font-semibold">Match Statistics</h3>
    </div>
    <div className="grid grid-cols-2 gap-4 text-sm">
      <div className="space-y-2">
        <div className="flex justify-between">
          <span>Total Kills</span>
          <span className="font-mono">45</span>
        </div>
        <div className="flex justify-between">
          <span>Total Deaths</span>
          <span className="font-mono">32</span>
        </div>
        <div className="flex justify-between">
          <span>Total Assists</span>
          <span className="font-mono">78</span>
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between">
          <span>Average GPM</span>
          <span className="font-mono">580</span>
        </div>
        <div className="flex justify-between">
          <span>Average XPM</span>
          <span className="font-mono">650</span>
        </div>
        <div className="flex justify-between">
          <span>Total Net Worth</span>
          <span className="font-mono">125K</span>
        </div>
      </div>
    </div>
  </div>
);

export const MatchDetailsPanelSummary: React.FC<MatchDetailsPanelSummaryProps> = () => {
  return (
    <div className="space-y-4">
      <HeroLineup />
      <KeyPerformanceMetrics />
      <MatchStatistics />
    </div>
  );
}; 