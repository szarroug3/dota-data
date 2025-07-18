import React from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Hero } from '@/types/contexts/hero-context-value';
import type { Match } from '@/types/contexts/match-context-value';

import { HideButton } from '../common/HideButton';
import { RefreshButton } from '../common/RefreshButton';

import { DateDuration } from './DateDuration';
import { HeroAvatars } from '../common/HeroAvatars';
import { ResponsiveBadge } from './ResponsiveBadge';

interface MatchListViewCardProps {
  matches: Match[];
  selectedMatchId: string | null;
  onSelectMatch: (matchId: string) => void;
  onHideMatch: (matchId: string) => void;
  onRefreshMatch: (matchId: string) => void;
  className?: string;
}

// Temporary mock hero list for testing
const mockHeroes: Hero[] = [
  {
    id: '1',
    name: 'crystal_maiden',
    localizedName: 'Crystal Maiden',
    primaryAttribute: 'intelligence',
    attackType: 'ranged',
    roles: ['Support', 'Disabler', 'Nuker'],
    complexity: 1,
    imageUrl: 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/crystal_maiden.png?'
  },
  {
    id: '2',
    name: 'juggernaut',
    localizedName: 'Juggernaut',
    primaryAttribute: 'agility',
    attackType: 'melee',
    roles: ['Carry', 'Pusher'],
    complexity: 2,
    imageUrl: 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/juggernaut.png?'
  },
  {
    id: '3',
    name: 'lina',
    localizedName: 'Lina',
    primaryAttribute: 'intelligence',
    attackType: 'ranged',
    roles: ['Support', 'Nuker'],
    complexity: 2,
    imageUrl: 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/lina.png?'
  },
  {
    id: '4',
    name: 'pudge',
    localizedName: 'Pudge',
    primaryAttribute: 'strength',
    attackType: 'melee',
    roles: ['Disabler', 'Initiator'],
    complexity: 3,
    imageUrl: 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/pudge.png?'
  },
  {
    id: '5',
    name: 'axe',
    localizedName: 'Axe',
    primaryAttribute: 'strength',
    attackType: 'melee',
    roles: ['Initiator', 'Durable'],
    complexity: 2,
    imageUrl: 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/axe.png?'
  },
  {
    id: '6',
    name: 'lion',
    localizedName: 'Lion',
    primaryAttribute: 'intelligence',
    attackType: 'ranged',
    roles: ['Support', 'Disabler'],
    complexity: 1,
    imageUrl: 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/lion.png?'
  },
  {
    id: '7',
    name: 'nevermore',
    localizedName: 'Shadow Fiend',
    primaryAttribute: 'agility',
    attackType: 'ranged',
    roles: ['Carry', 'Nuker'],
    complexity: 2,
    imageUrl: 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/nevermore.png?'
  },
  {
    id: '8',
    name: 'tidehunter',
    localizedName: 'Tidehunter',
    primaryAttribute: 'strength',
    attackType: 'melee',
    roles: ['Initiator', 'Durable'],
    complexity: 2,
    imageUrl: 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/tidehunter.png?'
  },
  {
    id: '9',
    name: 'witch_doctor',
    localizedName: 'Witch Doctor',
    primaryAttribute: 'intelligence',
    attackType: 'ranged',
    roles: ['Support', 'Disabler'],
    complexity: 1,
    imageUrl: 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/witch_doctor.png?'
  },
  {
    id: '10',
    name: 'phantom_assassin',
    localizedName: 'Phantom Assassin',
    primaryAttribute: 'agility',
    attackType: 'melee',
    roles: ['Carry', 'Escape'],
    complexity: 2,
    imageUrl: 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/phantom_assassin.png?'
  }
];

interface MatchCardProps {
  match: Match;
  matchIndex: number;
  selectedMatchId: string | null;
  onSelectMatch: (matchId: string) => void;
  onHideMatch: (matchId: string) => void;
  onRefreshMatch: (matchId: string) => void;
}

