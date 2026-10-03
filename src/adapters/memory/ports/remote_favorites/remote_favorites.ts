import { AddFavoriteResult, RemoteFavorites, RemoveFavoriteResult } from "@/core/boundary/ports/remote_favorites";
import { MemoryClient } from "@/adapters/memory/client/client";
import { Post } from "@/core/domain/post/post";

export class MemoryRemoteFavorites implements RemoteFavorites {
  constructor(private readonly memory: Pick<MemoryClient, "readFavorites" | "addFavorite" | "removeFavorite">) { }

  public fetchCount(): Promise<number | null> {
    return Promise.resolve(this.memory.readFavorites().length);
  }

  public fetchAllExcept(knownIds: ReadonlySet<string>, onFavoritesFound: (posts: Post[]) => void): Promise<void> {
    onFavoritesFound(this.memory.readFavorites().filter(post => !knownIds.has(post.id)));
    return Promise.resolve();
  }

  public findRemoved(storedIds: readonly string[]): Promise<string[] | null> {
    const listedIds = new Set(this.memory.readFavorites().map(post => post.id));
    return Promise.resolve(storedIds.filter(id => !listedIds.has(id)));
  }

  public add(id: string): Promise<AddFavoriteResult> {
    this.memory.addFavorite(id);
    return Promise.resolve("added");
  }

  public remove(id: string): Promise<RemoveFavoriteResult> {
    this.memory.removeFavorite(id);
    return Promise.resolve("removed");
  }
}
