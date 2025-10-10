import type { OpenDotaLeague } from '@/types/external-apis';
// Auto-generated scaffold: normalized store shape for league.
// Keep functions pure; no side-effects.

export type ID = number | string;

export interface League {
  id: ID;
  // TODO: fill fields during migration
  data?: OpenDotaLeague;
}

export interface LeagueState {
  byId: Record<ID, League>;
  allIds: ID[];
}

export const leagueInitialState: LeagueState = {
  byId: {}, 
  allIds: []
};

/** Merge or insert a batch into normalized state. */
export function upsertLeague(
  state: LeagueState,
  items: readonly League[]
): LeagueState {
  if (items.length === 0) return state;
  const byId = { ...state.byId };
  const allIds = state.allIds.slice();

  for (const item of items) {
    if (!(item.id in byId)) allIds.push(item.id);
    byId[item.id] = item;
  }

  return { byId, allIds };
}
