import type { OpenDotaHero } from '@/types/external-apis';
// Auto-generated scaffold: normalized store shape for hero.
// Keep functions pure; no side-effects.

export type ID = number | string;

export interface Hero {
  id: ID;
  // TODO: fill fields during migration
  // Using import("@/src/types/json").JsonObject to remain strict without 'any'.
  data?: OpenDotaHero;
}

export interface HeroState {
  byId: Record<ID, Hero>;
  allIds: ID[];
}

export const heroInitialState: HeroState = {
  byId: {}, 
  allIds: []
};

/** Merge or insert a batch into normalized state. */
export function upsertHero(
  state: HeroState,
  items: readonly Hero[]
): HeroState {
  if (items.length === 0) return state;
  const byId = { ...state.byId };
  const allIds = state.allIds.slice();

  for (const item of items) {
    if (!(item.id in byId)) allIds.push(item.id);
    byId[item.id] = item;
  }

  return { byId, allIds };
}
