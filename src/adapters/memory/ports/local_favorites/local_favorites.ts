import { LocalFavorites } from "@/core/boundary/ports/local_favorites";

export class MemoryLocalFavorites implements LocalFavorites {
  private ids: string[] = [];

  public getAll(): Promise<string[]> {
    return Promise.resolve([...this.ids]);
  }

  public prepend(postIds: string[]): Promise<void> {
    const added = new Set(postIds);

    this.ids = [...added, ...this.ids.filter(id => !added.has(id))];
    return Promise.resolve();
  }

  public remove(postId: string): Promise<void> {
    this.ids = this.ids.filter(id => id !== postId);
    return Promise.resolve();
  }

  public clear(): Promise<void> {
    this.ids = [];
    return Promise.resolve();
  }
}