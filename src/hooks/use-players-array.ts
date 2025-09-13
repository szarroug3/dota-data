import { useMemo } from 'react';

import { usePlayerContext } from '@/frontend/players/contexts/state/player-context';

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
