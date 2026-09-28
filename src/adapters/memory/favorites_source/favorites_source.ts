import { Post } from "@/core/domain/post/post";
import { FavoritesSource } from "@/core/boundary/ports";
import { MemoryFavorites } from "@/adapters/memory/client/favorites";

export class MemoryFavoritesSource implements FavoritesSource {
  constructor(private readonly favorites: MemoryFavorites) { }

  public fetchAll(onFavoritesFound: (posts: Post[]) => void): Promise<void> {
    onFavoritesFound(this.favorites.all());
    return Promise.resolve();
  }

  public count(): Promise<number | null> {
    return Promise.resolve(this.favorites.all().length);
  }

  public fetchNew(existingIds: Set<string>): Promise<Post[]> {
    return Promise.resolve(this.favorites.all().filter(post => !existingIds.has(post.id)));
  }
}
