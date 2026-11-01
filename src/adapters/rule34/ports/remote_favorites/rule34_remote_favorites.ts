import { RemoteFavorites } from "@/core/boundary/ports/remote_favorites/remote_favorites";
import { RULE34_FAVORITES_PER_PAGE } from "@/adapters/rule34/client/rule34_url_builder";
import { Post } from "@/core/domain/post/post";
import { RandomSource } from "@/core/boundary/ports/random_source/random_source";
import { Retry } from "@/core/utils/async/retry";
import { Rule34AllFavoritesFetcher } from "@/adapters/rule34/ports/remote_favorites/rule34_all_favorites_fetcher";
import { Rule34Client } from "@/adapters/rule34/client/rule34_client";
import { Rule34Document } from "@/adapters/rule34/document/rule34_document";
import { Rule34FavoriteActions } from "@/adapters/rule34/ports/remote_favorites/rule34_favorite_actions";
import { Rule34Fetch } from "@/adapters/rule34/client/rule34_fetch";
import { Rule34NewFavoritesFinder } from "@/adapters/rule34/ports/remote_favorites/rule34_new_favorites_finder";
import { Rule34MissingFavoritesFinder } from "@/adapters/rule34/ports/remote_favorites/rule34_missing_favorites_finder";
import { Scheduler } from "@/core/boundary/ports/scheduler/scheduler";
import { isRetryableRule34Error } from "@/adapters/rule34/client/rule34_error";

export interface Rule34RemoteFavoritesDependencies {
  rule34Client: Pick<Rule34Client, "readFirstFavoritesPage" | "fetchFavoritesPage" | "fetchFavoriteCount" | "prioritizeFavorites">;
  rule34Document: Pick<Rule34Document, "readFavoritesOwnerId">;
  fetch: Rule34Fetch;
  scheduler: Scheduler;
  randomSource: RandomSource;
}

const FETCH_DELAY = 1_000;
const MINIMUM_LOCAL_RUN_LENGTH = 25;
const MAX_FETCH_ATTEMPTS = 20;
const RETRY_BASE_DELAY = 1_500;
const RETRY_MAX_DELAY = 60_000;

export class Rule34RemoteFavorites implements RemoteFavorites {
  private readonly favoritesOwnerId: string;
  private firstPagePosts: Post[] | null;
  private readonly retry: Retry;
  private readonly favoriteActions: Rule34FavoriteActions;

  constructor(private readonly dependencies: Rule34RemoteFavoritesDependencies) {
    this.favoritesOwnerId = dependencies.rule34Document.readFavoritesOwnerId();
    this.firstPagePosts = dependencies.rule34Client.readFirstFavoritesPage();
    this.retry = new Retry({ attempts: MAX_FETCH_ATTEMPTS, baseDelay: RETRY_BASE_DELAY, maxDelay: RETRY_MAX_DELAY }, {
      scheduler: dependencies.scheduler,
      randomSource: dependencies.randomSource,
      isRetryable: isRetryableRule34Error
    });
    this.favoriteActions = new Rule34FavoriteActions(dependencies);
  }

  public fetchCount(): Promise<number | null> {
    return this.retry.retry(() => this.dependencies.rule34Client.fetchFavoriteCount(this.favoritesOwnerId))
      .catch(() => null);
  }

  public fetchAll(onFavoritesFound: (posts: Post[]) => void): Promise<void> {
    return this.dependencies.rule34Client.prioritizeFavorites(() => this.createAllFavoritesFetcher(onFavoritesFound).fetchAll(this.takeFirstPageFavorites()));
  }

  public findNew(localPostIds: readonly string[]): Promise<Post[]> {
    return this.dependencies.rule34Client.prioritizeFavorites(() => this.createNewFavoritesFinder().findNew(localPostIds, this.takeFirstPageFavorites()));
  }

  public findMissing(localPostIds: readonly string[], remoteStart: number): Promise<string[]> {
    return this.dependencies.rule34Client.prioritizeFavorites(() => this.createMissingFavoritesFinder().findMissing(localPostIds, remoteStart));
  }

  public async add(postId: string): Promise<boolean> {
    const answer = await this.favoriteActions.add(postId);
    return answer === "added" || answer === "alreadyAdded";
  }

  public remove(postId: string): Promise<boolean> {
    return this.favoriteActions.remove(postId);
  }

  private takeFirstPageFavorites(): Post[] | undefined {
    const firstPagePosts = this.firstPagePosts ?? undefined;

    this.firstPagePosts = null;
    return firstPagePosts;
  }

  private createAllFavoritesFetcher(onFavoritesFound: (posts: Post[]) => void): Rule34AllFavoritesFetcher {
    return new Rule34AllFavoritesFetcher({ fetchDelay: FETCH_DELAY }, {
      onPostsFound: onFavoritesFound,
      fetch: (pageIndex): Promise<Post[]> => this.fetch(pageIndex),
      shouldRetry: (error, failureCount): boolean => failureCount < MAX_FETCH_ATTEMPTS && isRetryableRule34Error(error),
      computeRetryDelay: (retryCount): number => this.retry.computeDelay(retryCount),
      scheduler: this.dependencies.scheduler
    });
  }

  private createNewFavoritesFinder(): Rule34NewFavoritesFinder {
    return new Rule34NewFavoritesFinder({ pageSize: RULE34_FAVORITES_PER_PAGE, minimumLocalRunLength: MINIMUM_LOCAL_RUN_LENGTH, fetchDelay: FETCH_DELAY }, {
      fetch: (pageIndex): Promise<Post[]> => this.retry.retry(() => this.fetch(pageIndex)),
      scheduler: this.dependencies.scheduler
    });
  }

  private createMissingFavoritesFinder(): Rule34MissingFavoritesFinder {
    return new Rule34MissingFavoritesFinder({ pageSize: RULE34_FAVORITES_PER_PAGE, fetchDelay: FETCH_DELAY }, {
      fetch: (pageIndex): Promise<Post[]> => this.retry.retry(() => this.fetch(pageIndex)),
      scheduler: this.dependencies.scheduler
    });
  }

  private fetch(pageIndex: number): Promise<Post[]> {
    return this.dependencies.rule34Client.fetchFavoritesPage(this.favoritesOwnerId, pageIndex);
  }
}