const MatchCard: React.FC<MatchCardProps> = ({ 
  match, 
  matchIndex, 
  selectedMatchId, 
  onSelectMatch, 
  onHideMatch,
  onRefreshMatch
}) => {
  // Generate mock heroes for this match
  const startIndex = (matchIndex * 5) % mockHeroes.length;
  const mockHeroesForMatch = [
    ...mockHeroes.slice(startIndex, startIndex + 5),
    ...mockHeroes.slice(0, Math.max(0, 5 - (mockHeroes.length - startIndex)))
  ].slice(0, 5);

  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-md ${
        selectedMatchId === match.id ? 'ring-2 ring-primary' : ''
      }`}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle 
            className="cursor-pointer truncate"
            onClick={() => onSelectMatch(match.id)}
          >
            {match.opponent}
          </CardTitle>
          <div className="flex items-center gap-1">
            <RefreshButton
              onClick={() => onRefreshMatch(match.id)}
              ariaLabel={`Refresh match vs ${match.opponent}`}
              className="h-5 w-5 p-0"
            />
            <HideButton
              onClick={() => onHideMatch(match.id)}
              ariaLabel={`Hide match vs ${match.opponent}`}
            />
          </div>
        </div>
        <HeroAvatars 
          heroes={mockHeroesForMatch} 
          avatarSize={{ width: 'w-6', height: 'h-6' }}
          className="mt-2"
        />
      </CardHeader>
      <CardContent 
        className="cursor-pointer"
        onClick={() => onSelectMatch(match.id)}
      >
        <div className="flex items-center gap-2 mb-2">
          <ResponsiveBadge
            fullText={match.result === 'win' ? 'Victory' : 'Defeat'}
            shortText={match.result === 'win' ? 'W' : 'L'}
            breakpoint="250px"
            variant={match.result === 'win' ? 'success' : 'default'}
          />
          <ResponsiveBadge
            fullText={match.teamSide === 'radiant' ? 'Radiant' : 'Dire'}
            shortText={match.teamSide === 'radiant' ? 'R' : 'D'}
            breakpoint="250px"
            variant="outline"
          />
          <ResponsiveBadge
            fullText={match.pickOrder === 'first' ? 'First Pick' : 'Second Pick'}
            shortText={match.pickOrder === 'first' ? 'FP' : 'SP'}
            breakpoint="250px"
            variant="secondary"
          />
        </div>
        <DateDuration date={match.date} duration={match.duration} className="mb-2" />
        <div className="flex flex-wrap gap-1">
          {match.heroes.slice(0, 4).map((hero, idx) => (
            <ResponsiveBadge
              key={idx}
              fullText={hero}
              shortText={hero.substring(0, 2).toUpperCase()}
              breakpoint="200px"
              variant="secondary"
              className="text-xs"
            />
          ))}
          {match.heroes.length > 4 && (
            <ResponsiveBadge
              fullText={`+${match.heroes.length - 4}`}
              shortText={`+${match.heroes.length - 4}`}
              breakpoint="200px"
              variant="secondary"
              className="text-xs"
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export const MatchListViewCard: React.FC<MatchListViewCardProps> = ({
  matches,
  selectedMatchId,
  onSelectMatch,
  onHideMatch,
  onRefreshMatch,
  className = '',
}) => {
  if (matches.length === 0) {
    return (
      <div className={`flex items-center justify-center p-8 text-muted-foreground ${className}`}>
        <div className="text-center">
          <div className="text-lg font-medium mb-2">No matches found</div>
          <div className="text-sm">Try adjusting your filters or adding more matches.</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}>
      {matches.map((match, index) => (
        <MatchCard
          key={match.id}
          match={match}
          matchIndex={index}
          selectedMatchId={selectedMatchId}
          onSelectMatch={onSelectMatch}
          onHideMatch={onHideMatch}
          onRefreshMatch={onRefreshMatch}
        />
      ))}
    </div>
  );
}; 