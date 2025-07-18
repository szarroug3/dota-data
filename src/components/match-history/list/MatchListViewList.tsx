import React from 'react';

import { Card, CardContent } from '@/components/ui/card';
import type { Hero } from '@/types/contexts/hero-context-value';
import type { Match } from '@/types/contexts/match-context-value';

import { HideButton } from '../common/HideButton';
import { RefreshButton } from '../common/RefreshButton';

import { DateDuration } from './DateDuration';
import { HeroAvatars } from './HeroAvatars';
import { ResponsiveBadge } from './ResponsiveBadge';

interface MatchListViewProps {
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

interface MatchInfoProps {
  match: Match;
  onSelectMatch: (matchId: string) => void;
}

const MatchInfo: React.FC<MatchInfoProps> = ({ match, onSelectMatch }) => (
  <div 
    className="cursor-pointer min-w-0 flex-1"
    onClick={() => onSelectMatch(match.id)}
  >
    <div className="font-medium truncate">{match.opponent}</div>
    <DateDuration date={match.date} duration={match.duration} />
  </div>
);

interface MatchBadgesProps {
  match: Match;
}

const MatchBadges: React.FC<MatchBadgesProps> = ({ match }) => (
  <div className="flex items-center gap-2">
    <ResponsiveBadge
      fullText={match.result === 'win' ? 'Victory' : 'Defeat'}
      shortText={match.result === 'win' ? 'W' : 'L'}
      breakpoint="250px"
      variant={match.result === 'win' ? 'success' : 'default'}
      className="text-xs"
    />
    <ResponsiveBadge
      fullText={match.teamSide === 'radiant' ? 'Radiant' : 'Dire'}
      shortText={match.teamSide === 'radiant' ? 'R' : 'D'}
      breakpoint="250px"
      variant="outline"
      className="text-xs"
    />
    <ResponsiveBadge
      fullText={match.pickOrder === 'first' ? 'First Pick' : 'Second Pick'}
      shortText={match.pickOrder === 'first' ? 'FP' : 'SP'}
      breakpoint="250px"
      variant="secondary"
      className="text-xs"
    />
  </div>
);

interface MatchActionsProps {
  match: Match;
  onHideMatch: (matchId: string) => void;
  onRefreshMatch: (matchId: string) => void;
}

const MatchActions: React.FC<MatchActionsProps> = ({ match, onHideMatch, onRefreshMatch }) => (
  <div className="flex items-center gap-0.5">
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
);

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
  // Temporary: Generate exactly 5 mock heroes for each match
  const startIndex = (matchIndex * 5) % mockHeroes.length;
  const mockHeroesForMatch = [
    ...mockHeroes.slice(startIndex, startIndex + 5),
    ...mockHeroes.slice(0, Math.max(0, 5 - (mockHeroes.length - startIndex)))
  ].slice(0, 5);

  return (
    <Card 
      className={`transition-all duration-200 ${
        selectedMatchId === match.id 
          ? 'ring-2 ring-primary bg-primary/5' 
          : 'hover:bg-accent/50 cursor-pointer hover:shadow-md'
      }`}
      onClick={() => onSelectMatch(match.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelectMatch(match.id);
        }
      }}
      aria-label={`Select match vs ${match.opponent}`}
    >
      <CardContent>
        <div className="flex flex-col gap-2">
          {/* Row 1: Opponent name + date/duration on left, avatars on right */}
          <div className="flex items-start justify-between gap-2 min-w-0">
            <MatchInfo match={match} onSelectMatch={onSelectMatch} />
            <HeroAvatars 
              heroes={mockHeroesForMatch} 
              avatarSize={{ width: 'w-8', height: 'h-8' }}
            />
          </div>
          
          {/* Row 2: Badges on left, buttons on right */}
          <div className="flex items-center justify-between gap-2 min-w-0">
            <MatchBadges match={match} />
            <MatchActions match={match} onHideMatch={onHideMatch} onRefreshMatch={onRefreshMatch} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const MatchListViewList: React.FC<MatchListViewProps> = ({
  matches,
  selectedMatchId,
  onSelectMatch,
  onHideMatch,
  onRefreshMatch,
  className
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
    <div className={`space-y-2 ${className}`}>
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