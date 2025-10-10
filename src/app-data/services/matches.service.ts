// Service layer for matches. Keep IO here and validate responses.
// Actual endpoints will be wired during the migration step for matches.

export interface MatchDTO {
  id: number | string;
  // TODO: expand with real API fields
}

export interface MatchService {
  fetchAll(): Promise<readonly MatchDTO[]>;
}

// Placeholder no-op service (pure scaffold). Not used by runtime yet.
export function createMatchService(): MatchService {
  return {
    async fetchAll() {
      return [] as const;
    },
  };
}
