import { BarChart3, FileText, Users } from 'lucide-react';
import React from 'react';

import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Player } from '@/frontend/lib/app-data-types';
import { PlayerAvatar } from '@/frontend/players/components/stateless/PlayerAvatar';
import { processPlayerRank } from '@/utils/player-statistics';

import type { PlayerDetailsPanelMode } from './PlayerDetailsPanel';

interface PlayerDetailsPanelHeaderProps {
  player: Player;
  viewMode: PlayerDetailsPanelMode;
  onViewModeChange: (mode: PlayerDetailsPanelMode) => void;
  className?: string;
}

interface PlayerDetailsLayoutButtonsProps {
  viewMode: PlayerDetailsPanelMode;
  onViewModeChange: (mode: PlayerDetailsPanelMode) => void;
}

const PlayerDetailsLayoutButtons: React.FC<PlayerDetailsLayoutButtonsProps> = ({ viewMode, onViewModeChange }) => (
  <>
    <div className="@[165px]:flex hidden">
      <Tabs value={viewMode} onValueChange={(value) => onViewModeChange(value as PlayerDetailsPanelMode)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="summary" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            <span className="@[450px]:block hidden">Summary</span>
          </TabsTrigger>
          <TabsTrigger value="details" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            <span className="@[450px]:block hidden">Details</span>
          </TabsTrigger>
          <TabsTrigger value="team" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span className="@[450px]:block hidden">Team</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
    <div className="@[150px]:hidden h-9">{/* Invisible placeholder to maintain space when tabs are hidden */}</div>
  </>
);

export const PlayerDetailsPanelHeader: React.FC<PlayerDetailsPanelHeaderProps> = ({
  player,
  viewMode,
  onViewModeChange,
  className = '',
}) => {
  const playerRank = processPlayerRank(player.profile.rank_tier, player.profile.leaderboard_rank);

  return (
    <div className={`flex items-center justify-between gap-2 min-w-0 ${className}`}>
      <div className="min-w-0 flex-1 overflow-hidden">
        <div className="flex items-center space-x-3">
          {/* Placeholder to preserve layout when avatar is hidden below 55px */}
          <div className="@[55px]:hidden block" aria-hidden="true">
            <Button
              variant="ghost"
              size="sm"
              className="p-0 h-auto w-auto pointer-events-none"
              tabIndex={-1}
              aria-hidden="true"
            >
              <Avatar className="w-12 h-12 border border-background rounded-full invisible" />
            </Button>
          </div>
          <div className="@[55px]:block hidden">
            <PlayerAvatar player={player} avatarSize={{ width: 'w-12', height: 'h-12' }} showLink={true} />
          </div>
          <div className="min-w-0 flex-1 overflow-hidden">
            <h2 className="text-lg font-semibold text-foreground dark:text-foreground truncate @[190px]:block hidden">
              {player.profile.personaname}
            </h2>
            {playerRank && (
              <p className="text-sm text-muted-foreground dark:text-muted-foreground truncate hidden @[190px]:flex items-center gap-1">
                <span>{playerRank.displayText}</span>
                {!playerRank.isImmortal && playerRank.stars > 0 && (
                  <span aria-label={`Rank stars: ${playerRank.stars}`} className="inline-flex gap-0.5">
                    {Array.from({ length: playerRank.stars }, (_, i) => (
                      <span key={i} className="text-yellow-500">
                        ★
                      </span>
                    ))}
                  </span>
                )}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex items_center gap-2 flex-shrink-0 justify-end">
        <PlayerDetailsLayoutButtons viewMode={viewMode} onViewModeChange={onViewModeChange} />
      </div>
    </div>
  );
};
