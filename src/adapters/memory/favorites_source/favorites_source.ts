import { FavoritesSource } from "@/core/boundary/ports";
import { MemoryClient } from "@/adapters/memory/client/client";
import { Post } from "@/core/domain/post/post";

export class MemoryFavoritesSource implements FavoritesSource {
  constructor(private readonly memory: Pick<MemoryClient, "readFavorites">) { }

  public fetchAll(onFavoritesFound: (posts: Post[]) => void): Promise<void> {
    onFavoritesFound(this.memory.readFavorites());
    return Promise.resolve();
  }

  public count(): Promise<number | null> {
    return Promise.resolve(this.memory.readFavorites().length);
  }

  public fetchNew(existingIds: Set<string>): Promise<Post[]> {
    return Promise.resolve(this.memory.readFavorites().filter(post => !existingIds.has(post.id)));
  }
}
