import { RetryPolicy, retry } from "@/core/utils/async/retry";
import { POSTS_PER_POST_LIST_PAGE } from "@/adapters/rule34/client/post_list_page";
import { Post } from "@/core/domain/post/post";
import { RandomSource } from "@/core/boundary/ports/random_source";
import { RemoteSearchResults } from "@/core/boundary/ports/remote_search_results";
import { Rule34Client } from "@/adapters/rule34/client/client";
import { Scheduler } from "@/core/boundary/ports/scheduler";
import { isTransient } from "@/adapters/rule34/client/error";

export interface Rule34RemoteSearchResultsDependencies {
  rule34: Pick<Rule34Client, "readSearchQuery" | "readPostListPageIndex" | "readPostListPage" | "fetchPostListPage">;
  scheduler: Scheduler;
  randomSource: RandomSource;
}

const MAX_FETCH_ATTEMPTS = 3;
const RETRY_BASE_DELAY = 1_000;

export class Rule34RemoteSearchResults implements RemoteSearchResults {
  public readonly pageSize = POSTS_PER_POST_LIST_PAGE;
  public readonly initialPageIndex: number;
  private readonly searchQuery: string;
  private readonly retryPolicy: RetryPolicy;
  private initialPage: Post[] | null = null;

  constructor(private readonly dependencies: Rule34RemoteSearchResultsDependencies) {
    this.searchQuery = dependencies.rule34.readSearchQuery();
    this.initialPageIndex = dependencies.rule34.readPostListPageIndex();
    this.retryPolicy = {
      attempts: MAX_FETCH_ATTEMPTS,
      baseDelay: RETRY_BASE_DELAY,
      scheduler: dependencies.scheduler,
      randomSource: dependencies.randomSource,
      isRetryable: isTransient
    };
  }

  public fetchPage(pageIndex: number): Promise<Post[]> {
    if (pageIndex === this.initialPageIndex) {
      this.initialPage ??= this.dependencies.rule34.readPostListPage(pageIndex);
      return Promise.resolve(this.initialPage);
    }
    return retry(() => this.dependencies.rule34.fetchPostListPage(this.searchQuery, pageIndex), this.retryPolicy);
  }
}
