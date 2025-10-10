// Pure selectors for players.

import type { ID, Player, PlayerState } from "../entities/players/store";

export function selectPlayerById(state: PlayerState, id: ID): Player | undefined {
  return state.byId[id];
}

export function selectAllPlayers(state: PlayerState): readonly Player[] {
  return state.allIds.map((id) => state.byId[id]).filter((player): player is Player => player != null);
}
