import { useCallback, useMemo, useState } from 'react';

import { usePlayerData } from '@/hooks/use-player-data';
import { useTeamData } from '@/hooks/use-team-data';
import type { Player } from '@/types/contexts/team-context-value';

export interface PlayerStats {
  playerId: string;
  playerName: string;
  avatar?: string;
  totalMatches: number;
  winRate: number;
  averageKills: number;
  averageDeaths: number;
  averageAssists: number;
  averageKDA: number;
  averageGPM: number;
  averageXPM: number;
  mostPlayedHero: {
    heroId: string;
    heroName: string;
    matches: number;
    winRate: number;
  };
  bestPerformanceHero: {
    heroId: string;
    heroName: string;
    matches: number;
    winRate: number;
    averageKDA: number;
  };
  recentPerformance: {
    trend: 'improving' | 'declining' | 'stable';
    lastFiveMatches: { win: boolean; kda: number }[];
  };
}

const generatePlayerStats = (players: Player[], activeTeamId: string): PlayerStats[] => {
  if (!players || !activeTeamId) return [];
  return players.map((player, index) => ({
    playerId: player.id,
    playerName: player.name || `Player ${player.id}`,
    avatar: undefined,
    totalMatches: 25 + Math.floor(Math.random() * 50),
    winRate: 45 + Math.random() * 40,
    averageKills: 5 + Math.random() * 10,
    averageDeaths: 3 + Math.random() * 6,
    averageAssists: 8 + Math.random() * 12,
    averageKDA: 1.5 + Math.random() * 2,
    averageGPM: 400 + Math.random() * 200,
    averageXPM: 450 + Math.random() * 250,
    mostPlayedHero: {
      heroId: `hero_${index + 1}`,
      heroName: ['Pudge', 'Invoker', 'Crystal Maiden', 'Anti-Mage', 'Phantom Assassin'][index % 5],
      matches: 8 + Math.floor(Math.random() * 15),
      winRate: 40 + Math.random() * 40
    },
    bestPerformanceHero: {
      heroId: `hero_${index + 2}`,
      heroName: ['Shadow Fiend', 'Drow Ranger', 'Lion', 'Rubick', 'Ember Spirit'][index % 5],
      matches: 5 + Math.floor(Math.random() * 10),
      winRate: 60 + Math.random() * 30,
      averageKDA: 2 + Math.random() * 3
    },
    recentPerformance: {
      trend: ['improving', 'declining', 'stable'][index % 3] as PlayerStats['recentPerformance']['trend'],
      lastFiveMatches: Array.from({ length: 5 }, () => ({
        win: Math.random() > 0.5,
        kda: 1 + Math.random() * 4
      }))
    }
  }));
};

const sortPlayers = (
  players: PlayerStats[],
  sortBy: 'winRate' | 'kda' | 'gpm' | 'matches',
  sortDirection: 'asc' | 'desc'
): PlayerStats[] => {
  return [...players].sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case 'winRate':
        comparison = a.winRate - b.winRate;
        break;
      case 'kda':
        comparison = a.averageKDA - b.averageKDA;
        break;
      case 'gpm':
        comparison = a.averageGPM - b.averageGPM;
        break;
      case 'matches':
        comparison = a.totalMatches - b.totalMatches;
        break;
    }
    return sortDirection === 'asc' ? comparison : -comparison;
  });
};

export function usePlayerStats() {
  const { teams, activeTeamId } = useTeamData();
  const { players, isLoadingPlayers, playersError } = usePlayerData();
  const [viewType, setViewType] = useState<'overview' | 'detailed'>('overview');
  const [sortBy, setSortBy] = useState<'winRate' | 'kda' | 'gpm' | 'matches'>('winRate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const activeTeam = teams?.find(team => team.id === activeTeamId) || null;

  const playerStats: PlayerStats[] = useMemo(() => {
    return generatePlayerStats(players, activeTeamId || '');
  }, [players, activeTeamId]);

  const sortedPlayers = useMemo(() => {
    return sortPlayers(playerStats, sortBy, sortDirection);
  }, [playerStats, sortBy, sortDirection]);

  const handleSortChange = useCallback((newSortBy: typeof sortBy) => {
    if (sortBy === newSortBy) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortDirection('desc');
    }
  }, [sortBy]);

  const handleSortDirectionChange = useCallback(() => {
    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
  }, []);

  return {
    teams,
    activeTeamId,
    activeTeam,
    players,
    isLoadingPlayers,
    playersError,
    viewType,
    setViewType,
    sortBy,
    setSortBy,
    sortDirection,
    setSortDirection,
    playerStats,
    sortedPlayers,
    handleSortChange,
    handleSortDirectionChange
  };
} 