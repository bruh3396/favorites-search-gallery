import { FAVORITES_PER_PAGE } from "@/adapters/rule34/client/site/favorites_page/fetcher";
import { FavoritesSource } from "@/core/boundary/ports/favorites_source";
import { FullPageFetcher } from "@/adapters/rule34/ports/favorites_source/full_page_fetcher";
import { IncrementalPageFetcher } from "@/adapters/rule34/ports/favorites_source/incremental_page_fetcher";
import { Post } from "@/core/domain/post/post";
import { Rule34SiteClient } from "@/adapters/rule34/client/site/client";
import { withExponentialBackoff } from "@/lib/async/scheduling";

const FETCH_DELAY = 1_000;
const FETCH_ATTEMPTS = 5;
const RETRY_BACKOFF_BASE = 7;

export class Rule34FavoritesSource implements FavoritesSource {
  constructor(
    private readonly rule34: Pick<Rule34SiteClient, "readFavoritesPageId" | "readFirstFavoritesPage" | "fetchFavoritesPage" | "fetchFavoritesCount" | "prioritizeFavorites">,
    private readonly pageId: string = rule34.readFavoritesPageId(),
    private readonly firstPageFavorites: Post[] | null = rule34.readFirstFavoritesPage(),
    private readonly fetchDelay: number = FETCH_DELAY,
    private readonly fetchAttempts: number = FETCH_ATTEMPTS
  ) { }

  public fetchCount(): Promise<number | null> {
    return this.rule34.fetchFavoritesCount(this.pageId);
  }

  public fetchMissing(knownIds: ReadonlySet<string>, onFavoritesFound: (posts: Post[]) => void): Promise<void> {
    return this.rule34.prioritizeFavorites(() => this.fetchPages(knownIds, onFavoritesFound));
  }

  private fetchPages(knownIds: ReadonlySet<string>, onFavoritesFound: (posts: Post[]) => void): Promise<void> {
    if (knownIds.size === 0) {
      return this.createFullPageFetcher(onFavoritesFound).fetchAll();
    }
    return this.createIncrementalPageFetcher(knownIds, onFavoritesFound).fetchMissing(this.firstPageFavorites ?? undefined);
  }

  private createFullPageFetcher(onFavoritesFound: (posts: Post[]) => void): FullPageFetcher {
    return new FullPageFetcher(onFavoritesFound, pageIndex => this.fetch(pageIndex), retryCount => computeRetryDelay(retryCount, this.fetchDelay), this.firstPageFavorites ?? undefined);
  }

  private createIncrementalPageFetcher(knownIds: ReadonlySet<string>, onFavoritesFound: (posts: Post[]) => void): IncrementalPageFetcher {
    return new IncrementalPageFetcher(onFavoritesFound, pageIndex => this.fetchWithRetries(pageIndex), FAVORITES_PER_PAGE, this.fetchDelay, knownIds);
  }

  private fetch(pageIndex: number): Promise<Post[]> {
    return this.rule34.fetchFavoritesPage(this.pageId, pageIndex);
  }

  private fetchWithRetries(pageIndex: number): Promise<Post[]> {
    return withExponentialBackoff(() => this.fetch(pageIndex), this.fetchAttempts);
  }
}

export function computeRetryDelay(retryCount: number, fetchDelay: number): number {
  return (RETRY_BACKOFF_BASE ** retryCount) + fetchDelay;
}
