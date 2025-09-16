import { useCallback, useMemo, useState } from 'react';

import type { Player } from '@/types/contexts/player-context-value';

export interface PlayerFilters {
  search: string;
  sortBy: 'name' | 'rank' | 'games' | 'winRate' | 'heroes';
  sortDirection: 'asc' | 'desc';
}

const compareNumbers = (a: number, b: number) => a - b;
const compareStrings = (a: string, b: string) => a.localeCompare(b);

function buildComparator(filters: PlayerFilters) {
  const flip = (cmp: number) => (filters.sortDirection === 'asc' ? cmp : -cmp);
  switch (filters.sortBy) {
    case 'name':
      return (a: Player, b: Player) => {
        const av = a.profile.profile.personaname.toLowerCase();
        const bv = b.profile.profile.personaname.toLowerCase();
        return flip(compareStrings(av, bv));
      };
    case 'rank':
      return (a: Player, b: Player) => {
        const av = a.profile.rank_tier || 0;
        const bv = b.profile.rank_tier || 0;
        return flip(compareNumbers(av, bv));
      };
    case 'games':
      return (a: Player, b: Player) => {
        const av = a.wl.win + a.wl.lose || 0;
        const bv = b.wl.win + b.wl.lose || 0;
        return flip(compareNumbers(av, bv));
      };
    case 'winRate':
      return (a: Player, b: Player) => {
        const aGames = a.wl.win + a.wl.lose || 1;
        const bGames = b.wl.win + b.wl.lose || 1;
        const av = (a.wl.win / aGames) * 100;
        const bv = (b.wl.win / bGames) * 100;
        return flip(compareNumbers(av, bv));
      };
    case 'heroes':
      return (a: Player, b: Player) => {
        const av = a.heroes?.length || 0;
        const bv = b.heroes?.length || 0;
        return flip(compareNumbers(av, bv));
      };
    default:
      return (a: Player, b: Player) => {
        const av = (a.profile.profile.personaname || '').toLowerCase();
        const bv = (b.profile.profile.personaname || '').toLowerCase();
        return flip(compareStrings(av, bv));
      };
  }
}

export function usePlayerFilters(players: Player[]) {
  const [filters, setFilters] = useState<PlayerFilters>({
    search: '',
    sortBy: 'name',
    sortDirection: 'asc',
  });

  const updateFilters = useCallback((newFilters: Partial<PlayerFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  const filteredAndSortedPlayers = useMemo(() => {
    const searchTerm = filters.search.trim().toLowerCase();
    const filtered = searchTerm
      ? players.filter((player) => {
          const persona = player.profile.profile.personaname?.toLowerCase?.() || '';
          const realName = player.profile.profile.name ? player.profile.profile.name.toLowerCase() : '';
          return persona.includes(searchTerm) || realName.includes(searchTerm);
        })
      : players;

    const comparator = buildComparator(filters);
    return [...filtered].sort(comparator);
  }, [players, filters]);

  const filterStats = useMemo(() => {
    return {
      totalPlayers: players.length,
      filteredPlayers: filteredAndSortedPlayers.length,
      searchTerm: filters.search.trim(),
    };
  }, [players, filteredAndSortedPlayers, filters.search]);

  return {
    filters,
    updateFilters,
    filteredAndSortedPlayers,
    filterStats,
  };
}
