import React from 'react';

import type { Player } from '@/types/contexts/player-context-value';
import { processPlayerRank } from '@/utils/player-statistics';

import { PlayerAvatar } from '../player-stats-page/PlayerAvatar';

export type PlayerListViewMode = 'list' | 'card' | 'grid';

interface PlayerListViewProps {
  players: Player[];
  selectedPlayerId?: number | null;
  onSelectPlayer?: (playerId: number) => void;
  viewMode: PlayerListViewMode;
}

// Helper function to render rank display
const renderRank = (rank: any) => {
  if (!rank) return null;
  
  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm font-medium text-foreground dark:text-foreground">
        {rank.displayText}
      </span>
      {!rank.isImmortal && rank.stars > 0 && (
        <div className="flex space-x-1">
          {Array.from({ length: rank.stars }, (_, i) => (
            <span key={i} className="text-yellow-500 text-xs">★</span>
          ))}
        </div>
      )}
    </div>
  );
};

export const PlayerListView: React.FC<PlayerListViewProps> = ({
  players,
  selectedPlayerId,
  onSelectPlayer,
  viewMode,
}) => {
  const handlePlayerClick = (playerId: number) => {
    onSelectPlayer?.(playerId);
  };

  if (viewMode === 'list') {
    return (
      <div className="space-y-2">
        {players.map((player) => {
          const rank = processPlayerRank(player.profile.rank_tier);
          const totalGames = player.wl.win + player.wl.lose;
          const winRate = totalGames > 0 ? (player.wl.win / totalGames) * 100 : 0;
          const isSelected = selectedPlayerId === player.profile.profile.account_id;

          return (
            <div
              key={player.profile.profile.account_id}
              className={`flex items-center space-x-4 p-4 rounded-lg cursor-pointer transition-colors ${
                isSelected 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-card hover:bg-muted dark:bg-card dark:hover:bg-muted'
              }`}
              onClick={() => handlePlayerClick(player.profile.profile.account_id)}
            >
              <PlayerAvatar 
                player={player}
                avatarSize={{ width: 'w-12', height: 'h-12' }}
                showLink={false}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <h3 className="font-semibold truncate">
                    {player.profile.profile.personaname}
                  </h3>
                  {rank && renderRank(rank)}
                </div>
                <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                  {totalGames} games • {winRate.toFixed(1)}% win rate
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold">
                  {player.heroes.length} heroes
                </div>
                <div className="text-xs text-muted-foreground dark:text-muted-foreground">
                  {player.recentMatches.length} recent
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  if (viewMode === 'card') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {players.map((player) => {
          const rank = processPlayerRank(player.profile.rank_tier);
          const totalGames = player.wl.win + player.wl.lose;
          const winRate = totalGames > 0 ? (player.wl.win / totalGames) * 100 : 0;
          const isSelected = selectedPlayerId === player.profile.profile.account_id;

          return (
            <div
              key={player.profile.profile.account_id}
              className={`p-4 rounded-lg cursor-pointer transition-colors ${
                isSelected 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-card hover:bg-muted dark:bg-card dark:hover:bg-muted'
              }`}
              onClick={() => handlePlayerClick(player.profile.profile.account_id)}
            >
              <div className="flex items-center space-x-3 mb-3">
                <PlayerAvatar 
                  player={player}
                  avatarSize={{ width: 'w-10', height: 'h-10' }}
                  showLink={false}
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">
                    {player.profile.profile.personaname}
                  </h3>
                  {rank && renderRank(rank)}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-center">
                  <div className="font-semibold">{totalGames}</div>
                  <div className="text-muted-foreground dark:text-muted-foreground">Games</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold">{winRate.toFixed(1)}%</div>
                  <div className="text-muted-foreground dark:text-muted-foreground">Win Rate</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold">{player.heroes.length}</div>
                  <div className="text-muted-foreground dark:text-muted-foreground">Heroes</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold">{player.recentMatches.length}</div>
                  <div className="text-muted-foreground dark:text-muted-foreground">Recent</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {players.map((player) => {
          const rank = processPlayerRank(player.profile.rank_tier);
          const totalGames = player.wl.win + player.wl.lose;
          const winRate = totalGames > 0 ? (player.wl.win / totalGames) * 100 : 0;
          const isSelected = selectedPlayerId === player.profile.profile.account_id;

          return (
            <div
              key={player.profile.profile.account_id}
              className={`p-3 rounded-lg cursor-pointer transition-colors text-center ${
                isSelected 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-card hover:bg-muted dark:bg-card dark:hover:bg-muted'
              }`}
              onClick={() => handlePlayerClick(player.profile.profile.account_id)}
            >
              <PlayerAvatar 
                player={player}
                avatarSize={{ width: 'w-16', height: 'h-16' }}
                showLink={false}
                className="mx-auto mb-2"
              />
              <h3 className="font-semibold text-sm truncate mb-1">
                {player.profile.profile.personaname}
              </h3>
              {rank && (
                <div className="text-xs mb-1">
                  {renderRank(rank)}
                </div>
              )}
              <div className="text-xs text-muted-foreground dark:text-muted-foreground">
                {totalGames} games • {winRate.toFixed(1)}%
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return null;
}; 