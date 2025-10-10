// Pure selectors for teams.

import type { ID, Team, TeamState } from "../entities/teams/store";

export function selectTeamById(state: TeamState, id: ID): Team | undefined {
  return state.byId[id];
}
