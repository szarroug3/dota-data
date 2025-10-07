import { useCallback, useMemo, useState } from 'react';

import type { Player } from '@/frontend/lib/app-data-types';

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
        const av = a.profile.personaname.toLowerCase();
        const bv = b.profile.personaname.toLowerCase();
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
        const av = a.heroStats.reduce((sum, hero) => sum + hero.games, 0);
        const bv = b.heroStats.reduce((sum, hero) => sum + hero.games, 0);
        return flip(compareNumbers(av, bv));
      };
    case 'winRate':
      return (a: Player, b: Player) => {
        const aGames = a.heroStats.reduce((sum, hero) => sum + hero.games, 0) || 1;
        const bGames = b.heroStats.reduce((sum, hero) => sum + hero.games, 0) || 1;
        const aWins = a.heroStats.reduce((sum, hero) => sum + hero.wins, 0);
        const bWins = b.heroStats.reduce((sum, hero) => sum + hero.wins, 0);
        const av = (aWins / aGames) * 100;
        const bv = (bWins / bGames) * 100;
        return flip(compareNumbers(av, bv));
      };
    case 'heroes':
      return (a: Player, b: Player) => {
        const av = a.heroStats.length;
        const bv = b.heroStats.length;
        return flip(compareNumbers(av, bv));
      };
    default:
      return (a: Player, b: Player) => {
        const av = a.profile.personaname.toLowerCase();
        const bv = b.profile.personaname.toLowerCase();
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
          const persona = player.profile.personaname.toLowerCase();
          const realName = player.profile.name.toLowerCase();
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
