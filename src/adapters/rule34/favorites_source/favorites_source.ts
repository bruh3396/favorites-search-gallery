import { FAVORITES_PER_PAGE } from "@/adapters/rule34/client/favorites_page/favorites_page";
import { FavoritesSource } from "@/core/boundary/ports";
import { FullPageFetcher } from "@/adapters/rule34/favorites_source/full_page_fetcher";
import { IncrementalPageFetcher } from "@/adapters/rule34/favorites_source/incremental_page_fetcher";
import { Post } from "@/core/domain/post/post";
import { Rule34Client } from "@/adapters/rule34/client/client";
import { withExponentialBackoff } from "@/lib/async/scheduling";

const FETCH_DELAY = 1_000;
const FETCH_ATTEMPTS = 5;
const RETRY_BACKOFF_BASE = 7;

export type Rule34FavoritesSite = Pick<Rule34Client, "readFavoritesPageId" | "readFirstFavoritesPage" | "fetchFavoritesPage" | "fetchFavoritesCount" | "prioritizeFavorites">;

export class Rule34FavoritesSource implements FavoritesSource {
  constructor(
    private readonly site: Rule34FavoritesSite,
    private readonly pageId: string = site.readFavoritesPageId(),
    private readonly firstPageFavorites: Post[] | null = site.readFirstFavoritesPage(),
    private readonly fetchDelay: number = FETCH_DELAY,
    private readonly fetchAttempts: number = FETCH_ATTEMPTS
  ) { }

  public count(): Promise<number | null> {
    return this.site.fetchFavoritesCount(this.pageId);
  }

  public fetchAll(onFavoritesFound: (posts: Post[]) => void): Promise<void> {
    return this.site.prioritizeFavorites(() => new FullPageFetcher(onFavoritesFound, pageIndex => this.fetch(pageIndex), retryCount => computeRetryDelay(retryCount, this.fetchDelay), this.firstPageFavorites ?? undefined)
      .fetchAll());
  }

  public fetchNew(seen: Set<string>): Promise<Post[]> {
    return this.site.prioritizeFavorites(() => new IncrementalPageFetcher(pageIndex => this.fetchWithRetries(pageIndex), FAVORITES_PER_PAGE, this.fetchDelay, seen)
      .fetchNew(this.firstPageFavorites ?? undefined));
  }

  private fetch(pageIndex: number): Promise<Post[]> {
    return this.site.fetchFavoritesPage(this.pageId, pageIndex);
  }

  private fetchWithRetries(pageIndex: number): Promise<Post[]> {
    return withExponentialBackoff(() => this.fetch(pageIndex), this.fetchAttempts);
  }
}

export function computeRetryDelay(retryCount: number, fetchDelay: number): number {
  return (RETRY_BACKOFF_BASE ** retryCount) + fetchDelay;
}
