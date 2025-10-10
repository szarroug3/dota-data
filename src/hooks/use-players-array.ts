import { useMemo } from 'react';

import { usePlayerContext } from '@/contexts/player-context';

export function usePlayersArray() {
  const { players, isLoading } = usePlayerContext();
  
  const playersArray = useMemo(() => {
    return Array.from(players.values());
  }, [players]);

  return {
    players: playersArray,
    isLoading
  };
}
