import { FavoritesPageRequest } from "@/features/favorites/types/favorites_page_request";
import { SortedArray } from "@/lib/collection/sorted_array";
import { extractFavoriteElements } from "@/lib/remote/parsers/favorites_page";
import { fetchFavoritesPage } from "@/lib/remote/rule34/favorites/page";
import { sleep } from "@/lib/async/timing";

export class FavoritesConcurrentPageFetcher {
  private static readonly PENDING_POLL_INTERVAL = 200;
  private readonly inFlight = new Set<number>();
  private readonly failed: FavoritesPageRequest[] = [];
  private readonly pendingDelivery = new SortedArray<FavoritesPageRequest>((a, b) => a.pageNumber - b.pageNumber);
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
      const elements = await fetchFavoritesPage(request.realPageNumber);

      request.complete(extractFavoriteElements(elements));

      if (request.elements.length === 0) {
        this.allPagesFetched = true;
      } else {
        this.pendingDelivery.insert(request);
        this.deliverInOrder();
      }
    } catch {
      request.retry();
      this.failed.push(request);
    } finally {
      this.inFlight.delete(request.pageNumber);
    }
  }

  private deliverInOrder(): void {
    while (this.pendingDelivery.first()?.pageNumber === this.lastDeliveredPage + 1) {
      const request = this.pendingDelivery.shift()!;

      this.lastDeliveredPage = request.pageNumber;
      this.onFavoritesFound(request.elements);
    }
  }
}
