import React from 'react';

import type { Hero } from '@/frontend/lib/app-data-types';
import { HeroAvatar } from '@/frontend/matches/components/stateless/common/HeroAvatar';
import { PlayerAvatar } from '@/frontend/players/components/stateless/PlayerAvatar';
import type { PlayerStats } from '@/frontend/players/hooks/usePlayerStatsPage';

interface PlayerDetailedCardProps {
  player: PlayerStats;
}

// Local lightweight types for detail renderers
type RankInfo = { displayText: string; isImmortal: boolean; stars: number };
type HeroSummary = { hero: Hero; games: number; winRate: number; roles?: string[] };
type TeamRoleSummary = { role: string; games: number; winRate: number };

type Trend = 'improving' | 'declining' | 'steady' | 'stable';

// Helper function to render rank display
const renderRank = (rank: RankInfo | null | undefined) => {
  if (!rank) return null;

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm font-medium text-foreground dark:text-foreground">{rank.displayText}</span>
      {!rank.isImmortal && rank.stars > 0 && (
        <div className="flex space-x-1">
          {Array.from({ length: rank.stars }, (_, i) => (
            <span key={i} className="text-yellow-500">
              ★
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

// Helper function to render hero with avatar
const renderHeroWithAvatar = (hero: { hero: Hero }) => (
  <div className="flex items-center space-x-2">
    <HeroAvatar hero={hero.hero} avatarSize={{ width: 'w-6', height: 'h-6' }} />
    <span className="text-muted-foreground dark:text-muted-foreground">{hero.hero.localizedName}</span>
  </div>
);

// Helper function to render hero usage section
const renderHeroUsage = (heroes: HeroSummary[], title: string) => (
  <div className="space-y-2">
    <h4 className="text-sm font-semibold text-foreground dark:text-foreground">{title}</h4>
    <div className="space-y-1">
      {heroes.map((hero, index) => (
        <div key={index} className="flex items-center justify-between text-sm">
          {renderHeroWithAvatar(hero)}
          <div className="flex items-center space-x-2">
            <span className="text-xs text-muted-foreground dark:text-muted-foreground">{hero.games} games</span>
            <span className="text-xs font-medium">{hero.winRate.toFixed(1)}%</span>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Helper function to render team role statistics
const renderTeamRoles = (roles: TeamRoleSummary[]) => (
  <div className="space-y-2">
    <h4 className="text-sm font-semibold text-foreground dark:text-foreground">Team Roles</h4>
    <div className="space-y-1">
      {roles.map((role, index) => (
        <div key={index} className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground dark:text-muted-foreground">{role.role}</span>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-muted-foreground dark:text-muted-foreground">{role.games} games</span>
            <span className="text-xs font-medium">{role.winRate.toFixed(1)}%</span>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Helper function to render team hero statistics
const renderTeamHeroes = (heroes: HeroSummary[]) => (
  <div className="space-y-2">
    <h4 className="text-sm font-semibold text-foreground dark:text-foreground">Team Heroes</h4>
    <div className="space-y-1">
      {heroes.map((hero, index) => (
        <div key={index} className="text-sm">
          <div className="flex items-center justify-between">
            {renderHeroWithAvatar(hero)}
            <div className="flex items-center space-x-2">
              <span className="text-xs text-muted-foreground dark:text-muted-foreground">{hero.games} games</span>
              <span className="text-xs font-medium">{hero.winRate.toFixed(1)}%</span>
            </div>
          </div>
          {hero.roles && hero.roles.length > 0 && (
            <div className="text-xs text-muted-foreground dark:text-muted-foreground mt-1 ml-8">
              Roles: {hero.roles.join(', ')}
            </div>
          )}
        </div>
      ))}
    </div>
  </div>
);

// Helper function to render performance trend badge
const renderPerformanceTrend = (trend: Trend) => {
  const getTrendClasses = () => {
    switch (trend) {
      case 'improving':
        return 'bg-green-100 text-green-800';
      case 'declining':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-muted text-foreground';
    }
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getTrendClasses()}`}>
      {trend.charAt(0).toUpperCase() + trend.slice(1)}
    </span>
  );
};

export const PlayerDetailedCard: React.FC<PlayerDetailedCardProps> = ({ player }) => (
  <div className="bg-card dark:bg-card rounded-lg shadow-md p-6">
    <div className="flex items-start justify-between mb-4">
      <div className="flex items-center space-x-4">
        <PlayerAvatar player={player.player} avatarSize={{ width: 'w-16', height: 'h-16' }} showLink={true} />
        <div>
          <h3 className="text-lg font-semibold text-foreground dark:text-foreground">{player.playerName}</h3>
          {player.detailedStats?.rank && renderRank(player.detailedStats.rank as RankInfo)}
          <p className="text-sm text-muted-foreground dark:text-muted-foreground">
            {player.totalMatches} matches • {player.winRate.toFixed(1)}% win rate
          </p>
        </div>
      </div>
      <div className="flex flex-col items-end space-y-2">
        {renderPerformanceTrend((player.recentPerformance.trend as Trend) || 'stable')}
      </div>
    </div>

    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div className="text-center">
        <div className="font-semibold text-foreground dark:text-foreground">{player.averageKills.toFixed(1)}</div>
        <div className="text-muted-foreground dark:text-muted-foreground">Avg Kills</div>
      </div>
      <div className="text-center">
        <div className="font-semibold text-foreground dark:text-foreground">{player.averageDeaths.toFixed(1)}</div>
        <div className="text-muted-foreground dark:text-muted-foreground">Avg Deaths</div>
      </div>
      <div className="text-center">
        <div className="font-semibold text-foreground dark:text-foreground">{player.averageAssists.toFixed(1)}</div>
        <div className="text-muted-foreground dark:text-muted-foreground">Avg Assists</div>
      </div>
      <div className="text-center">
        <div className="font-semibold text-foreground dark:text-foreground">{player.averageKDA.toFixed(2)}</div>
        <div className="text-muted-foreground dark:text-muted-foreground">Avg KDA</div>
      </div>
      <div className="text-center">
        <div className="font-semibold text-foreground dark:text-foreground">{player.averageGPM.toFixed(0)}</div>
        <div className="text-muted-foreground dark:text-muted-foreground">Avg GPM</div>
      </div>
      <div className="text-center">
        <div className="font-semibold text-foreground dark:text-foreground">{player.averageXPM.toFixed(0)}</div>
        <div className="text-muted-foreground dark:text-muted-foreground">Avg XPM</div>
      </div>
    </div>

    {player.detailedStats && (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="space-y-4">
          {player.detailedStats.topHeroesAllTime.length > 0 &&
            renderHeroUsage(player.detailedStats.topHeroesAllTime as HeroSummary[], 'Top Heroes (All Time)')}
          {player.detailedStats.topHeroesRecent.length > 0 &&
            renderHeroUsage(player.detailedStats.topHeroesRecent as HeroSummary[], 'Top Heroes (Recent)')}
        </div>
        <div className="space-y-4">
          {player.detailedStats.teamRoles.length > 0 &&
            renderTeamRoles(player.detailedStats.teamRoles as TeamRoleSummary[])}
          {player.detailedStats.teamHeroes.length > 0 &&
            renderTeamHeroes(player.detailedStats.teamHeroes as HeroSummary[])}
        </div>
      </div>
    )}

    <div className="mt-4">
      <h4 className="text-sm font-semibold text-foreground dark:text-foreground mb-2">Recent Performance</h4>
      <div className="flex space-x-1">
        {player.recentPerformance.lastFiveMatches.map((match: { win: boolean; kda: number }, index: number) => (
          <div
            key={index}
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
              match.win ? 'bg-green-500' : 'bg-red-500'
            }`}
          >
            {match.win ? 'W' : 'L'}
          </div>
        ))}
      </div>
    </div>
  </div>
);
