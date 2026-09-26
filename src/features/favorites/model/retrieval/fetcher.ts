import { FavoritesFullFetcher } from "@/features/favorites/model/retrieval/full_fetcher";
import { FavoritesIncrementalFetcher } from "@/features/favorites/model/retrieval/incremental_fetcher";
import { Fetcher } from "@/features/favorites/types/types";
import { Post } from "@/types/api";
import { Rule34NetworkConfig } from "@/config/rule34_network_config";
import { withExponentialBackoff } from "@/lib/async/scheduling";

export class FavoritesFetcher implements Fetcher {
  constructor(private readonly dependencies: {
    pageId: string;
    fetch: (pageId: string, pageIndex: number) => Promise<Post[]>;
  }) { }

  public fetchAll(onFavoritesFound: (posts: Post[]) => void, firstPageFavorites?: Post[]): Promise<void> {
    return new FavoritesFullFetcher(onFavoritesFound, pageIndex => this.fetch(pageIndex), retryCount => computeRetryDelay(retryCount), firstPageFavorites)
      .fetchAll();
  }

  public fetchNew(seen: Set<string>, firstPageFavorites?: Post[]): Promise<Post[]> {
    return new FavoritesIncrementalFetcher(pageIndex => this.fetchWithRetries(pageIndex), Rule34NetworkConfig.favoritesPageFetchDelay, seen)
      .fetchNew(firstPageFavorites);
  }

  private fetch(pageIndex: number): Promise<Post[]> {
    return this.dependencies.fetch(this.dependencies.pageId, pageIndex);
  }

  private fetchWithRetries(pageIndex: number): Promise<Post[]> {
    return withExponentialBackoff(() => this.fetch(pageIndex), Rule34NetworkConfig.favoritesPageFetchRetries);
  }
}

export function computeRetryDelay(retryCount: number): number {
  return (Rule34NetworkConfig.favoritesPageRetryBackoffBase ** retryCount) + Rule34NetworkConfig.favoritesPageFetchDelay;
}
