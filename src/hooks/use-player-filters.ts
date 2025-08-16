import { useCallback, useMemo, useState } from 'react';

import type { Player } from '@/types/contexts/player-context-value';

export interface PlayerFilters {
  search: string;
  sortBy: 'name' | 'rank' | 'games' | 'winRate' | 'heroes';
  sortDirection: 'asc' | 'desc';
}

export function usePlayerFilters(players: Player[]) {
  const [filters, setFilters] = useState<PlayerFilters>({
    search: '',
    sortBy: 'name',
    sortDirection: 'asc'
  });

  const updateFilters = useCallback((newFilters: Partial<PlayerFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const filteredAndSortedPlayers = useMemo(() => {
    let filtered = players;

    // Apply search filter
    if (filters.search.trim()) {
      const searchTerm = filters.search.toLowerCase().trim();
      filtered = filtered.filter(player => 
        player.profile.profile.personaname.toLowerCase().includes(searchTerm) ||
        player.profile.profile.name.toLowerCase().includes(searchTerm)
      );
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (filters.sortBy) {
        case 'name': {
          aValue = a.profile.profile.personaname.toLowerCase();
          bValue = b.profile.profile.personaname.toLowerCase();
          break;
        }
        case 'rank': {
          aValue = a.rank_tier || 0;
          bValue = b.rank_tier || 0;
          break;
        }
        case 'games': {
          aValue = (a.wl.win + a.wl.lose) || 0;
          bValue = (b.wl.win + b.wl.lose) || 0;
          break;
        }
        case 'winRate': {
          const aGames = (a.wl.win + a.wl.lose) || 1;
          const bGames = (b.wl.win + b.wl.lose) || 1;
          aValue = (a.wl.win / aGames) * 100;
          bValue = (b.wl.win / bGames) * 100;
          break;
        }
        case 'heroes': {
          aValue = a.heroes?.length || 0;
          bValue = b.heroes?.length || 0;
          break;
        }
        default: {
          aValue = a.profile.profile.personaname.toLowerCase();
          bValue = b.profile.profile.personaname.toLowerCase();
        }
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.localeCompare(bValue);
        return filters.sortDirection === 'asc' ? comparison : -comparison;
      } else {
        const comparison = (aValue as number) - (bValue as number);
        return filters.sortDirection === 'asc' ? comparison : -comparison;
      }
    });

    return sorted;
  }, [players, filters]);

  const filterStats = useMemo(() => {
    return {
      totalPlayers: players.length,
      filteredPlayers: filteredAndSortedPlayers.length,
      searchTerm: filters.search.trim()
    };
  }, [players, filteredAndSortedPlayers, filters.search]);

  return {
    filters,
    updateFilters,
    filteredAndSortedPlayers,
    filterStats
  };
}
