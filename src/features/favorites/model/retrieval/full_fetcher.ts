import { Post } from "@/types/api";
import { SortedArray } from "@/lib/collection/sorted_array";
import { sleep } from "@/lib/async/scheduling";

const PENDING_POLL_INTERVAL = 200;

interface PendingPage {
  readonly index: number;
  readonly retryCount: number;
}

interface FetchedPage {
  readonly index: number;
  readonly posts: Post[];
}

export class FavoritesFullFetcher {
  private readonly inFlight = new Set<number>();
  private readonly failed: PendingPage[] = [];
  private readonly pendingDelivery = new SortedArray<FetchedPage>((a, b) => a.index - b.index);
  private nextPageIndex = 0;
  private lastDeliveredPageIndex = -1;
  private allPagesWereFetched = false;

  constructor(
    private readonly onFavoritesFound: (posts: Post[]) => void,
    private readonly fetch: (pageIndex: number) => Promise<Post[]>,
    private readonly delayForRetry: (retryCount: number) => number,
    private firstPageFavorites?: Post[]
  ) { }

  public async fetchAll(): Promise<void> {
    this.deliverFirstPage();

    while (!this.allPagesWereFetched || this.inFlight.size > 0 || this.failed.length > 0) {
      const request = this.takeNextRequest();

      if (request === undefined) {
        await sleep(PENDING_POLL_INTERVAL);
        continue;
      }
      this.fetchThenDeliver(request);
      await sleep(this.delayForRetry(request.retryCount));
    }
  }

  private deliverFirstPage(): void {
    if (this.firstPageFavorites === undefined) {
      return;
    }
    this.nextPageIndex = 1;
    this.lastDeliveredPageIndex = 0;
    this.onFavoritesFound(this.firstPageFavorites);
    this.firstPageFavorites = undefined;
  }

  private takeNextRequest(): PendingPage | undefined {
    if (this.failed.length > 0) {
      return this.failed.shift();
    }

    if (!this.allPagesWereFetched) {
      const request: PendingPage = { index: this.nextPageIndex, retryCount: 0 };

      this.nextPageIndex += 1;
      this.inFlight.add(request.index);
      return request;
    }
    return undefined;
  }

  private async fetchThenDeliver(request: PendingPage): Promise<void> {
    try {
      const posts = await this.fetch(request.index);

      if (posts.length === 0) {
        this.allPagesWereFetched = true;
      } else {
        this.pendingDelivery.add({ index: request.index, posts });
        this.deliverInOrder();
      }
    } catch {
      this.failed.push({ index: request.index, retryCount: request.retryCount + 1 });
    } finally {
      this.inFlight.delete(request.index);
    }
  }

  private deliverInOrder(): void {
    while (this.pendingDelivery.first()?.index === this.lastDeliveredPageIndex + 1) {
      const page = this.pendingDelivery.shift()!;

      this.lastDeliveredPageIndex = page.index;
      this.onFavoritesFound(page.posts);
    }
  }
}
