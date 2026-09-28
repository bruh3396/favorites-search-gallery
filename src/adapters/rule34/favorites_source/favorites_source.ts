import { Post } from "@/core/domain/post/post";
import { FAVORITES_PER_PAGE, fetchFavoritesPagePosts } from "@/adapters/rule34/client/favorites_page/favorites_page";
import { readFavoritesPageId, readPageMode, readQueryParam } from "@/adapters/rule34/client/location";
import { FavoritesSource } from "@/core/boundary/ports";
import { FullPageFetcher } from "@/adapters/rule34/favorites_source/full_page_fetcher";
import { IncrementalPageFetcher } from "@/adapters/rule34/favorites_source/incremental_page_fetcher";
import { Rule34NetworkConfig } from "@/adapters/rule34/client/network_config";
import { fetchFavoritesCount } from "@/adapters/rule34/client/profile_page/profile_page";
import { parseFavoritesPage } from "@/adapters/rule34/client/favorites_page/parser";
import { releasePostPageFetches } from "@/adapters/rule34/client/post_page/post_page";
import { withExponentialBackoff } from "@/lib/async/scheduling";

export class Rule34FavoritesSource implements FavoritesSource {
  constructor(
    private readonly pageId: string = readFavoritesPageId(),
    private readonly fetchPage: (pageId: string, pageIndex: number) => Promise<Post[]> = fetchFavoritesPagePosts,
    private readonly fetchCount: (pageId: string) => Promise<number | null> = fetchFavoritesCount,
    private readonly firstPageFavorites: Post[] | null = onFirstFavoritesPage() ? parseFavoritesPage(document) : null,
    private readonly onFetched: () => void = releasePostPageFetches
  ) { }

  public count(): Promise<number | null> {
    return this.fetchCount(this.pageId);
  }

  public fetchAll(onFavoritesFound: (posts: Post[]) => void): Promise<void> {
    return new FullPageFetcher(onFavoritesFound, pageIndex => this.fetch(pageIndex), retryCount => computeRetryDelay(retryCount), this.firstPageFavorites ?? undefined)
      .fetchAll()
      .finally(() => this.onFetched());
  }

  public fetchNew(seen: Set<string>): Promise<Post[]> {
    return new IncrementalPageFetcher(pageIndex => this.fetchWithRetries(pageIndex), FAVORITES_PER_PAGE, Rule34NetworkConfig.favoritesPageFetchDelay, seen)
      .fetchNew(this.firstPageFavorites ?? undefined)
      .finally(() => this.onFetched());
  }

  private fetch(pageIndex: number): Promise<Post[]> {
    return this.fetchPage(this.pageId, pageIndex);
  }

  private fetchWithRetries(pageIndex: number): Promise<Post[]> {
    return withExponentialBackoff(() => this.fetch(pageIndex), Rule34NetworkConfig.favoritesPageFetchRetries);
  }
}

export function computeRetryDelay(retryCount: number): number {
  return (Rule34NetworkConfig.favoritesPageRetryBackoffBase ** retryCount) + Rule34NetworkConfig.favoritesPageFetchDelay;
}

export function onFirstFavoritesPage(): boolean {
  const pageOffset = readQueryParam("pid");
  return readPageMode() === "favorites" && (pageOffset === null || pageOffset === "0");
}
