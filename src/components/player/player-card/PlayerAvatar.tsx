import React from 'react';

import type { Player } from '@/types/contexts/player-context-value';

interface PlayerAvatarProps {
  player: Player;
  size?: 'compact' | 'default' | 'large';
}

// Helper to get player display name
const getPlayerDisplayName = (player: Player): string => {
  if (player.isLoading) {
    return `Loading ${player.profile.profile.account_id}`;
  }
  
  return player.profile.profile.personaname || `Player ${player.profile.profile.account_id}`;
};

export const PlayerAvatar: React.FC<PlayerAvatarProps> = ({ player, size = 'default' }) => {
  const sizeClasses = {
    compact: 'w-8 h-8',
    default: 'w-12 h-12',
    large: 'w-16 h-16'
  };

  const playerName = getPlayerDisplayName(player);
  const isLoading = player.isLoading || false;

  return (
    <div className={`${sizeClasses[size]} rounded-full overflow-hidden bg-muted dark:bg-muted flex items-center justify-center`}>
      {isLoading ? (
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <span className="text-muted-foreground dark:text-muted-foreground font-medium">
          {playerName.charAt(0).toUpperCase()}
        </span>
      )}
    </div>
  );
}; 