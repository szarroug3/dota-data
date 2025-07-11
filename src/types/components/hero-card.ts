/**
 * Hero Card Component Types
 * 
 * Type definitions for the hero card component and its variants
 */

export interface HeroCardProps {
  heroId: string;
  isSelected?: boolean;
  isHidden?: boolean;
  onSelect?: (heroId: string) => void;
  onHide?: (heroId: string) => void;
  onViewDetails?: (heroId: string) => void;
  mode?: 'list' | 'grid' | 'detailed';
  showStats?: boolean;
  showMeta?: boolean;
  showRole?: boolean;
  className?: string;
}

export interface HeroInfo {
  id: string;
  name: string;
  localizedName: string;
  primaryAttribute: 'strength' | 'agility' | 'intelligence' | 'universal';
  attackType: 'melee' | 'ranged';
  roles: string[];
  image: string;
  icon: string;
  complexity: number; // 1-3 scale
  stats: {
    baseHealth: number;
    baseMana: number;
    baseArmor: number;
    baseAttackMin: number;
    baseAttackMax: number;
    moveSpeed: number;
    attackRange: number;
    attackSpeed: number;
  };
}

export interface HeroMetaInfo {
  pickRate: number;
  winRate: number;
  banRate: number;
  tier: 'S' | 'A' | 'B' | 'C' | 'D';
  popularityRank: number;
  winRateRank: number;
  metaScore: number;
  trend: 'rising' | 'stable' | 'falling';
  proPresence: number;
  recentChanges: string[];
}

export interface HeroStats {
  totalMatches: number;
  wins: number;
  losses: number;
  averageKDA: number;
  averageGPM: number;
  averageXPM: number;
  averageDuration: number;
  buildWinRates: Array<{
    build: string;
    winRate: number;
    popularity: number;
  }>;
  counters: Array<{
    heroId: string;
    heroName: string;
    advantage: number;
  }>;
  synergies: Array<{
    heroId: string;
    heroName: string;
    synergy: number;
  }>;
}

export interface HeroCardVariantProps extends HeroCardProps {
  hero: HeroInfo;
  meta: HeroMetaInfo;
  stats: HeroStats;
}

export interface HeroCardSkeletonProps {
  mode?: 'list' | 'grid' | 'detailed';
  className?: string;
}

export interface HeroCardListProps {
  heroIds: string[];
  selectedHeroId?: string | null;
  hiddenHeroIds?: string[];
  onSelectHero?: (heroId: string) => void;
  onHideHero?: (heroId: string) => void;
  onViewDetails?: (heroId: string) => void;
  mode?: 'list' | 'grid' | 'detailed';
  showStats?: boolean;
  showMeta?: boolean;
  showRole?: boolean;
  className?: string;
} 