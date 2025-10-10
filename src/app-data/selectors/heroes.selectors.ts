// Pure selectors for heroes.

import type { ID, Hero, HeroState } from "../entities/heroes/store";

export function selectHeroById(state: HeroState, id: ID): Hero | undefined {
  return state.byId[id];
}
