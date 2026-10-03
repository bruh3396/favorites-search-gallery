import { AddFavoriteResult, RemoteFavorites, RemoveFavoriteResult } from "@/core/boundary/ports/remote_favorites";
import { RetryPolicy, retry } from "@/core/utils/async/retry";
import { FAVORITES_PER_PAGE } from "@/adapters/rule34/client/favorites_page";
import { Post } from "@/core/domain/post/post";
import { RandomSource } from "@/core/boundary/ports/random_source";
import { Rule34AllFavoritesFetcher } from "@/adapters/rule34/ports/remote_favorites/all_favorites_fetcher";
import { Rule34Client } from "@/adapters/rule34/client/client";
import { Rule34IncrementalPageFetcher } from "@/adapters/rule34/ports/remote_favorites/incremental_page_fetcher";
import { Rule34RemovedFavoritesFinder } from "@/adapters/rule34/ports/remote_favorites/removed_favorites_finder";
import { Scheduler } from "@/core/boundary/ports/scheduler";
import { isTransient } from "@/adapters/rule34/client/error";

export interface Rule34RemoteFavoritesDependencies {
  rule34: Pick<Rule34Client,
    "readFavoritesPageId" | "readFirstFavoritesPage" | "fetchFavoritesPage" | "fetchFavoriteCount" |
    "prioritizeFavorites" | "addFavorite" | "removeFavorite">;
  scheduler: Scheduler;
  randomSource: RandomSource;
}

const FETCH_DELAY = 3_000;
const MAX_FETCH_ATTEMPTS = 5;
const RETRY_BASE_DELAY = 1_500;
const RETRY_BACKOFF_BASE = 7;

export class Rule34RemoteFavorites implements RemoteFavorites {
  private readonly pageId: string;
  private firstPageFavorites: Post[] | null;
  private readonly retryPolicy: RetryPolicy;

  constructor(private readonly dependencies: Rule34RemoteFavoritesDependencies) {
    this.pageId = dependencies.rule34.readFavoritesPageId();
    this.firstPageFavorites = dependencies.rule34.readFirstFavoritesPage();
    this.retryPolicy = {
      attempts: MAX_FETCH_ATTEMPTS,
      baseDelay: RETRY_BASE_DELAY,
      scheduler: dependencies.scheduler,
      randomSource: dependencies.randomSource,
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

  public findRemoved(storedIds: readonly string[]): Promise<string[] | null> {
    return this.dependencies.rule34.prioritizeFavorites(() => this.createRemovedFavoritesFinder().findRemoved(storedIds, 0));
  }

  public async add(id: string): Promise<AddFavoriteResult> {
    return await this.dependencies.rule34.addFavorite(id) ?? "cancelled";
  }

  public async remove(id: string): Promise<RemoveFavoriteResult> {
    return await this.dependencies.rule34.removeFavorite(id) ? "removed" : "cancelled";
  }

  private fetchPages(knownIds: ReadonlySet<string>, onFavoritesFound: (posts: Post[]) => void): Promise<void> {
    const firstPage = this.takeFirstPageFavorites();

    if (knownIds.size === 0) {
      return this.createAllFavoritesFetcher(onFavoritesFound).fetchAll(firstPage);
    }
    return this.createIncrementalPageFetcher(onFavoritesFound).fetchMissing(knownIds, firstPage);
  }

  private takeFirstPageFavorites(): Post[] | undefined {
    const firstPage = this.firstPageFavorites ?? undefined;

    this.firstPageFavorites = null;
    return firstPage;
  }

  private createAllFavoritesFetcher(onFavoritesFound: (posts: Post[]) => void): Rule34AllFavoritesFetcher {
    return new Rule34AllFavoritesFetcher({
      onPostsFound: onFavoritesFound,
      fetch: (pageIndex): Promise<Post[]> => this.fetch(pageIndex),
      shouldRetry: (error, failureCount): boolean => failureCount < MAX_FETCH_ATTEMPTS && isTransient(error),
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

  private createRemovedFavoritesFinder(): Rule34RemovedFavoritesFinder {
    return new Rule34RemovedFavoritesFinder({ pageSize: FAVORITES_PER_PAGE, fetchDelay: FETCH_DELAY }, {
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
