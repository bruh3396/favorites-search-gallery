import { Post } from "@/core/domain/post/post";
import { Scheduler } from "@/core/boundary/ports/scheduler";

export interface Rule34IncrementalPageFetcherConfiguration {
  pageSize: number;
  fetchDelay: number;
}

export interface Rule34IncrementalPageFetcherDependencies {
  onPostsFound: (posts: Post[]) => void;
  fetch: (pageIndex: number) => Promise<Post[]>;
  scheduler: Pick<Scheduler, "sleep">;
}

export class Rule34IncrementalPageFetcher {
  constructor(
    private readonly configuration: Rule34IncrementalPageFetcherConfiguration,
    private readonly dependencies: Rule34IncrementalPageFetcherDependencies
  ) { }

  public async fetchMissing(seen: ReadonlySet<string>, firstPage?: Post[]): Promise<void> {
    let pageIndex = 0;
    let unseen = this.deliverUnseen(seen, firstPage ?? await this.dependencies.fetch(pageIndex));

    while (unseen.length >= this.configuration.pageSize) {
      pageIndex += 1;
      await this.dependencies.scheduler.sleep(this.configuration.fetchDelay);
      unseen = this.deliverUnseen(seen, await this.dependencies.fetch(pageIndex));
    }
  }

  private deliverUnseen(seen: ReadonlySet<string>, posts: Post[]): Post[] {
    const unseen = posts.filter(post => !seen.has(post.id));

    if (unseen.length > 0) {
      this.dependencies.onPostsFound(unseen);
    }
    return unseen;
  }
}
