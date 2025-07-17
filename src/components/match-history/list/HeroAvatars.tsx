import React from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { Hero } from '@/types/contexts/hero-context-value';

interface HeroAvatarsProps {
  heroes: Hero[];
  breakpoints?: {
    showAll?: string;
    showThree?: string;
    showTwo?: string;
    showOne?: string;
    hideAll?: string;
  };
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

export const HeroAvatars: React.FC<HeroAvatarsProps> = ({ 
  heroes, 
  breakpoints = {
    showAll: '300px',
    showThree: '270px',
    showTwo: '250px',
    showOne: '130px',
    hideAll: '130px'
  },
  avatarSize = { width: 'w-8', height: 'h-8' },
  className = ''
}) => {
  const totalHeroes = heroes.length;

  return (
    <div className={`flex -space-x-1 ${className}`}>
      {/* Large container: show all 5 heroes (if we have 5) */}
      <div className={`@[${breakpoints.showAll}]:flex hidden`}>
        {heroes.slice(0, 5).map((hero, index) => (
          <HeroAvatar key={index} hero={hero} avatarSize={avatarSize} />
        ))}
      </div>
      
      {/* Medium container: show 3 heroes + indicator */}
      <div className={`@[${breakpoints.showThree}]:flex @[${breakpoints.showAll}]:hidden hidden`}>
        {heroes.slice(0, 3).map((hero, index) => (
          <HeroAvatar key={index} hero={hero} avatarSize={avatarSize} />
        ))}
        {totalHeroes > 3 && (
          <HeroIndicator count={totalHeroes - 3} avatarSize={avatarSize} />
        )}
      </div>
      
      {/* Small container: show 2 heroes + indicator */}
      <div className={`@[${breakpoints.showTwo}]:flex @[${breakpoints.showThree}]:hidden hidden`}>
        {heroes.slice(0, 2).map((hero, index) => (
          <HeroAvatar key={index} hero={hero} avatarSize={avatarSize} />
        ))}
        {totalHeroes > 2 && (
          <HeroIndicator count={totalHeroes - 2} avatarSize={avatarSize} />
        )}
      </div>
      
      {/* Very small container: show 1 hero + indicator */}
      <div className={`@[${breakpoints.showOne}]:flex @[${breakpoints.showTwo}]:hidden hidden`}>
        {heroes.slice(0, 1).map((hero, index) => (
          <HeroAvatar key={index} hero={hero} avatarSize={avatarSize} />
        ))}
        {totalHeroes > 1 && (
          <HeroIndicator count={totalHeroes - 1} avatarSize={avatarSize} />
        )}
      </div>
      
      {/* Very small container: hide heroes completely */}
      <div className={`@[${breakpoints.hideAll}]:hidden`}>
        {/* No heroes shown on very small containers */}
      </div>
    </div>
  );
}; 