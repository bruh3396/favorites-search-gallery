import { Post } from "@/core/domain/post/post";
import { Scheduler } from "@/core/boundary/ports/scheduler/scheduler";
import { SortedArray } from "@/core/utils/collection/sorted_array";

const PENDING_POLL_INTERVAL = 200;

interface PendingPage {
  readonly index: number;
  readonly retryCount: number;
}

interface FetchedPage {
  readonly index: number;
  readonly posts: Post[];
}

export interface Rule34AllFavoritesFetcherConfiguration {
  readonly fetchDelay: number;
}

export interface Rule34AllFavoritesFetcherDependencies {
  onPostsFound: (posts: Post[]) => void;
  fetch: (pageIndex: number) => Promise<Post[]>;
  shouldRetry: (error: unknown, failureCount: number) => boolean;
  computeRetryDelay: (retryCount: number) => number;
  scheduler: Pick<Scheduler, "sleep">;
}

export class Rule34AllFavoritesFetcher {
  private readonly inFlight = new Set<number>();
  private readonly failedPendingPages: PendingPage[] = [];
  private readonly pendingDelivery = new SortedArray<FetchedPage>((a, b) => a.index - b.index);
  private nextPageIndex = 0;
  private lastDeliveredPageIndex = -1;
  private allPagesWereFetched = false;
  private failure: { error: unknown } | null = null;

  constructor(
    private readonly configuration: Rule34AllFavoritesFetcherConfiguration,
    private readonly dependencies: Rule34AllFavoritesFetcherDependencies
  ) { }

  public async fetchAll(firstPagePosts?: Post[]): Promise<void> {
    this.deliverFirstPage(firstPagePosts);

    while (this.failure === null && this.hasWorkLeft()) {
      const pendingPage = this.takeNextRequest();

      if (pendingPage === undefined) {
        await this.dependencies.scheduler.sleep(PENDING_POLL_INTERVAL);
        continue;
      }
      if (pendingPage.retryCount > 0) {
        await this.dependencies.scheduler.sleep(this.dependencies.computeRetryDelay(pendingPage.retryCount));
      }
      this.inFlight.add(pendingPage.index);
      this.fetchThenDeliver(pendingPage);
      await this.dependencies.scheduler.sleep(this.configuration.fetchDelay);
    }
    await this.waitForInFlight();

    if (this.failure !== null) {
      throw this.failure.error;
    }
  }

  private hasWorkLeft(): boolean {
    return !this.allPagesWereFetched || this.inFlight.size > 0 || this.failedPendingPages.length > 0;
  }

  private async waitForInFlight(): Promise<void> {
    while (this.inFlight.size > 0) {
      await this.dependencies.scheduler.sleep(PENDING_POLL_INTERVAL);
    }
  }

  private deliverFirstPage(firstPagePosts: Post[] | undefined): void {
    if (firstPagePosts === undefined) {
      return;
    }
    this.nextPageIndex = 1;
    this.lastDeliveredPageIndex = 0;
    this.dependencies.onPostsFound(firstPagePosts);
  }

  private takeNextRequest(): PendingPage | undefined {
    if (this.failedPendingPages.length > 0) {
      return this.failedPendingPages.shift();
    }

    if (!this.allPagesWereFetched) {
      const pendingPage: PendingPage = { index: this.nextPageIndex, retryCount: 0 };

      this.nextPageIndex += 1;
      return pendingPage;
    }
    return undefined;
  }

  private async fetchThenDeliver(pendingPage: PendingPage): Promise<void> {
    try {
      const posts = await this.dependencies.fetch(pendingPage.index);

      if (posts.length === 0) {
        this.allPagesWereFetched = true;
      } else {
        this.pendingDelivery.add({ index: pendingPage.index, posts });
        this.deliverInOrder();
      }
    } catch (error) {
      this.handleFailure(pendingPage, error);
    } finally {
      this.inFlight.delete(pendingPage.index);
    }
  }

  private handleFailure(pendingPage: PendingPage, error: unknown): void {
    const failureCount = pendingPage.retryCount + 1;

    if (this.dependencies.shouldRetry(error, failureCount)) {
      this.failedPendingPages.push({ index: pendingPage.index, retryCount: failureCount });
    } else {
      this.failure ??= { error };
    }
  }

  private deliverInOrder(): void {
    while (this.pendingDelivery.first()?.index === this.lastDeliveredPageIndex + 1) {
      const fetchedPage = this.pendingDelivery.shift()!;

      this.lastDeliveredPageIndex = fetchedPage.index;
      this.dependencies.onPostsFound(fetchedPage.posts);
    }
  }
}
