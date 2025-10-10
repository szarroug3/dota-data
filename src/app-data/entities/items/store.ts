import type { OpenDotaItem } from '@/types/external-apis';
// Auto-generated scaffold: normalized store shape for item.
// Keep functions pure; no side-effects.

export type ID = number | string;

export interface Item {
  id: ID;
  // TODO: fill fields during migration
  data?: OpenDotaItem;
}

export interface ItemState {
  byId: Record<ID, Item>;
  allIds: ID[];
}

export const itemInitialState: ItemState = {
  byId: {}, 
  allIds: []
};

/** Merge or insert a batch into normalized state. */
export function upsertItem(
  state: ItemState,
  items: readonly Item[]
): ItemState {
  if (items.length === 0) return state;
  const byId = { ...state.byId };
  const allIds = state.allIds.slice();

  for (const item of items) {
    if (!(item.id in byId)) allIds.push(item.id);
    byId[item.id] = item;
  }

  return { byId, allIds };
}
