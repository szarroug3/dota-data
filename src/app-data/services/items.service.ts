// Service layer for items. Keep IO here and validate responses.

export interface ItemDTO {
  id: number | string;
}

export interface ItemService {
  fetchAll(): Promise<readonly ItemDTO[]>;
}

export function createItemService(): ItemService {
  return {
    async fetchAll() {
      return [] as const;
    },
  };
}
