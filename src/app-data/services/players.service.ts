// Service layer for players. Keep IO here and validate responses.
// Actual endpoints will be wired during the migration step for players.

export interface PlayerDTO {
  id: number | string;
  // TODO: expand with real API fields
}

export interface PlayerService {
  fetchAll(): Promise<readonly PlayerDTO[]>;
}

// Placeholder no-op service (pure scaffold). Not used by runtime yet.
export function createPlayerService(): PlayerService {
  return {
    async fetchAll() {
      return [] as const;
    },
  };
}
