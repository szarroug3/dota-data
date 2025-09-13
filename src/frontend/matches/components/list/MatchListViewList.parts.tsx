import { AlertCircle } from 'lucide-react';
import React from 'react';

import { Badge } from '@/components/ui/badge';
import { HeroAvatar } from '@/frontend/matches/components/stateless/common/HeroAvatar';
import { useTeamContext } from '@/frontend/teams/contexts/state/team-context';
import type { Hero } from '@/types/contexts/constants-context-value';

export interface HeroIndicatorProps { count: number; avatarSize: { width: string; height: string }; }
export const HeroIndicator: React.FC<HeroIndicatorProps> = ({ count, avatarSize }) => {
  const { width, height } = avatarSize;
  return (
    <div className={`${width} ${height} bg-muted rounded-full border-2 border-background flex items-center justify-center`}>
      <span className="text-xs font-medium text-muted-foreground">+{count}</span>
    </div>
  );
};

export interface HeroAvatarsProps { heroes: Hero[]; avatarSize?: { width: string; height: string }; className?: string; }
export const HeroAvatars: React.FC<HeroAvatarsProps> = ({ heroes, avatarSize = { width: 'w-8', height: 'h-8' }, className = '' }) => {
  const { highPerformingHeroes } = useTeamContext();
  const totalHeroes = heroes.length;
  const renderLargeContainer = () => (
    <div className="@[400px]:flex hidden">
      {heroes.slice(0, 5).map((hero, index) => (
        <HeroAvatar key={index} hero={hero} avatarSize={avatarSize} isHighPerforming={highPerformingHeroes.has(hero.id.toString())} />
      ))}
    </div>
  );
  const renderMediumContainer = () => (
    <div className="@[350px]:flex @[400px]:hidden hidden">
      {heroes.slice(0, 3).filter(Boolean).map((hero, index) => (
        <HeroAvatar key={index} hero={hero as Hero} avatarSize={avatarSize} isHighPerforming={highPerformingHeroes.has((hero as Hero).id.toString())} />
      ))}
      {totalHeroes > 3 && <HeroIndicator count={totalHeroes - 3} avatarSize={avatarSize} />}
    </div>
  );
  const renderSmallContainer = () => (
    <div className="@[290px]:flex @[350px]:hidden hidden">
      {heroes.slice(0, 2).map((hero, index) => (
        <HeroAvatar key={index} hero={hero} avatarSize={avatarSize} isHighPerforming={highPerformingHeroes.has(hero.id.toString())} />
      ))}
      {totalHeroes > 2 && <HeroIndicator count={totalHeroes - 2} avatarSize={avatarSize} />}
    </div>
  );
  const renderVerySmallContainer = () => (
    <div className="@[270px]:flex @[290px]:hidden hidden">
      {heroes.slice(0, 1).map((hero, index) => (
        <HeroAvatar key={index} hero={hero} avatarSize={avatarSize} isHighPerforming={highPerformingHeroes.has(hero.id.toString())} />
      ))}
      {totalHeroes > 1 && <HeroIndicator count={totalHeroes - 1} avatarSize={avatarSize} />}
    </div>
  );
  const renderDefaultFallback = () => (
    <div className="@[270px]:hidden flex">
      {heroes.slice(0, 1).map((hero, index) => (
        <HeroAvatar key={index} hero={hero} avatarSize={avatarSize} isHighPerforming={highPerformingHeroes.has(hero.id.toString())} />
      ))}
      {totalHeroes > 1 && <HeroIndicator count={totalHeroes - 1} avatarSize={avatarSize} />}
    </div>
  );
  return (
    <div className={`hidden @[150px]:flex -space-x-1 ${className}`}>
      {renderLargeContainer()}
      {renderMediumContainer()}
      {renderSmallContainer()}
      {renderVerySmallContainer()}
      {renderDefaultFallback()}
    </div>
  );
};

export const ErrorBadge: React.FC = () => (
  <Badge variant="destructive" className="text-xs">
    <AlertCircle className="w-3 h-3 mr-1" />
    Error
  </Badge>
);
export const ResultBadge: React.FC<{ teamWon: boolean }> = ({ teamWon }) => (
  <Badge variant={teamWon ? 'success' : 'default'} className="text-xs w-fit @[300px]:block hidden">
    <span className="@[450px]:block hidden">{teamWon ? 'Victory' : 'Defeat'}</span>
    <span className="@[450px]:hidden block">{teamWon ? 'W' : 'L'}</span>
  </Badge>
);
export const TeamSideBadge: React.FC<{ teamSide: 'radiant' | 'dire' | undefined }> = ({ teamSide }) => (
  <Badge variant="outline" className="text-xs w-fit @[300px]:block hidden">
    <span className="@[450px]:block hidden">{teamSide === 'radiant' ? 'Radiant' : 'Dire'}</span>
    <span className="@[450px]:hidden block">{teamSide === 'radiant' ? 'R' : 'D'}</span>
  </Badge>
);
export const PickOrderBadge: React.FC<{ pickOrder: string | null }> = ({ pickOrder }) => (
  <Badge variant="secondary" className="text-xs w-fit @[300px]:block hidden">
    <span className="@[450px]:block hidden">{pickOrder}</span>
    <span className="@[450px]:hidden block">{pickOrder === 'First Pick' ? '1P' : pickOrder === 'Second Pick' ? '2P' : 'PO'}</span>
  </Badge>
);


