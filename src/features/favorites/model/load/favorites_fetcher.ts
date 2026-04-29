import * as FavoritesAPI from "../../../../lib/server/fetch/favorites_fetcher";
import { FavoriteItem } from "../../types/favorite_item";
import { FavoritesFetchQueue } from "./favorites_fetch_queue";
import { FavoritesPageRequest } from "./favorites_page_request";
import { populateFavoritesMetadata } from "../../types/favorite_metadata";
import { sleep } from "../../../../lib/core/scheduling/promise";

export class FavoritesFetcher {
  private static PENDING_POLL_INTERVAL = 200;
  private pendingRequests = new Set<number>();
  private failedRequests: FavoritesPageRequest[] = [];
  private currentPageNumber = 0;
  private finalPageWasFetched = false;
  private queue: FavoritesFetchQueue;

  constructor(onFavoritesFound: (favorites: FavoriteItem[]) => void) {
    this.queue = new FavoritesFetchQueue(onFavoritesFound);
  }

  private get hasFailedRequests(): boolean {
    return this.failedRequests.length > 0;
  }

  private get hasPendingRequests(): boolean {
    return this.pendingRequests.size > 0;
  }

  private get allRequestsHaveStarted(): boolean {
    return this.finalPageWasFetched;
  }

  private get someRequestsArePending(): boolean {
    return this.hasPendingRequests || this.hasFailedRequests;
  }

  private get noRequestsArePending(): boolean {
    return !this.someRequestsArePending;
  }

  private get allRequestsHaveCompleted(): boolean {
    return this.allRequestsHaveStarted && this.noRequestsArePending;
  }

  public async fetchAllFavorites(): Promise<void> {
    while (!this.allRequestsHaveCompleted) {
      await this.fetchNextFavoritesPage();
    }
  }

  private getNewFetchRequest(): FavoritesPageRequest {
    const request = new FavoritesPageRequest(this.currentPageNumber);

    this.pendingRequests.add(request.realPageNumber);
    this.currentPageNumber += 1;
    return request;
  }

  private nextFetchRequest(): FavoritesPageRequest | undefined {
    if (this.hasFailedRequests) {
      return this.failedRequests.shift();
    }

    if (!this.allRequestsHaveStarted) {
      return this.getNewFetchRequest();
    }
    return undefined;
  }

  private async fetchNextFavoritesPage(): Promise<void> {
    const request = this.nextFetchRequest();

    if (request === undefined) {
      await sleep(FavoritesFetcher.PENDING_POLL_INTERVAL);
      return;
    }

    await this.fetchFavoritesPage(request);
  }

  private fetchFavoritesPage(request: FavoritesPageRequest): Promise<void> {
    return sleep(request.fetchDelay).then(() => {
      FavoritesAPI.fetchFavoritesPage(request.realPageNumber)
        .then((html) => {
          this.onFavoritesPageRequestSuccess(request, html);
        })
        .catch((error) => {
          this.onFavoritesPageRequestError(request, error);
        });
    });
  }

  private handleFetchedPage(request: FavoritesPageRequest): void {
    const favoritesPageIsEmpty = request.favorites.length === 0;

    this.finalPageWasFetched ||= favoritesPageIsEmpty;

    if (!favoritesPageIsEmpty) {
      this.queue.enqueue(request);
    }
  }

  private onFavoritesPageRequestSuccess(request: FavoritesPageRequest, html: string): void {
    request.complete(html);
    populateFavoritesMetadata(request.favorites);
    this.pendingRequests.delete(request.realPageNumber);
    this.handleFetchedPage(request);
  }

  private onFavoritesPageRequestError(request: FavoritesPageRequest, error: Error): void {
    console.error(error);
    request.retry();
    this.failedRequests.push(request);
  }
}
