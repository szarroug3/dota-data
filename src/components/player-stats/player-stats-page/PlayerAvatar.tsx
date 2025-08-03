import React from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useConfigContext } from '@/contexts/config-context';
import type { Player } from '@/types/contexts/player-context-value';

interface PlayerAvatarProps {
  player: Player;
  avatarSize: { width: string; height: string };
  showLink?: boolean;
  className?: string;
}

export const PlayerAvatar: React.FC<PlayerAvatarProps> = ({ 
  player, 
  avatarSize, 
  showLink = true,
  className = ''
}) => {
  const { config } = useConfigContext();
  const { width, height } = avatarSize;
  
  const getFallbackText = () => {
    const name = player.profile.profile.personaname || '';
    if (!name) return '?';
    const words = name.split(/\s+/);
    if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase();
    }
    return words.map(w => w[0]).join('').toUpperCase();
  };
  
  const getPlayerUrl = () => {
    const accountId = player.profile.profile.account_id;
    switch (config.preferredExternalSite) {
      case 'opendota':
        return `https://www.opendota.com/players/${accountId}`;
      case 'dotabuff':
        return `https://www.dotabuff.com/players/${accountId}`;
      default:
        return `https://www.dotabuff.com/players/${accountId}`;
    }
  };
  
  const fallbackText = getFallbackText();
  const playerUrl = getPlayerUrl();
  
  const handleClick = (e: React.MouseEvent) => {
    if (showLink) {
      e.stopPropagation();
      window.open(playerUrl, '_blank', 'noopener,noreferrer');
    }
  };
  
  const avatarContent = (
    <Avatar className={`${width} ${height} border border-background cursor-pointer hover:border-primary transition-colors ${className}`}>
      <AvatarImage 
        src={player.profile.profile.avatarfull} 
        alt={player.profile.profile.personaname || 'Player'}
        className="object-cover object-center"
      />
      <AvatarFallback className="text-xs">
        {fallbackText}
      </AvatarFallback>
    </Avatar>
  );
  
  if (showLink) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={handleClick}
        className="p-0 h-auto w-auto"
        aria-label={`View ${player.profile.profile.personaname} on ${config.preferredExternalSite}`}
        title={`View ${player.profile.profile.personaname} on ${config.preferredExternalSite}`}
      >
        {avatarContent}
      </Button>
    );
  }
  
  return avatarContent;
}; 