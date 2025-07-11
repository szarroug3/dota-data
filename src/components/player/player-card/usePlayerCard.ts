import { useMemo } from 'react';

export interface PlayerStats {
  totalMatches: number;
  winRate: number;
  averageKDA: number;
  averageGPM: number;
  averageXPM: number;
  favoriteHero: {
    name: string;
    matches: number;
    winRate: number;
  };
  recentPerformance: {
    trend: 'improving' | 'declining' | 'stable';
    streak: number;
    lastFiveMatches: Array<{
      win: boolean;
      heroName: string;
      kda: number;
    }>;
  };
}

export interface PlayerRank {
  tier: string;
  rank: string;
  mmr: number;
  medal: string;
  percentile: number;
  leaderboardRank?: number;
}

const generateMockPlayerStats = (): PlayerStats => {
  return {
    totalMatches: 1247,
    winRate: 64.2,
    averageKDA: 2.8,
    averageGPM: 487,
    averageXPM: 542,
    favoriteHero: {
      name: 'Invoker',
      matches: 89,
      winRate: 67.4
    },
    recentPerformance: {
      trend: 'improving',
      streak: 3,
      lastFiveMatches: [
        { win: true, heroName: 'Pudge', kda: 3.2 },
        { win: true, heroName: 'Invoker', kda: 4.1 },
        { win: false, heroName: 'Crystal Maiden', kda: 2.8 },
        { win: true, heroName: 'Anti-Mage', kda: 5.7 },
        { win: true, heroName: 'Pudge', kda: 2.9 }
      ]
    }
  };
};

const generateMockPlayerRank = (): PlayerRank => {
  return {
    tier: 'Divine',
    rank: '3',
    mmr: 5847,
    medal: 'divine_3',
    percentile: 98.2,
    leaderboardRank: undefined
  };
};

export const usePlayerCard = () => {
  const stats = useMemo(() => generateMockPlayerStats(), []);
  const rank = useMemo(() => generateMockPlayerRank(), []);

  const formatNumber = (num: number): string => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toString();
  };

  const getTrendColor = (trend: 'improving' | 'declining' | 'stable'): string => {
    switch (trend) {
      case 'improving': return 'text-green-600';
      case 'declining': return 'text-red-600';
      case 'stable': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  const getTrendIcon = (trend: 'improving' | 'declining' | 'stable'): string => {
    switch (trend) {
      case 'improving': return '📈';
      case 'declining': return '📉';
      case 'stable': return '➡️';
      default: return '➡️';
    }
  };

  const getWinRateColor = (winRate: number): string => {
    if (winRate >= 70) return 'text-green-600';
    if (winRate >= 60) return 'text-blue-600';
    if (winRate >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getKDAColor = (kda: number): string => {
    if (kda >= 3) return 'text-green-600';
    if (kda >= 2) return 'text-yellow-600';
    if (kda >= 1) return 'text-orange-600';
    return 'text-red-600';
  };

  const getRankColor = (tier: string): string => {
    switch (tier.toLowerCase()) {
      case 'herald': return 'text-gray-600';
      case 'guardian': return 'text-green-600';
      case 'crusader': return 'text-yellow-600';
      case 'archon': return 'text-orange-600';
      case 'legend': return 'text-purple-600';
      case 'ancient': return 'text-blue-600';
      case 'divine': return 'text-cyan-600';
      case 'immortal': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return {
    stats,
    rank,
    formatNumber,
    getTrendColor,
    getTrendIcon,
    getWinRateColor,
    getKDAColor,
    getRankColor,
  };
}; 