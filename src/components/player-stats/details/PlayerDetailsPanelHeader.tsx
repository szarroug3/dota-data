import { BarChart3, FileText, Users } from 'lucide-react';
import React from 'react';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Player } from '@/types/contexts/player-context-value';
import { processPlayerRank } from '@/utils/player-statistics';

import { PlayerAvatar } from '../player-stats-page/PlayerAvatar';

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

const PlayerDetailsLayoutButtons: React.FC<PlayerDetailsLayoutButtonsProps> = ({ 
  viewMode, 
  onViewModeChange,
}) => (
  <>
    <div className="@[150px]:flex hidden">
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
    <div className="@[150px]:hidden h-9 w-32">
      {/* Invisible placeholder to maintain space when tabs are hidden */}
    </div>
  </>
)

export const PlayerDetailsPanelHeader: React.FC<PlayerDetailsPanelHeaderProps> = ({
  player,
  viewMode,
  onViewModeChange,
  className = '',
}) => {
  const playerRank = processPlayerRank(player.profile.rank_tier || 0, player.profile.leaderboard_rank);
  const rankDisplay = playerRank ? playerRank.displayText : '';

  return (
    <div className={`flex items-center justify-between gap-2 min-w-0 ${className}`}>
      <div className="min-w-0 flex-1 overflow-hidden">
        <div className="flex items-center space-x-3">
          <PlayerAvatar 
            player={player}
            avatarSize={{ width: 'w-12', height: 'h-12' }}
            showLink={true}
          />
          <div className="min-w-0 flex-1 overflow-hidden">
            <h2 className="text-lg font-semibold text-foreground dark:text-foreground truncate @[190px]:block hidden">
              {player.profile.profile.personaname}
            </h2>
            {rankDisplay && (
              <p className="text-sm text-muted-foreground dark:text-muted-foreground truncate @[190px]:block hidden">
                {rankDisplay}
              </p>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-2 flex-shrink-0 justify-end">
        <PlayerDetailsLayoutButtons 
          viewMode={viewMode}
          onViewModeChange={onViewModeChange}
        />
      </div>
    </div>
  );
}; 