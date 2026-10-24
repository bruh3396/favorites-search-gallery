import { RemoteSearchResults, SearchResultsPage } from "@/core/boundary/ports/remote_search_results/remote_search_results";
import { RandomSource } from "@/core/boundary/ports/random_source/random_source";
import { Retry } from "@/core/utils/async/retry";
import { Rule34Client } from "@/adapters/rule34/client/client";
import { Rule34Document } from "@/adapters/rule34/document/document";
import { Scheduler } from "@/core/boundary/ports/scheduler/scheduler";
import { isRetryable } from "@/adapters/rule34/client/error";

export interface Rule34RemoteSearchResultsDependencies {
  rule34: Pick<Rule34Client, "readPostListPage" | "fetchPostListPage">;
  rule34Document: Pick<Rule34Document, "readSearchQuery" | "readPostListPageIndex">;
  scheduler: Scheduler;
  randomSource: RandomSource;
}

const MAX_FETCH_ATTEMPTS = 3;
const RETRY_BASE_DELAY = 1_000;

export class Rule34RemoteSearchResults implements RemoteSearchResults {
  private readonly searchQuery: string;
  private readonly retry: Retry;
  private readonly initialPage: SearchResultsPage;

  constructor(private readonly dependencies: Rule34RemoteSearchResultsDependencies) {
    this.searchQuery = dependencies.rule34Document.readSearchQuery();
    const initialIndex = dependencies.rule34Document.readPostListPageIndex();

    this.initialPage = { index: initialIndex, posts: dependencies.rule34.readPostListPage(initialIndex) };
    this.retry = new Retry({ attempts: MAX_FETCH_ATTEMPTS, baseDelay: RETRY_BASE_DELAY }, {
      scheduler: dependencies.scheduler,
      randomSource: dependencies.randomSource,
      isRetryable
    });
  }

  public readInitialPage(): SearchResultsPage {
    return this.initialPage;
  }

  public fetchPage(index: number): Promise<SearchResultsPage> {
    if (index === this.initialPage.index) {
      return Promise.resolve(this.initialPage);
    }
    return this.retry.retry(() => this.dependencies.rule34.fetchPostListPage(this.searchQuery, index))
      .then(posts => ({ index, posts }));
  }
}
