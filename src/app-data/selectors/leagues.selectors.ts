// Pure selectors for leagues.
import type { ID, League, LeagueState } from "../entities/leagues/store";

export function selectLeagueById(state: LeagueState, id: ID): League | undefined {
  return state.byId[id];
}
