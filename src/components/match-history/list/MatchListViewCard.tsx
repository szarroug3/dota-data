import React from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useConfigContext } from '@/contexts/config-context';
import type { Hero } from '@/types/contexts/hero-context-value';
import type { Match } from '@/types/contexts/match-context-value';

import { ExternalSiteButton } from '../common/ExternalSiteButton';
import { HideButton } from '../common/HideButton';
import { RefreshButton } from '../common/RefreshButton';

// Helper functions for date and duration formatting
const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

interface HeroAvatarsProps {
  heroes: Hero[];
  avatarSize?: {
    width: string;
    height: string;
  };
  className?: string;
}

interface HeroAvatarProps {
  hero: Hero;
  avatarSize: { width: string; height: string };
}

const HeroAvatar: React.FC<HeroAvatarProps> = ({ hero, avatarSize }) => {
  const { width, height } = avatarSize;
  
  return (
    <Avatar className={`${width} ${height} border-2 border-background`}>
      <AvatarImage 
        src={hero.imageUrl} 
        alt={hero.localizedName}
        className="object-cover object-center"
      />
      <AvatarFallback className="text-xs">
        {hero.localizedName.substring(0, 2).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  );
};

interface HeroIndicatorProps {
  count: number;
  avatarSize: { width: string; height: string };
}

const HeroIndicator: React.FC<HeroIndicatorProps> = ({ count, avatarSize }) => {
  const { width, height } = avatarSize;
  
  return (
    <div className={`${width} ${height} bg-muted rounded-full border-2 border-background flex items-center justify-center`}>
      <span className="text-xs font-medium text-muted-foreground">
        +{count}
      </span>
    </div>
  );
};

const HeroAvatars: React.FC<HeroAvatarsProps> = ({ 
  heroes, 
  avatarSize = { width: 'w-8', height: 'h-8' },
  className = ''
}) => {
  const totalHeroes = heroes.length;

  return (
    <div className={`flex -space-x-1 @[150px]:block hidden ${className}`}>
      {/* Large container: show all 5 heroes (if we have 5) */}
      <div className="@[400px]:flex hidden">
        {heroes.slice(0, 5).map((hero, index) => (
          <HeroAvatar key={index} hero={hero} avatarSize={avatarSize} />
        ))}
      </div>
      
      {/* Medium container: show 3 heroes + indicator */}
      <div className="@[350px]:flex @[400px]:hidden hidden">
        {heroes.slice(0, 3).map((hero, index) => (
          <HeroAvatar key={index} hero={hero} avatarSize={avatarSize} />
        ))}
        {totalHeroes > 3 && (
          <HeroIndicator count={totalHeroes - 3} avatarSize={avatarSize} />
        )}
      </div>
      
      {/* Small container: show 2 heroes + indicator */}
      <div className="@[290px]:flex @[350px]:hidden hidden">
        {heroes.slice(0, 2).map((hero, index) => (
          <HeroAvatar key={index} hero={hero} avatarSize={avatarSize} />
        ))}
        {totalHeroes > 2 && (
          <HeroIndicator count={totalHeroes - 2} avatarSize={avatarSize} />
        )}
      </div>
      
      {/* Very small container: show 1 hero + indicator */}
      <div className="@[270px]:flex @[290px]:hidden hidden">
        {heroes.slice(0, 1).map((hero, index) => (
          <HeroAvatar key={index} hero={hero} avatarSize={avatarSize} />
        ))}
        {totalHeroes > 1 && (
          <HeroIndicator count={totalHeroes - 1} avatarSize={avatarSize} />
        )}
      </div>
      
      {/* Default fallback: show at least 1 hero when container is very small */}
      <div className="@[270px]:hidden flex">
        {heroes.slice(0, 1).map((hero, index) => (
          <HeroAvatar key={index} hero={hero} avatarSize={avatarSize} />
        ))}
        {totalHeroes > 1 && (
          <HeroIndicator count={totalHeroes - 1} avatarSize={avatarSize} />
        )}
      </div>
    </div>
  );
}; 

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
    imageUrl: 'https://dota2protracker.com/static/heroes/crystal_maiden_vert.jpg'
  },
  {
    id: '2',
    name: 'juggernaut',
    localizedName: 'Juggernaut',
    primaryAttribute: 'agility',
    attackType: 'melee',
    roles: ['Carry', 'Pusher'],
    complexity: 2,
    imageUrl: 'https://dota2protracker.com/static/heroes/juggernaut_vert.jpg'
  },
  {
    id: '3',
    name: 'lina',
    localizedName: 'Lina',
    primaryAttribute: 'intelligence',
    attackType: 'ranged',
    roles: ['Support', 'Nuker'],
    complexity: 2,
    imageUrl: 'https://dota2protracker.com/static/heroes/lina_vert.jpg'
  },
  {
    id: '4',
    name: 'pudge',
    localizedName: 'Pudge',
    primaryAttribute: 'strength',
    attackType: 'melee',
    roles: ['Disabler', 'Initiator'],
    complexity: 3,
    imageUrl: 'https://dota2protracker.com/static/heroes/pudge_vert.jpg'
  },
  {
    id: '5',
    name: 'axe',
    localizedName: 'Axe',
    primaryAttribute: 'strength',
    attackType: 'melee',
    roles: ['Initiator', 'Durable'],
    complexity: 2,
    imageUrl: 'https://dota2protracker.com/static/heroes/axe_vert.jpg'
  },
  {
    id: '6',
    name: 'lion',
    localizedName: 'Lion',
    primaryAttribute: 'intelligence',
    attackType: 'ranged',
    roles: ['Support', 'Disabler'],
    complexity: 1,
    imageUrl: 'https://dota2protracker.com/static/heroes/lion_vert.jpg'
  },
  {
    id: '7',
    name: 'nevermore',
    localizedName: 'Shadow Fiend',
    primaryAttribute: 'agility',
    attackType: 'ranged',
    roles: ['Carry', 'Nuker'],
    complexity: 2,
    imageUrl: 'https://dota2protracker.com/static/heroes/nevermore_vert.jpg'
  },
  {
    id: '8',
    name: 'tidehunter',
    localizedName: 'Tidehunter',
    primaryAttribute: 'strength',
    attackType: 'melee',
    roles: ['Initiator', 'Durable'],
    complexity: 2,
    imageUrl: 'https://dota2protracker.com/static/heroes/tidehunter_vert.jpg'
  },
  {
    id: '9',
    name: 'witch_doctor',
    localizedName: 'Witch Doctor',
    primaryAttribute: 'intelligence',
    attackType: 'ranged',
    roles: ['Support', 'Disabler'],
    complexity: 1,
    imageUrl: 'https://dota2protracker.com/static/heroes/witch_doctor_vert.jpg'
  },
  {
    id: '10',
    name: 'phantom_assassin',
    localizedName: 'Phantom Assassin',
    primaryAttribute: 'agility',
    attackType: 'melee',
    roles: ['Carry', 'Escape'],
    complexity: 2,
    imageUrl: 'https://dota2protracker.com/static/heroes/phantom_assassin_vert.jpg'
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
  const { config } = useConfigContext();
  
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
            <ExternalSiteButton
              matchId={match.id}
              preferredSite={config.preferredExternalSite}
              size="sm"
            />
            <RefreshButton
              onClick={() => onRefreshMatch(match.id)}
              ariaLabel={`Refresh match vs ${match.opponent}`}
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
          <Badge 
            variant={match.result === 'win' ? 'success' : 'default'} 
            className="text-xs"
          >
            {match.result === 'win' ? 'Victory' : 'Defeat'}
          </Badge>
          <Badge 
            variant="outline" 
            className="text-xs"
          >
            {match.teamSide === 'radiant' ? 'Radiant' : 'Dire'}
          </Badge>
          <Badge 
            variant="secondary" 
            className="text-xs"
          >
            {match.pickOrder === 'first' ? 'First Pick' : 'Second Pick'}
          </Badge>
        </div>
        <div className="text-sm text-muted-foreground mb-2">
          {/* Show date and duration on larger containers */}
          <span className="@[350px]:inline hidden">
            {formatDate(match.date)} • {formatDuration(match.duration)}
          </span>
          
          {/* Show only date on medium containers */}
          <span className="@[280px]:inline @[350px]:hidden hidden">
            {formatDate(match.date)}
          </span>
          
          {/* Show only date on smaller containers */}
          <span className="@[220px]:inline @[280px]:hidden hidden">
            {formatDate(match.date)}
          </span>
          
          {/* Hide on very small containers */}
          <span className="@[220px]:hidden">
            {formatDate(match.date)}
          </span>
        </div>
        <div className="flex flex-wrap gap-1">
          {match.heroes.slice(0, 4).map((hero, idx) => (
            <Badge
              key={idx}
              variant="secondary"
              className="text-xs"
            >
              {hero}
            </Badge>
          ))}
          {match.heroes.length > 4 && (
            <Badge
              variant="secondary"
              className="text-xs"
            >
              +{match.heroes.length - 4}
            </Badge>
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