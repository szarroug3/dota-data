/**
 * Hero Card Sub-Components
 * 
 * Smaller reusable components for the hero card display
 */

import React from 'react';

import { HeroInfo, HeroMetaInfo } from '@/types/components/hero-card';

import { getAttributeIcon, getTierColor, getTrendIcon } from './hero-card-utils';

interface HeroImageProps {
  hero: HeroInfo;
  mode: 'list' | 'grid' | 'detailed';
}

export const HeroImage: React.FC<HeroImageProps> = ({ hero, mode }) => {
  const sizeClasses = {
    list: 'w-12 h-12',
    grid: 'w-16 h-16',
    detailed: 'w-20 h-20'
  };

  return (
    <div className={`${sizeClasses[mode]} rounded-lg overflow-hidden bg-muted flex items-center justify-center`}>
      {hero.image ? (
        <img 
          src={hero.image} 
          alt={hero.localizedName}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="text-center">
          <div className="text-2xl">{getAttributeIcon(hero.primaryAttribute)}</div>
          <div className="text-xs font-medium text-muted-foreground mt-1">
            {hero.localizedName.substring(0, 2)}
          </div>
        </div>
      )}
    </div>
  );
};

interface HeroRolesProps {
  roles: string[];
  compact?: boolean;
}

export const HeroRoles: React.FC<HeroRolesProps> = ({ roles, compact = false }) => {
  const displayRoles = compact ? roles.slice(0, 2) : roles;
  
  return (
    <div className="flex flex-wrap gap-1">
      {displayRoles.map((role, index) => (
        <span
          key={index}
          className="px-2 py-1 text-xs font-medium bg-muted text-muted-foreground rounded"
        >
          {role}
        </span>
      ))}
      {compact && roles.length > 2 && (
        <span className="px-2 py-1 text-xs font-medium bg-muted text-muted-foreground rounded">
          +{roles.length - 2}
        </span>
      )}
    </div>
  );
};

interface HeroMetaBadgeProps {
  meta: HeroMetaInfo;
}

export const HeroMetaBadge: React.FC<HeroMetaBadgeProps> = ({ meta }) => (
  <div className="flex items-center space-x-2">
    <span className={`px-2 py-1 text-xs font-bold rounded-full border ${getTierColor(meta.tier)}`}>
      {meta.tier}
    </span>
    <span className="text-sm">{getTrendIcon(meta.trend)}</span>
  </div>
); 