import { RetryPolicy, retry } from "@/core/utils/async/retry";
import { FAVORITES_PER_PAGE } from "@/adapters/rule34/client/favorites_page";
import { Post } from "@/core/domain/post/post";
import { RandomSource } from "@/core/boundary/ports/random_source/random_source";
import { RemoteFavorites } from "@/core/boundary/ports/remote_favorites/remote_favorites";
import { Rule34AllFavoritesFetcher } from "@/adapters/rule34/ports/remote_favorites/all_favorites_fetcher";
import { Rule34Client } from "@/adapters/rule34/client/client";
import { Rule34NewFavoritesFinder } from "@/adapters/rule34/ports/remote_favorites/new_favorites_finder";
import { Rule34RemovedFavoritesFinder } from "@/adapters/rule34/ports/remote_favorites/removed_favorites_finder";
import { Scheduler } from "@/core/boundary/ports/scheduler/scheduler";
import { isTransient } from "@/adapters/rule34/client/error";

export interface Rule34RemoteFavoritesDependencies {
  rule34: Pick<Rule34Client,
    "readFavoritesPageId" | "readFirstFavoritesPage" | "fetchFavoritesPage" | "fetchFavoriteCount" |
    "prioritizeFavorites">;
  scheduler: Scheduler;
  randomSource: RandomSource;
}

const FETCH_DELAY = 1_000;
const MINIMUM_LOCAL_RUN_LENGTH = 25;
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

  public fetchAll(onFavoritesFound: (posts: Post[]) => void): Promise<void> {
    return this.dependencies.rule34.prioritizeFavorites(() => this.createAllFavoritesFetcher(onFavoritesFound).fetchAll(this.takeFirstPageFavorites()));
  }

  public findNew(localIds: readonly string[]): Promise<Post[]> {
    return this.dependencies.rule34.prioritizeFavorites(() => this.createNewFavoritesFinder().findNew(localIds, this.takeFirstPageFavorites()));
  }

  public findRemoved(localIds: readonly string[], remoteStart: number): Promise<string[]> {
    return this.dependencies.rule34.prioritizeFavorites(() => this.createRemovedFavoritesFinder().findRemoved(localIds, remoteStart));
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

  private createNewFavoritesFinder(): Rule34NewFavoritesFinder {
    return new Rule34NewFavoritesFinder({ pageSize: FAVORITES_PER_PAGE, minimumLocalRunLength: MINIMUM_LOCAL_RUN_LENGTH, fetchDelay: FETCH_DELAY }, {
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
