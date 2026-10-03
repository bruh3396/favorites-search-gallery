import { Post } from "@/core/domain/post/post";
import { Scheduler } from "@/core/boundary/ports/scheduler";
import { SortedArray } from "@/lib/collection/sorted_array";

const PENDING_POLL_INTERVAL = 200;

interface PendingPage {
  readonly index: number;
  readonly retryCount: number;
}

interface FetchedPage {
  readonly index: number;
  readonly posts: Post[];
}

export interface Rule34FullPageFetcherDependencies {
  onPostsFound: (posts: Post[]) => void;
  fetch: (pageIndex: number) => Promise<Post[]>;
  delayForRetry: (retryCount: number) => number;
  scheduler: Pick<Scheduler, "sleep">;
}

export class Rule34FullPageFetcher {
  private readonly inFlight = new Set<number>();
  private readonly failed: PendingPage[] = [];
  private readonly pendingDelivery = new SortedArray<FetchedPage>((a, b) => a.index - b.index);
  private nextPageIndex = 0;
  private lastDeliveredPageIndex = -1;
  private allPagesWereFetched = false;

  constructor(private readonly dependencies: Rule34FullPageFetcherDependencies) { }

  public async fetchAll(firstPage?: Post[]): Promise<void> {
    this.deliverFirstPage(firstPage);

    while (!this.allPagesWereFetched || this.inFlight.size > 0 || this.failed.length > 0) {
      const request = this.takeNextRequest();

      if (request === undefined) {
        await this.dependencies.scheduler.sleep(PENDING_POLL_INTERVAL);
        continue;
      }
      this.fetchThenDeliver(request);
      await this.dependencies.scheduler.sleep(this.dependencies.delayForRetry(request.retryCount));
    }
  }

  private deliverFirstPage(firstPage: Post[] | undefined): void {
    if (firstPage === undefined) {
      return;
    }
    this.nextPageIndex = 1;
    this.lastDeliveredPageIndex = 0;
    this.dependencies.onPostsFound(firstPage);
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
      const posts = await this.dependencies.fetch(request.index);

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
      this.dependencies.onPostsFound(page.posts);
    }
  }
}
