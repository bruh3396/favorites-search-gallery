import * as FavoritesAPI from "../../../../lib/server/fetch/favorites_fetcher";
import { FavoritesPageRequest } from "./favorites_page_request";
import { sleep } from "../../../../lib/core/scheduling/promise";

export class FavoritesConcurrentPageFetcher {
  private static readonly PENDING_POLL_INTERVAL = 200;
  private readonly inFlight = new Set<number>();
  private readonly failed: FavoritesPageRequest[] = [];
  private readonly pendingDelivery: FavoritesPageRequest[] = [];
  private nextPage = 0;
  private lastDeliveredPage = -1;
  private allPagesFetched = false;

  constructor(private readonly onFavoritesFound: (elements: HTMLElement[]) => void) { }

  public async fetchAllFavorites(): Promise<void> {
    while (!this.allPagesFetched || this.inFlight.size > 0 || this.failed.length > 0) {
      const request = this.takeNextRequest();

      if (request === undefined) {
        await sleep(FavoritesConcurrentPageFetcher.PENDING_POLL_INTERVAL);
        continue;
      }
      this.fetchPage(request);
      await sleep(request.fetchDelay);
    }
  }

  private takeNextRequest(): FavoritesPageRequest | undefined {
    if (this.failed.length > 0) {
      return this.failed.shift();
    }

    if (!this.allPagesFetched) {
      const request = new FavoritesPageRequest(this.nextPage);

      this.nextPage += 1;
      this.inFlight.add(request.pageNumber);
      return request;
    }
    return undefined;
  }

  private async fetchPage(request: FavoritesPageRequest): Promise<void> {
    try {
      request.complete(await FavoritesAPI.fetchFavoritesPage(request.realPageNumber));
      this.inFlight.delete(request.pageNumber);

      if (request.elements.length === 0) {
        this.allPagesFetched = true;
      } else {
        this.pendingDelivery.push(request);
        this.pendingDelivery.sort((a, b) => a.pageNumber - b.pageNumber);
        this.deliverInOrder();
      }
    } catch {
      request.retry();
      this.inFlight.delete(request.pageNumber);
      this.failed.push(request);
    }
  }

  private deliverInOrder(): void {
    while (this.pendingDelivery.length > 0 && this.pendingDelivery[0].pageNumber === this.lastDeliveredPage + 1) {
      const request = this.pendingDelivery.shift()!;

      this.lastDeliveredPage = request.pageNumber;
      this.onFavoritesFound(request.elements);
    }
  }
}
