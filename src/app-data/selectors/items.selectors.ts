// Pure selectors for items.
import type { ID, Item, ItemState } from "../entities/items/store";

export function selectItemById(state: ItemState, id: ID): Item | undefined {
  return state.byId[id];
}
