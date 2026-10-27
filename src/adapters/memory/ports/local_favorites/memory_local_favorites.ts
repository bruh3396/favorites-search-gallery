import { LocalFavorites } from "@/core/boundary/ports/local_favorites/local_favorites";

export class MemoryLocalFavorites implements LocalFavorites {
  private postIds: string[] = [];

  public getAll(): Promise<readonly string[]> {
    return Promise.resolve([...this.postIds]);
  }

  public setAll(postIds: readonly string[]): Promise<void> {
    this.postIds = [...postIds];
    return Promise.resolve();
  }

  public prepend(postIds: readonly string[]): Promise<void> {
    const added = new Set(postIds);

    this.postIds = [...added, ...this.postIds.filter(id => !added.has(id))];
    return Promise.resolve();
  }

  public remove(postIds: readonly string[]): Promise<void> {
    const removed = new Set(postIds);

    this.postIds = this.postIds.filter(id => !removed.has(id));
    return Promise.resolve();
  }
}
