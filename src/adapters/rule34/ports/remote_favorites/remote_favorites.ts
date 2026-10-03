import { AddFavoriteResult, RemoteFavorites, RemoveFavoriteResult } from "@/core/boundary/ports/remote_favorites";
import { RetryPolicy, retry } from "@/core/utils/async/retry";
import { FAVORITES_PER_PAGE } from "@/adapters/rule34/client/site/favorites_page/url";
import { Post } from "@/core/domain/post/post";
import { Random } from "@/core/boundary/ports/random";
import { Rule34FullPageFetcher } from "@/adapters/rule34/ports/remote_favorites/full_page_fetcher";
import { Rule34IncrementalPageFetcher } from "@/adapters/rule34/ports/remote_favorites/incremental_page_fetcher";
import { Rule34SiteClient } from "@/adapters/rule34/client/site/client";
import { Scheduler } from "@/core/boundary/ports/scheduler";
import { isTransient } from "@/adapters/rule34/client/error";

export interface Rule34RemoteFavoritesDependencies {
  rule34: Pick<Rule34SiteClient,
    "readFavoritesPageId" | "readFirstFavoritesPage" | "fetchFavoritesPage" | "fetchFavoriteCount" |
    "prioritizeFavorites" | "addFavorite" | "removeFavorite">;
  scheduler: Scheduler;
  random: Random;
}

const FETCH_DELAY = 1_000;
const MAX_FETCH_ATTEMPTS = 5;
const RETRY_BASE_DELAY = 1_000;
const RETRY_BACKOFF_BASE = 7;

export class Rule34RemoteFavorites implements RemoteFavorites {
  private readonly pageId: string;
  private readonly firstPageFavorites: Post[] | null;
  private readonly retryPolicy: RetryPolicy;

  constructor(private readonly dependencies: Rule34RemoteFavoritesDependencies) {
    this.pageId = dependencies.rule34.readFavoritesPageId();
    this.firstPageFavorites = dependencies.rule34.readFirstFavoritesPage();
    this.retryPolicy = {
      attempts: MAX_FETCH_ATTEMPTS,
      baseDelay: RETRY_BASE_DELAY,
      scheduler: dependencies.scheduler,
      random: dependencies.random,
      isRetryable: isTransient
    };
  }

  public fetchCount(): Promise<number | null> {
    return retry(() => this.dependencies.rule34.fetchFavoriteCount(this.pageId), this.retryPolicy)
      .catch(() => null);
  }

  public fetchAllExcept(knownIds: ReadonlySet<string>, onFavoritesFound: (posts: Post[]) => void): Promise<void> {
    return this.dependencies.rule34.prioritizeFavorites(() => this.fetchPages(knownIds, onFavoritesFound));
  }

  public async add(id: string): Promise<AddFavoriteResult> {
    return await this.dependencies.rule34.addFavorite(id) ?? "cancelled";
  }

  public async remove(id: string): Promise<RemoveFavoriteResult> {
    return await this.dependencies.rule34.removeFavorite(id) ? "removed" : "cancelled";
  }

  private fetchPages(knownIds: ReadonlySet<string>, onFavoritesFound: (posts: Post[]) => void): Promise<void> {
    const firstPage = this.firstPageFavorites ?? undefined;

    if (knownIds.size === 0) {
      return this.createFullPageFetcher(onFavoritesFound).fetchAll(firstPage);
    }
    return this.createIncrementalPageFetcher(onFavoritesFound).fetchMissing(knownIds, firstPage);
  }

  private createFullPageFetcher(onFavoritesFound: (posts: Post[]) => void): Rule34FullPageFetcher {
    return new Rule34FullPageFetcher({
      onPostsFound: onFavoritesFound,
      fetch: (pageIndex): Promise<Post[]> => this.fetch(pageIndex),
      delayForRetry: (retryCount): number => computeRetryDelay(retryCount, FETCH_DELAY),
      scheduler: this.dependencies.scheduler
    });
  }

  private createIncrementalPageFetcher(onFavoritesFound: (posts: Post[]) => void): Rule34IncrementalPageFetcher {
    return new Rule34IncrementalPageFetcher({ pageSize: FAVORITES_PER_PAGE, fetchDelay: FETCH_DELAY }, {
      onPostsFound: onFavoritesFound,
      fetch: (pageIndex): Promise<Post[]> => retry(() => this.fetch(pageIndex), this.retryPolicy),
      scheduler: this.dependencies.scheduler
    });
  }

  private fetch(pageIndex: number): Promise<Post[]> {
    return this.dependencies.rule34.fetchFavoritesPage(this.pageId, pageIndex);
  }
}

export function computeRetryDelay(retryCount: number, fetchDelay: number): number {
  return (RETRY_BACKOFF_BASE ** retryCount) + fetchDelay;
}
