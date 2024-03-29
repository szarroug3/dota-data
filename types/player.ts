import { PlayerHero } from './hero';

interface PlayerInfo {
  name?: string;
  picture?: string;
  rank?: {
    medal: string;
    stars: string;
    immortalRank: string;
    altText: string;
  };
}

interface Player {
  accountId: number;
  data: PlayerInfo;
  mostPlayedHeroes: PlayerHero[];
  recentlyPlayedHeroes: PlayerHero[];
}

export type { Player, PlayerInfo };
