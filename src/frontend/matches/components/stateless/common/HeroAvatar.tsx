import React from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { Hero } from '@/frontend/lib/app-data-types';

export interface HeroAvatarProps {
  hero?: Hero;
  avatarSize: { width: string; height: string };
  isHighPerforming?: boolean;
}

export const HeroAvatar: React.FC<HeroAvatarProps> = ({ hero, avatarSize, isHighPerforming = false }) => {
  const { width, height } = avatarSize;

  const getFallbackText = () => {
    const name = hero?.localizedName || hero?.name || '';
    if (!name) return '?';
    const words = name.split(/\s+/);
    if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase();
    }
    return words
      .map((w) => w[0])
      .join('')
      .toUpperCase();
  };

  const fallbackText = getFallbackText();

  return (
    <Avatar className={`${width} ${height} border ${isHighPerforming ? 'border-primary' : 'border-background'}`}>
      <AvatarImage src={hero?.imageUrl} alt={hero?.localizedName || 'Hero'} className="object-cover object-center" />
      <AvatarFallback className="text-xs">{fallbackText}</AvatarFallback>
    </Avatar>
  );
};
