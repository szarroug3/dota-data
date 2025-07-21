import React from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useConfigContext } from '@/contexts/config-context';
import { Hero } from '@/types/contexts/constants-context-value';
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

interface MatchListViewProps {
  matches: Match[]; 
  selectedMatchId: string | null;
  onSelectMatch: (matchId: string) => void;
  onHideMatch: (matchId: string) => void;
  onRefreshMatch: (matchId: string) => void;
  className?: string;
  activeTeamSide?: 'radiant' | 'dire'; // Which side the active team played on
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

interface MatchInfoProps {
  match: Match;
  onSelectMatch: (matchId: string) => void;
}

const MatchInfo: React.FC<MatchInfoProps> = ({ match, onSelectMatch }) => (
  <div 
    className="cursor-pointer min-w-0 flex-1 @[170px]:opacity-100 opacity-0 invisible @[170px]:visible"
    onClick={() => onSelectMatch(match.id)}
  >
    <div className="font-medium truncate">{match.opponent}</div>
    <div className="text-sm text-muted-foreground truncate">
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
  </div>
);

 
interface MatchBadgesProps {
  match: Match;
  activeTeamSide?: 'radiant' | 'dire'; // Which side the active team played on
}

// Helper function to determine if the active team won
const didActiveTeamWin = (match: Match, activeTeamSide?: 'radiant' | 'dire'): boolean => {
  if (!activeTeamSide) return false;
  return match.result === activeTeamSide;
};

const MatchBadges: React.FC<MatchBadgesProps> = ({ match, activeTeamSide }) => {
  const teamWon = didActiveTeamWin(match, activeTeamSide);
  
  return (
    <div className="flex items-center gap-2">
      {/* Result Badge */}
      <Badge 
        variant={teamWon ? 'success' : 'default'} 
        className="text-xs w-fit @[300px]:block hidden"
      >
        <span className="@[400px]:block hidden">{teamWon ? 'Victory' : 'Defeat'}</span>
        <span className="@[400px]:hidden block">{teamWon ? 'W' : 'L'}</span>
      </Badge>
      
      {/* Team Side Badge */}
      <Badge 
        variant="outline" 
        className="text-xs w-fit @[300px]:block hidden"
      >
        <span className="@[400px]:block hidden">{match.teamSide === 'radiant' ? 'Radiant' : 'Dire'}</span>
        <span className="@[400px]:hidden block">{match.teamSide === 'radiant' ? 'R' : 'D'}</span>
      </Badge>
      
      {/* Pick Order Badge */}
      <Badge 
        variant="secondary" 
        className="text-xs w-fit @[300px]:block hidden"
      >
        <span className="@[400px]:block hidden">{match.pickOrder === 'first' ? 'First Pick' : 'Second Pick'}</span>
        <span className="@[400px]:hidden block">{match.pickOrder === 'first' ? 'FP' : 'SP'}</span>
      </Badge>
    </div>
  );
};

interface MatchCardProps {
  match: Match;
  matchIndex: number;
  selectedMatchId: string | null;
  onSelectMatch: (matchId: string) => void;
  onHideMatch: (matchId: string) => void;
  onRefreshMatch: (matchId: string) => void;
  activeTeamSide?: 'radiant' | 'dire'; // Which side the active team played on
}

const MatchCard: React.FC<MatchCardProps> = ({ 
  match, 
  matchIndex, 
  selectedMatchId, 
  onSelectMatch, 
  onHideMatch,
  onRefreshMatch,
  activeTeamSide
}) => {
  const { config } = useConfigContext();
  
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

          {/* Row 2: Badges on left, buttons on right aligned with avatar */}
          <div className="flex items-center justify-between gap-2 min-w-0">
            <MatchBadges match={match} activeTeamSide={activeTeamSide} />
            <div className="flex items-center gap-0.5 opacity-0 invisible @[200px]:opacity-100 @[200px]:visible" style={{ marginRight: '-0.2rem' }}>
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
  className,
  activeTeamSide
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
          activeTeamSide={activeTeamSide} // Pass the active team side to MatchCard
        />
      ))}
    </div>
  );
}; 