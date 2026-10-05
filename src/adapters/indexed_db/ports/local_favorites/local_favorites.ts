import { IndexedDbClient, IndexedDbStoreName } from "@/adapters/indexed_db/client/client";
import { LocalFavorites } from "@/core/boundary/ports/local_favorites/local_favorites";

const STORE_NAME: IndexedDbStoreName = "favorites";

export interface IndexedDbLocalFavoritesConfiguration {
  ownerId: string;
}

export class IndexedDbLocalFavorites implements LocalFavorites {
  constructor(
    private readonly configuration: IndexedDbLocalFavoritesConfiguration,
    private readonly indexedDb: IndexedDbClient
  ) { }

  public async getAll(): Promise<string[]> {
    return (await this.indexedDb.runTransaction(
      STORE_NAME,
      "readonly",
      store => store.get(this.configuration.ownerId) as IDBRequest<string[] | undefined>
    )).result ?? [];
  }

  public async setAll(postIds: string[]): Promise<void> {
    await this.indexedDb.runTransaction(STORE_NAME, "readwrite", store => store.put(postIds, this.configuration.ownerId));
  }

  public prepend(postIds: string[]): Promise<void> {
    return this.update(ids => {
      const added = new Set(postIds);
      return [...added, ...ids.filter(id => !added.has(id))];
    });
  }

  public remove(postIds: string[]): Promise<void> {
    const removed = new Set(postIds);
    return this.update(ids => ids.filter(id => !removed.has(id)));
  }

  private async update(change: (ids: string[]) => string[]): Promise<void> {
    await this.indexedDb.runTransaction(STORE_NAME, "readwrite", store => {
      const request = store.get(this.configuration.ownerId) as IDBRequest<string[] | undefined>;

      request.onsuccess = (): void => {
        store.put(change(request.result ?? []), this.configuration.ownerId);
      };
    });
  }
}
