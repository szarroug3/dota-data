import type { OpenDotaPlayerComprehensive } from '@/types/external-apis';
// Auto-generated scaffold: normalized store shape for player.
// Keep functions pure; no side-effects.

export type ID = number | string;

export interface Player {
  id: ID;
  // TODO: fill fields during migration
  // Using import("@/src/types/json").JsonObject to remain strict without 'any'.
  data?: OpenDotaPlayerComprehensive;
}

export interface PlayerState {
  byId: Record<ID, Player>;
  allIds: ID[];
}

export const playerInitialState: PlayerState = {
  byId: {}, 
  allIds: []
};

/** Merge or insert a batch into normalized state. */
export function upsertPlayer(
  state: PlayerState,
  items: readonly Player[]
): PlayerState {
  if (items.length === 0) return state;
  const byId = { ...state.byId };
  const allIds = state.allIds.slice();

  for (const item of items) {
    if (!(item.id in byId)) allIds.push(item.id);
    byId[item.id] = item;
  }

  return { byId, allIds };
}
