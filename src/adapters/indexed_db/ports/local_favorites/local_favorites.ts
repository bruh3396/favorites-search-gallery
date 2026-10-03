import { IndexedDbClient, IndexedDbStoreName } from "@/adapters/indexed_db/client/client";
import { LocalFavorites } from "@/core/boundary/ports/local_favorites";

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

  public prepend(postIds: string[]): Promise<void> {
    return this.update(ids => {
      const added = new Set(postIds);
      return [...added, ...ids.filter(id => !added.has(id))];
    });
  }

  public remove(postId: string): Promise<void> {
    return this.update(ids => ids.filter(id => id !== postId));
  }

  public async clear(): Promise<void> {
    await this.indexedDb.runTransaction(STORE_NAME, "readwrite", store => store.delete(this.configuration.ownerId));
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
