/**
 * Hero Card Utilities
 * 
 * Utility functions and mock data generators for hero card components
 */

import { HeroInfo, HeroMetaInfo, HeroStats } from '@/types/components/hero-card';

// Mock data generators - in real app these would come from API
export const generateMockHeroInfo = (heroId: string): HeroInfo => {
  const heroes = [
    {
      id: '1',
      name: 'antimage',
      localizedName: 'Anti-Mage',
      primaryAttribute: 'agility' as const,
      attackType: 'melee' as const,
      roles: ['Carry', 'Escape', 'Nuker'],
      image: '/heroes/antimage.jpg',
      icon: '/heroes/antimage_icon.png',
      complexity: 1,
      stats: {
        baseHealth: 620,
        baseMana: 219,
        baseArmor: 0,
        baseAttackMin: 53,
        baseAttackMax: 57,
        moveSpeed: 315,
        attackRange: 150,
        attackSpeed: 1.4
      }
    },
    {
      id: '5',
      name: 'crystal_maiden',
      localizedName: 'Crystal Maiden',
      primaryAttribute: 'intelligence' as const,
      attackType: 'ranged' as const,
      roles: ['Support', 'Disabler', 'Nuker', 'Jungler'],
      image: '/heroes/crystal_maiden.jpg',
      icon: '/heroes/crystal_maiden_icon.png',
      complexity: 1,
      stats: {
        baseHealth: 480,
        baseMana: 291,
        baseArmor: -1,
        baseAttackMin: 35,
        baseAttackMax: 41,
        moveSpeed: 280,
        attackRange: 600,
        attackSpeed: 1.7
      }
    },
    {
      id: '74',
      name: 'invoker',
      localizedName: 'Invoker',
      primaryAttribute: 'intelligence' as const,
      attackType: 'ranged' as const,
      roles: ['Carry', 'Nuker', 'Disabler', 'Escape', 'Pusher'],
      image: '/heroes/invoker.jpg',
      icon: '/heroes/invoker_icon.png',
      complexity: 3,
      stats: {
        baseHealth: 492,
        baseMana: 195,
        baseArmor: 1,
        baseAttackMin: 42,
        baseAttackMax: 48,
        moveSpeed: 280,
        attackRange: 600,
        attackSpeed: 1.7
      }
    }
  ];
  
  return heroes.find(h => h.id === heroId) || heroes[0];
};

export const generateMockHeroMeta = (): HeroMetaInfo => {
  return {
    pickRate: 12.8,
    winRate: 52.3,
    banRate: 8.2,
    tier: 'A',
    popularityRank: 23,
    winRateRank: 45,
    metaScore: 85.6,
    trend: 'rising',
    proPresence: 67.4,
    recentChanges: ['Base damage increased by 2', 'Mana cost reduced on ultimate']
  };
};

export const generateMockHeroStats = (): HeroStats => {
  return {
    totalMatches: 1547289,
    wins: 809456,
    losses: 737833,
    averageKDA: 2.1,
    averageGPM: 523,
    averageXPM: 587,
    averageDuration: 2847,
    buildWinRates: [
      { build: 'Battle Fury -> Manta -> Butterfly', winRate: 67.2, popularity: 45.8 },
      { build: 'Maelstrom -> BKB -> Basher', winRate: 61.4, popularity: 23.7 }
    ],
    counters: [
      { heroId: '56', heroName: 'Pudge', advantage: -0.12 },
      { heroId: '17', heroName: 'Storm Spirit', advantage: -0.08 }
    ],
    synergies: [
      { heroId: '5', heroName: 'Crystal Maiden', synergy: 0.15 },
      { heroId: '14', heroName: 'Vengeful Spirit', synergy: 0.11 }
    ]
  };
};

// Utility functions for styling and display
export const getAttributeColor = (attribute: string): string => {
  switch (attribute) {
    case 'strength': return 'text-red-600';
    case 'agility': return 'text-green-600';
    case 'intelligence': return 'text-blue-600';
    case 'universal': return 'text-purple-600';
    default: return 'text-gray-600';
  }
};

export const getAttributeIcon = (attribute: string): string => {
  switch (attribute) {
    case 'strength': return '💪';
    case 'agility': return '🏃';
    case 'intelligence': return '🧠';
    case 'universal': return '⚡';
    default: return '❓';
  }
};

export const getTierColor = (tier: string): string => {
  switch (tier) {
    case 'S': return 'bg-destructive/20 text-destructive border-destructive/30';
    case 'A': return 'bg-orange-100 text-orange-800 border-orange-300';
    case 'B': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case 'C': return 'bg-green-100 text-green-800 border-green-300';
    case 'D': return 'bg-muted text-muted-foreground border-border';
    default: return 'bg-muted text-muted-foreground border-border';
  }
};

export const getTrendIcon = (trend: string): string => {
  switch (trend) {
    case 'rising': return '📈';
    case 'falling': return '📉';
    case 'stable': return '➡️';
    default: return '➡️';
  }
};

export const getWinRateColor = (winRate: number): string => {
  if (winRate >= 55) return 'text-green-600';
  if (winRate >= 50) return 'text-yellow-600';
  return 'text-red-600';
};

export const getComplexityStars = (complexity: number): string => {
  return '★'.repeat(complexity) + '☆'.repeat(3 - complexity);
}; 