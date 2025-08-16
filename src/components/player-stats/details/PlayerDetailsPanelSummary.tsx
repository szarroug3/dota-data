import React from 'react';

import { HeroAvatar } from '@/components/match-history/common/HeroAvatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useConstantsContext } from '@/contexts/constants-context';
import type { Hero as ConstantsHero } from '@/types/contexts/constants-context-value';
import type { Player } from '@/types/contexts/player-context-value';

interface PlayerDetailsPanelSummaryProps {
  player: Player;
  allPlayers?: Player[];
  hiddenPlayerIds?: Set<number>;
}

// Rank display removed per requirements

// Helper function to render hero with avatar
const renderHeroWithAvatar = (hero: ConstantsHero) => (
  <div className="flex items-center space-x-2 min-w-0 w-full">
    <HeroAvatar 
      hero={hero}
      avatarSize={{ width: 'w-8', height: 'h-8' }}
    />
    <span className="text-muted-foreground dark:text-muted-foreground @[335px]:block hidden truncate flex-1">
      {hero.localizedName}
    </span>
  </div>
);

export const PlayerDetailsPanelSummary: React.FC<PlayerDetailsPanelSummaryProps> = React.memo(({ player }) => {
  const { heroes } = useConstantsContext();
  
  // Get top 5 heroes by games played
  const topHeroes = player.heroes
    .sort((a, b) => b.games - a.games)
    .slice(0, 5)
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
        winRate: hero.games > 0 ? (hero.win / hero.games) * 100 : 0
      };
    });

  const totalGames = player.wl.win + player.wl.lose;
  const winRate = totalGames > 0 ? (player.wl.win / totalGames) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <div className="space-y-4 min-w-0">
        <h3 className="text-lg font-semibold text-foreground dark:text-foreground truncate">Basic Information</h3>
        <p className="text-sm text-muted-foreground dark:text-muted-foreground @[190px]:block hidden truncate">
          <span className="text-foreground dark:text-foreground">{totalGames}</span>
          <span className="@[350px]:inline hidden">{' '}Games</span>
          <span className="mx-1">•</span>
          <span className="text-foreground dark:text-foreground">{player.wl.win}</span>
          <span className="@[350px]:inline hidden">{' '}Wins</span>
          <span className="mx-1">•</span>
          <span className="text-foreground dark:text-foreground">{winRate.toFixed(1)}%</span>
          <span className="@[350px]:inline hidden">{' '}Win Rate</span>
        </p>
        <div className="@[190px]:hidden block h-5" aria-hidden="true" />
      </div>

      {/* Top Heroes */}
      <Card>
        <CardHeader className="min-w-0">
          <CardTitle className="text-lg font-semibold text-foreground dark:text-foreground truncate">Top Heroes</CardTitle>
        </CardHeader>
        <CardContent className="min-w-0">
          <Table className="table-fixed w-full">
            <TableHeader>
              <TableRow>
                <TableHead className="truncate">Hero</TableHead>
                <TableHead className="text-center @[315px]:table-cell hidden w-[72px]">Games</TableHead>
                <TableHead className="text-center @[245px]:table-cell hidden w-[96px]">Win Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topHeroes.map((hero) => (
                <TableRow key={hero.hero.id}>
                  <TableCell className="min-w-0">
                    {renderHeroWithAvatar(hero.hero)}
                  </TableCell>
                  <TableCell className="text-center @[315px]:table-cell hidden w-[72px]">
                    <div className="font-semibold text-foreground dark:text-foreground">{hero.games}</div>
                  </TableCell>
                  <TableCell className="text-center @[245px]:table-cell hidden w-[96px]">
                    <div className="font-semibold text-foreground dark:text-foreground">{hero.winRate.toFixed(1)}%</div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recent Performance section removed as requested */}
    </div>
  );
});

PlayerDetailsPanelSummary.displayName = 'PlayerDetailsPanelSummary'; 