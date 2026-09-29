import { FavoritesSource } from "@/core/boundary/ports/favorites_source";
import { MemoryClient } from "@/adapters/memory/client/client";
import { Post } from "@/core/domain/post/post";

export class MemoryFavoritesSource implements FavoritesSource {
  constructor(private readonly memory: Pick<MemoryClient, "readFavorites">) { }

  public fetchCount(): Promise<number | null> {
    return Promise.resolve(this.memory.readFavorites().length);
  }

  public fetchMissing(knownIds: ReadonlySet<string>, onFavoritesFound: (posts: Post[]) => void): Promise<void> {
    onFavoritesFound(this.memory.readFavorites().filter(post => !knownIds.has(post.id)));
    return Promise.resolve();
  }
}
