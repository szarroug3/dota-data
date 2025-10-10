import type { OpenDotaMatch } from '@/types/external-apis';
// Auto-generated scaffold: normalized store shape for match.
// Keep functions pure; no side-effects.

export type ID = number | string;

export interface Match {
  id: ID;
  // TODO: fill fields during migration
  // Using import("@/src/types/json").JsonObject to remain strict without 'any'.
  data?: OpenDotaMatch;
}

export interface MatchState {
  byId: Record<ID, Match>;
  allIds: ID[];
}

export const matchInitialState: MatchState = {
  byId: {}, 
  allIds: []
};

/** Merge or insert a batch into normalized state. */
export function upsertMatch(
  state: MatchState,
  items: readonly Match[]
): MatchState {
  if (items.length === 0) return state;
  const byId = { ...state.byId };
  const allIds = state.allIds.slice();

  for (const item of items) {
    if (!(item.id in byId)) allIds.push(item.id);
    byId[item.id] = item;
  }

  return { byId, allIds };
}
