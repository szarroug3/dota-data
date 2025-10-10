// Service layer for teams. Keep IO here and validate responses.
// Actual endpoints will be wired during the migration step for teams.

export interface TeamDTO {
  id: number | string;
  // TODO: expand with real API fields
}

export interface TeamService {
  fetchAll(): Promise<readonly TeamDTO[]>;
}

// Placeholder no-op service (pure scaffold). Not used by runtime yet.
export function createTeamService(): TeamService {
  return {
    async fetchAll() {
      return [] as const;
    },
  };
}
