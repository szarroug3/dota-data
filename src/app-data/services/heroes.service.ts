// Service layer for heroes. Keep IO here and validate responses.
// Actual endpoints will be wired during the migration step for heroes.

export interface HeroDTO {
  id: number | string;
  // TODO: expand with real API fields
}

export interface HeroService {
  fetchAll(): Promise<readonly HeroDTO[]>;
}

// Placeholder no-op service (pure scaffold). Not used by runtime yet.
export function createHeroService(): HeroService {
  return {
    async fetchAll() {
      return [] as const;
    },
  };
}
