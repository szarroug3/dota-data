import React from 'react';

import type { Player } from '@/types/contexts/player-context-value';

interface PlayerAvatarProps {
  player: Player;
  size?: 'compact' | 'default' | 'large';
}

export const PlayerAvatar: React.FC<PlayerAvatarProps> = ({ player, size = 'default' }) => {
  const sizeClasses = {
    compact: 'w-8 h-8',
    default: 'w-12 h-12',
    large: 'w-16 h-16'
  };

  return (
    <div className={`${sizeClasses[size]} rounded-full overflow-hidden bg-muted dark:bg-muted flex items-center justify-center`}>
      <span className="text-muted-foreground dark:text-muted-foreground font-medium">
        {player.name.charAt(0).toUpperCase()}
      </span>
    </div>
  );
}; 