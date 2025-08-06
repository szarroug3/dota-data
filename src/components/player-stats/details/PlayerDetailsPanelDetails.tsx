import React from 'react';

import { HeroAvatar } from '@/components/match-history/common/HeroAvatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useConstantsContext } from '@/contexts/constants-context';
import type { Player } from '@/types/contexts/player-context-value';

interface PlayerDetailsPanelDetailsProps {
  player: Player;
  allPlayers?: Player[];
  hiddenPlayerIds?: Set<number>;
}

// Helper function to render hero with avatar
const renderHeroWithAvatar = (hero: any) => (
  <div className="flex items-center space-x-2">
    <HeroAvatar 
      hero={hero}
      avatarSize={{ width: 'w-6', height: 'h-6' }}
    />
    <span className="text-muted-foreground dark:text-muted-foreground">
      {hero.localizedName}
    </span>
  </div>
);

export const PlayerDetailsPanelDetails: React.FC<PlayerDetailsPanelDetailsProps> = React.memo(({
  player,
  allPlayers = [],
  hiddenPlayerIds = new Set<number>(),
}) => {
  const { heroes } = useConstantsContext();
  
  // Get all heroes with detailed stats
  const allHeroes = player.heroes
    .map(hero => {
      const heroData = heroes[hero.hero_id.toString()];
      return {
        hero: heroData || {
          id: hero.hero_id.toString(),
          name: `npc_dota_hero_${hero.hero_id}`,
          localizedName: `Hero ${hero.hero_id}`,
          primaryAttribute: 'strength',
          attackType: 'melee',
          roles: [],
          imageUrl: ''
        },
        games: hero.games,
        wins: hero.win,
        winRate: hero.games > 0 ? (hero.win / hero.games) * 100 : 0,
        withGames: hero.with_games,
        withWins: hero.with_win,
        againstGames: hero.against_games,
        againstWins: hero.against_win
      };
    })
    .sort((a, b) => b.games - a.games);

  // Calculate average stats from recent matches
  const recentMatches = player.recentMatches.slice(0, 20); // Last 20 matches
  const avgStats = recentMatches.reduce((acc, match) => {
    acc.kills += match.kills || 0;
    acc.deaths += match.deaths || 0;
    acc.assists += match.assists || 0;
    acc.goldPerMin += match.gold_per_min || 0;
    acc.xpPerMin += match.xp_per_min || 0;
    acc.heroDamage += match.hero_damage || 0;
    acc.towerDamage += match.tower_damage || 0;
    acc.heroHealing += match.hero_healing || 0;
    acc.lastHits += match.last_hits || 0;
    return acc;
  }, {
    kills: 0, deaths: 0, assists: 0, goldPerMin: 0, xpPerMin: 0,
    heroDamage: 0, towerDamage: 0, heroHealing: 0, lastHits: 0
  });

  const matchCount = recentMatches.length;
  const avgKDA = avgStats.deaths > 0 ? (avgStats.kills + avgStats.assists) / avgStats.deaths : avgStats.kills + avgStats.assists;

  return (
    <div className="space-y-6">
      {/* Performance Statistics */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground dark:text-foreground">Performance Statistics</h3>
        <div className="grid grid-cols-4 gap-4">
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground dark:text-muted-foreground">Avg KDA</div>
            <div className="text-foreground dark:text-foreground">{avgKDA.toFixed(2)}</div>
          </div>
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground dark:text-muted-foreground">Avg Kills</div>
            <div className="text-foreground dark:text-foreground">{matchCount > 0 ? (avgStats.kills / matchCount).toFixed(1) : '0.0'}</div>
          </div>
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground dark:text-muted-foreground">Avg Deaths</div>
            <div className="text-foreground dark:text-foreground">{matchCount > 0 ? (avgStats.deaths / matchCount).toFixed(1) : '0.0'}</div>
          </div>
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground dark:text-muted-foreground">Avg Assists</div>
            <div className="text-foreground dark:text-foreground">{matchCount > 0 ? (avgStats.assists / matchCount).toFixed(1) : '0.0'}</div>
          </div>
        </div>
      </div>

      {/* Economy & Damage */}
      <div className="space-y-4">
        <div className="grid grid-cols-4 gap-4">
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground dark:text-muted-foreground">Avg GPM</div>
            <div className="text-foreground dark:text-foreground">{matchCount > 0 ? (avgStats.goldPerMin / matchCount).toFixed(0) : '0'}</div>
          </div>
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground dark:text-muted-foreground">Avg XPM</div>
            <div className="text-foreground dark:text-foreground">{matchCount > 0 ? (avgStats.xpPerMin / matchCount).toFixed(0) : '0'}</div>
          </div>
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground dark:text-muted-foreground">Avg Last Hits</div>
            <div className="text-foreground dark:text-foreground">{matchCount > 0 ? (avgStats.lastHits / matchCount).toFixed(0) : '0'}</div>
          </div>
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground dark:text-muted-foreground"></div>
            <div className="text-foreground dark:text-foreground"></div>
          </div>
        </div>
      </div>

      {/* Farming */}
      <div className="space-y-4">
        <div className="grid grid-cols-4 gap-4">
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground dark:text-muted-foreground">Avg Hero Damage</div>
            <div className="text-foreground dark:text-foreground">{matchCount > 0 ? (avgStats.heroDamage / matchCount).toFixed(0) : '0'}</div>
          </div>
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground dark:text-muted-foreground">Avg Tower Damage</div>
            <div className="text-foreground dark:text-foreground">{matchCount > 0 ? (avgStats.towerDamage / matchCount).toFixed(0) : '0'}</div>
          </div>
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground dark:text-muted-foreground">Avg Healing</div>
            <div className="text-foreground dark:text-foreground">{matchCount > 0 ? (avgStats.heroHealing / matchCount).toFixed(0) : '0'}</div>
          </div>
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground dark:text-muted-foreground"></div>
            <div className="text-foreground dark:text-foreground"></div>
          </div>
        </div>
      </div>

      {/* Hero Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground dark:text-foreground">Hero Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rank</TableHead>
                <TableHead>Hero</TableHead>
                <TableHead className="text-center">Games</TableHead>
                <TableHead className="text-center">Win Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allHeroes.map((hero, index) => (
                <TableRow key={index}>
                  <TableCell className="font-semibold text-foreground dark:text-foreground">{index + 1}</TableCell>
                  <TableCell>
                    {renderHeroWithAvatar(hero.hero)}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="font-semibold text-foreground dark:text-foreground">{hero.games}</div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="font-semibold text-foreground dark:text-foreground">{hero.winRate.toFixed(1)}%</div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
});

PlayerDetailsPanelDetails.displayName = 'PlayerDetailsPanelDetails'; 