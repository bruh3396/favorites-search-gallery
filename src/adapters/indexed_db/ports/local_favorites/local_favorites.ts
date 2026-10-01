import { IndexedDbClient, StoreName } from "@/adapters/indexed_db/client/client";
import { LocalFavorites } from "@/core/boundary/ports/local_favorites";

const STORE_NAME: StoreName = "favorites";

export class IndexedDbLocalFavorites implements LocalFavorites {
  constructor(private readonly indexedDb: IndexedDbClient, private readonly ownerId: string) { }

  public async getAll(): Promise<string[]> {
    const request = await this.indexedDb.runTransaction(STORE_NAME, "readonly", store => store.get(this.ownerId) as IDBRequest<string[] | undefined>);
    return request.result ?? [];
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
    await this.indexedDb.runTransaction(STORE_NAME, "readwrite", store => store.delete(this.ownerId));
  }

  private async update(change: (ids: string[]) => string[]): Promise<void> {
    await this.indexedDb.runTransaction(STORE_NAME, "readwrite", store => {
      const request = store.get(this.ownerId) as IDBRequest<string[] | undefined>;

      request.onsuccess = (): void => {
        store.put(change(request.result ?? []), this.ownerId);
      };
    });
  }
}
