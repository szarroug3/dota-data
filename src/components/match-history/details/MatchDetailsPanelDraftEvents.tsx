import React from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { Match } from '@/types/contexts/match-context-value';

interface MatchDetailsPanelDraftEventsProps {
  match: Match;
}

interface DraftPhase {
  phase: 'ban' | 'pick';
  team: 'radiant' | 'dire';
  hero: string;
  time: number;
}

interface GameEvent {
  type: 'roshan' | 'aegis' | 'teamfight' | 'tower' | 'barracks';
  time: number;
  description: string;
  team?: 'radiant' | 'dire';
}

interface Hero {
  name: string;
  imageUrl: string;
  localizedName: string;
}

export const MatchDetailsPanelDraftEvents: React.FC<MatchDetailsPanelDraftEventsProps> = ({ match }) => {
  // Mock hero data - in real implementation this would come from the match data
  const heroes: Record<string, Hero> = {
    'crystal_maiden': {
      name: 'crystal_maiden',
      imageUrl: 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/crystal_maiden.png?',
      localizedName: 'Crystal Maiden'
    },
    'juggernaut': {
      name: 'juggernaut',
      imageUrl: 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/juggernaut.png?',
      localizedName: 'Juggernaut'
    },
    'lina': {
      name: 'lina',
      imageUrl: 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/lina.png?',
      localizedName: 'Lina'
    },
    'pudge': {
      name: 'pudge',
      imageUrl: 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/pudge.png?',
      localizedName: 'Pudge'
    },
    'axe': {
      name: 'axe',
      imageUrl: 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/axe.png?',
      localizedName: 'Axe'
    },
    'lion': {
      name: 'lion',
      imageUrl: 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/lion.png?',
      localizedName: 'Lion'
    },
    'shadow_fiend': {
      name: 'shadow_fiend',
      imageUrl: 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/nevermore.png?',
      localizedName: 'Shadow Fiend'
    },
    'tidehunter': {
      name: 'tidehunter',
      imageUrl: 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/tidehunter.png?',
      localizedName: 'Tidehunter'
    },
    'witch_doctor': {
      name: 'witch_doctor',
      imageUrl: 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/witch_doctor.png?',
      localizedName: 'Witch Doctor'
    },
    'phantom_assassin': {
      name: 'phantom_assassin',
      imageUrl: 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/phantom_assassin.png?',
      localizedName: 'Phantom Assassin'
    }
  };

  // Mock draft data - in real implementation this would come from the match data
  const draftPhases: DraftPhase[] = [
    { phase: 'ban', team: 'radiant', hero: 'crystal_maiden', time: 0 },
    { phase: 'ban', team: 'dire', hero: 'juggernaut', time: 0 },
    { phase: 'pick', team: 'radiant', hero: 'lina', time: 10 },
    { phase: 'pick', team: 'dire', hero: 'pudge', time: 15 },
    { phase: 'pick', team: 'dire', hero: 'axe', time: 20 },
    { phase: 'pick', team: 'radiant', hero: 'lion', time: 25 },
    { phase: 'ban', team: 'dire', hero: 'shadow_fiend', time: 30 },
    { phase: 'ban', team: 'radiant', hero: 'tidehunter', time: 35 },
    { phase: 'pick', team: 'radiant', hero: 'witch_doctor', time: 40 },
    { phase: 'pick', team: 'dire', hero: 'phantom_assassin', time: 45 },
  ];

  // Mock game events
  const gameEvents: GameEvent[] = [
    { type: 'roshan', time: 600, description: 'Radiant killed Roshan', team: 'radiant' },
    { type: 'aegis', time: 605, description: 'Aegis picked up by Lina', team: 'radiant' },
    { type: 'teamfight', time: 900, description: 'Team fight at mid lane - Radiant victory', team: 'radiant' },
    { type: 'tower', time: 1200, description: 'Dire destroyed Radiant mid tower', team: 'dire' },
    { type: 'roshan', time: 1800, description: 'Dire killed Roshan', team: 'dire' },
    { type: 'aegis', time: 1805, description: 'Aegis picked up by Phantom Assassin', team: 'dire' },
    { type: 'teamfight', time: 2100, description: 'Team fight at Dire base - Dire victory', team: 'dire' },
    { type: 'barracks', time: 2400, description: 'Radiant destroyed Dire barracks', team: 'radiant' },
  ];

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Separate picks and bans by team
  const radiantPicks = draftPhases.filter(phase => phase.team === 'radiant' && phase.phase === 'pick');
  const radiantBans = draftPhases.filter(phase => phase.team === 'radiant' && phase.phase === 'ban');
  const direPicks = draftPhases.filter(phase => phase.team === 'dire' && phase.phase === 'pick');
  const direBans = draftPhases.filter(phase => phase.team === 'dire' && phase.phase === 'ban');

  const HeroBadge: React.FC<{ heroKey: string; phase: 'pick' | 'ban'; time: number }> = ({ heroKey, phase, time }) => {
    const hero = heroes[heroKey];
    if (!hero) return null;

    return (
      <div className="flex items-center gap-2 p-2 rounded-lg border">
        <Avatar className="w-8 h-8">
          <AvatarImage src={hero.imageUrl} alt={hero.localizedName} />
          <AvatarFallback className="text-xs">{hero.localizedName.substring(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="font-medium text-sm">{hero.localizedName}</div>
          <div className="text-xs text-muted-foreground">{formatTime(time)}s</div>
        </div>
        <Badge variant={phase === 'pick' ? 'default' : 'secondary'} className="text-xs">
          {phase === 'pick' ? 'PICK' : 'BAN'}
        </Badge>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Draft Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Draft</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Radiant Side */}
            <div>
              <h3 className="font-medium mb-4 text-blue-600">Radiant</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Picks</h4>
                  <div className="space-y-2">
                    {radiantPicks.map((phase, index) => (
                      <HeroBadge key={index} heroKey={phase.hero} phase={phase.phase} time={phase.time} />
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-2">Bans</h4>
                  <div className="space-y-2">
                    {radiantBans.map((phase, index) => (
                      <HeroBadge key={index} heroKey={phase.hero} phase={phase.phase} time={phase.time} />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Dire Side */}
            <div>
              <h3 className="font-medium mb-4 text-red-600">Dire</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Picks</h4>
                  <div className="space-y-2">
                    {direPicks.map((phase, index) => (
                      <HeroBadge key={index} heroKey={phase.hero} phase={phase.phase} time={phase.time} />
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-2">Bans</h4>
                  <div className="space-y-2">
                    {direBans.map((phase, index) => (
                      <HeroBadge key={index} heroKey={phase.hero} phase={phase.phase} time={phase.time} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Events Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Game Events</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              {gameEvents.map((event, index) => (
                <div key={index} className="flex items-center gap-3 p-3 rounded-lg border">
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={event.team === 'radiant' ? 'outline' : 'secondary'}
                      className="text-xs"
                    >
                      {event.team === 'radiant' ? 'RADIANT' : 'DIRE'}
                    </Badge>
                    <Badge 
                      variant={
                        event.type === 'roshan' ? 'default' :
                        event.type === 'aegis' ? 'secondary' :
                        event.type === 'teamfight' ? 'destructive' :
                        event.type === 'tower' ? 'outline' : 'secondary'
                      }
                      className="text-xs"
                    >
                      {event.type.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{event.description}</div>
                    <div className="text-sm text-muted-foreground">
                      {formatTime(event.time)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Team Fight Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Team Fight Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Radiant Team Fights</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Total Fights:</span>
                    <span className="font-medium">3</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Wins:</span>
                    <span className="font-medium text-green-600">2</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Losses:</span>
                    <span className="font-medium text-red-600">1</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Dire Team Fights</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Total Fights:</span>
                    <span className="font-medium">3</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Wins:</span>
                    <span className="font-medium text-green-600">1</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Losses:</span>
                    <span className="font-medium text-red-600">2</span>
                  </div>
                </div>
              </div>
            </div>
            <Separator />
            <div className="text-sm text-muted-foreground">
              <p>Key team fights occurred at 9:00, 21:00, and 24:00 minutes.</p>
              <p>The final team fight at 24:00 was decisive in determining the match outcome.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 