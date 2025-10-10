import type { OpenDotaTeam } from '@/types/external-apis';
// Auto-generated scaffold: normalized store shape for team.
// Keep functions pure; no side-effects.

export type ID = number | string;

export interface Team {
  id: ID;
  // TODO: fill fields during migration
  // Using import("@/src/types/json").JsonObject to remain strict without 'any'.
  data?: OpenDotaTeam;
}

export interface TeamState {
  byId: Record<ID, Team>;
  allIds: ID[];
}

export const teamInitialState: TeamState = {
  byId: {}, 
  allIds: []
};

/** Merge or insert a batch into normalized state. */
export function upsertTeam(
  state: TeamState,
  items: readonly Team[]
): TeamState {
  if (items.length === 0) return state;
  const byId = { ...state.byId };
  const allIds = state.allIds.slice();

  for (const item of items) {
    if (!(item.id in byId)) allIds.push(item.id);
    byId[item.id] = item;
  }

  return { byId, allIds };
}
