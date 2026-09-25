import { FavoritesConcurrentFetcher } from "@/features/favorites/model/retrieval/concurrent_fetcher";
import { FavoritesSequentialFetcher } from "@/features/favorites/model/retrieval/sequential_fetcher";
import { Post } from "@/types/api";
import { Rule34NetworkConfig } from "@/config/rule34_network_config";

export class FavoritesFetcher {
  constructor(private readonly pageId: string) { }

  public fetchAll(onFound: (posts: Post[]) => void, firstPageFavorites?: Post[]): Promise<void> {
    return new FavoritesConcurrentFetcher(onFound, this.pageId, firstPageFavorites).fetchAllFavorites();
  }

  public fetchNew(existingIds: Set<string>, firstPageFavorites?: Post[]): Promise<Post[]> {
    return new FavoritesSequentialFetcher(Rule34NetworkConfig.favoritesPageFetchDelay, Rule34NetworkConfig.favoritesPageFetchRetries, this.pageId)
      .fetchNew(existingIds, firstPageFavorites);
  }
}
