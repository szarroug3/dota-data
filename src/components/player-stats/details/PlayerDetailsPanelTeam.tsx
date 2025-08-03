import React from 'react';

import { HeroAvatar } from '@/components/match-history/common/HeroAvatar';
import { useConstantsContext } from '@/contexts/constants-context';
import { useMatchContext } from '@/contexts/match-context';
import { useTeamContext } from '@/contexts/team-context';
import type { Player } from '@/types/contexts/player-context-value';
import { processPlayerDetailedStats } from '@/utils/player-statistics';

interface PlayerDetailsPanelTeamProps {
  player: Player;
  allPlayers?: Player[];
  hiddenPlayerIds?: Set<number>;
}

// Helper function to render hero with avatar
const renderHeroWithAvatar = (hero: any) => (
  <div className="flex items-center space-x-2">
    <HeroAvatar 
      hero={hero.hero}
      avatarSize={{ width: 'w-6', height: 'h-6' }}
    />
    <span className="text-muted-foreground dark:text-muted-foreground">
      {hero.hero.localizedName}
    </span>
  </div>
);

export const PlayerDetailsPanelTeam: React.FC<PlayerDetailsPanelTeamProps> = ({
  player,
  allPlayers = [],
  hiddenPlayerIds = new Set(),
}) => {
  const { heroes } = useConstantsContext();
  const { matches } = useMatchContext();
  const { getSelectedTeam } = useTeamContext();
  
  const selectedTeam = getSelectedTeam();
  const matchesArray = Array.from(matches.values());
  
  // Process team-specific statistics
  const teamStats = selectedTeam ? 
    processPlayerDetailedStats(player, selectedTeam, matchesArray, heroes) : 
    null;

  return (
    <div className="space-y-6">
      {/* Team Overview */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground dark:text-foreground">Team Overview</h3>
        {teamStats ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-muted dark:bg-muted rounded-lg">
              <div className="text-2xl font-bold text-foreground dark:text-foreground">
                {teamStats.totalGames}
              </div>
              <div className="text-sm text-muted-foreground dark:text-muted-foreground">Team Games</div>
            </div>
            <div className="text-center p-3 bg-muted dark:bg-muted rounded-lg">
              <div className="text-2xl font-bold text-foreground dark:text-foreground">
                {teamStats.winRate.toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground dark:text-muted-foreground">Team Win Rate</div>
            </div>
            <div className="text-center p-3 bg-muted dark:bg-muted rounded-lg">
              <div className="text-2xl font-bold text-foreground dark:text-foreground">
                {teamStats.averageKDA.toFixed(2)}
              </div>
              <div className="text-sm text-muted-foreground dark:text-muted-foreground">Avg KDA</div>
            </div>
            <div className="text-center p-3 bg-muted dark:bg-muted rounded-lg">
              <div className="text-2xl font-bold text-foreground dark:text-foreground">
                {teamStats.averageGPM.toFixed(0)}
              </div>
              <div className="text-sm text-muted-foreground dark:text-muted-foreground">Avg GPM</div>
            </div>
          </div>
        ) : (
          <div className="text-center p-6 bg-muted dark:bg-muted rounded-lg">
            <p className="text-muted-foreground dark:text-muted-foreground">
              No team data available. Select a team to view team statistics.
            </p>
          </div>
        )}
      </div>

      {/* Team Roles */}
      {teamStats && teamStats.teamRoles.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground dark:text-foreground">Team Roles</h3>
          <div className="space-y-2">
            {teamStats.teamRoles.map((role, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted dark:bg-muted rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-muted-foreground dark:text-muted-foreground">
                    {role.role}
                  </span>
                </div>
                <div className="flex items-center space-x-4 text-sm">
                  <div className="text-center">
                    <div className="font-semibold text-foreground dark:text-foreground">{role.games}</div>
                    <div className="text-muted-foreground dark:text-muted-foreground">Games</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-foreground dark:text-foreground">{role.winRate.toFixed(1)}%</div>
                    <div className="text-muted-foreground dark:text-muted-foreground">Win Rate</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Team Heroes */}
      {teamStats && teamStats.teamHeroes.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground dark:text-foreground">Team Heroes</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {teamStats.teamHeroes.map((hero, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted dark:bg-muted rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-muted-foreground dark:text-muted-foreground">
                    #{index + 1}
                  </span>
                  {renderHeroWithAvatar(hero)}
                </div>
                <div className="flex items-center space-x-4 text-sm">
                  <div className="text-center">
                    <div className="font-semibold text-foreground dark:text-foreground">{hero.games}</div>
                    <div className="text-muted-foreground dark:text-muted-foreground">Games</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-foreground dark:text-foreground">{hero.winRate.toFixed(1)}%</div>
                    <div className="text-muted-foreground dark:text-muted-foreground">Win Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-foreground dark:text-foreground">{hero.roles.join(', ')}</div>
                    <div className="text-muted-foreground dark:text-muted-foreground">Roles</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Team Performance */}
      {teamStats && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground dark:text-foreground">Team Performance</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="text-center p-3 bg-muted dark:bg-muted rounded-lg">
              <div className="text-2xl font-bold text-foreground dark:text-foreground">
                {teamStats.totalWins}
              </div>
              <div className="text-sm text-muted-foreground dark:text-muted-foreground">Team Wins</div>
            </div>
            <div className="text-center p-3 bg-muted dark:bg-muted rounded-lg">
              <div className="text-2xl font-bold text-foreground dark:text-foreground">
                {teamStats.totalGames - teamStats.totalWins}
              </div>
              <div className="text-sm text-muted-foreground dark:text-muted-foreground">Team Losses</div>
            </div>
            <div className="text-center p-3 bg-muted dark:bg-muted rounded-lg">
              <div className="text-2xl font-bold text-foreground dark:text-foreground">
                {teamStats.averageXPM.toFixed(0)}
              </div>
              <div className="text-sm text-muted-foreground dark:text-muted-foreground">Avg XPM</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 