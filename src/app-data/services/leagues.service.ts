// Service layer for leagues. Keep IO here and validate responses.

export interface LeagueDTO {
  id: number | string;
}

export interface LeagueService {
  fetchAll(): Promise<readonly LeagueDTO[]>;
}

export function createLeagueService(): LeagueService {
  return {
    async fetchAll() {
      return [] as const;
    },
  };
}
