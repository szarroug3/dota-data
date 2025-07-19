import React from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import type { Match } from '@/types/contexts/match-context-value';

interface MatchDetailsPanelDetailedProps {
  match: Match;
  className?: string;
}

// Mock player data for demonstration
const mockPlayers = [
  {
    id: '1',
    name: 'Player1',
    hero: {
      id: '1',
      name: 'crystal_maiden',
      localizedName: 'Crystal Maiden',
      imageUrl: 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/crystal_maiden.png?'
    },
    stats: {
      kills: 8,
      deaths: 2,
      assists: 15,
      gpm: 450,
      xpm: 520,
      heroDamage: 12500,
      towerDamage: 800,
      healing: 3500,
      cs: 120,
      denies: 8,
      items: ['item_ward_observer', 'item_tranquil_boots', 'item_force_staff', 'item_glimmer_cape']
    }
  },
  {
    id: '2',
    name: 'Player2',
    hero: {
      id: '2',
      name: 'juggernaut',
      localizedName: 'Juggernaut',
      imageUrl: 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/juggernaut.png?'
    },
    stats: {
      kills: 12,
      deaths: 3,
      assists: 4,
      gpm: 650,
      xpm: 720,
      heroDamage: 18500,
      towerDamage: 3200,
      healing: 0,
      cs: 280,
      denies: 15,
      items: ['item_phase_boots', 'item_maelstrom', 'item_black_king_bar', 'item_butterfly']
    }
  },
  {
    id: '3',
    name: 'Player3',
    hero: {
      id: '3',
      name: 'lina',
      localizedName: 'Lina',
      imageUrl: 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/lina.png?'
    },
    stats: {
      kills: 15,
      deaths: 4,
      assists: 6,
      gpm: 580,
      xpm: 650,
      heroDamage: 22000,
      towerDamage: 1500,
      healing: 0,
      cs: 200,
      denies: 12,
      items: ['item_arcane_boots', 'item_euls_scepter', 'item_bloodstone', 'item_octarine_core']
    }
  },
  {
    id: '4',
    name: 'Player4',
    hero: {
      id: '4',
      name: 'pudge',
      localizedName: 'Pudge',
      imageUrl: 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/pudge.png?'
    },
    stats: {
      kills: 6,
      deaths: 5,
      assists: 18,
      gpm: 380,
      xpm: 420,
      heroDamage: 8500,
      towerDamage: 500,
      healing: 0,
      cs: 80,
      denies: 5,
      items: ['item_boots', 'item_blink', 'item_heart', 'item_aghanims_scepter']
    }
  },
  {
    id: '5',
    name: 'Player5',
    hero: {
      id: '5',
      name: 'axe',
      localizedName: 'Axe',
      imageUrl: 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/axe.png?'
    },
    stats: {
      kills: 4,
      deaths: 6,
      assists: 12,
      gpm: 420,
      xpm: 480,
      heroDamage: 9500,
      towerDamage: 1200,
      healing: 0,
      cs: 150,
      denies: 10,
      items: ['item_vanguard', 'item_blink', 'item_blade_mail', 'item_crimson_guard']
    }
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
            {mockPlayers.map((player, index) => (
              <div key={player.id} className="border rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage 
                      src={player.hero.imageUrl} 
                      alt={player.hero.localizedName}
                    />
                    <AvatarFallback className="text-xs">
                      {player.hero.localizedName.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="font-medium">{player.name}</div>
                    <div className="text-sm text-muted-foreground">{player.hero.localizedName}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-sm">
                      {formatKDA(player.stats.kills, player.stats.deaths, player.stats.assists)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {player.stats.gpm} GPM / {player.stats.xpm} XPM
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span>Hero Damage</span>
                      <span className="font-mono">{player.stats.heroDamage.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tower Damage</span>
                      <span className="font-mono">{player.stats.towerDamage.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Healing</span>
                      <span className="font-mono">{player.stats.healing.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span>CS</span>
                      <span className="font-mono">{player.stats.cs}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Denies</span>
                      <span className="font-mono">{player.stats.denies}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Items</span>
                      <span className="font-mono">{player.stats.items.length}</span>
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