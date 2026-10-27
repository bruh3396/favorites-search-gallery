import { RandomSource } from "@/core/boundary/ports/random_source/random_source";
import { RemotePostList } from "@/core/boundary/ports/remote_post_list/remote_post_list";
import { Retry } from "@/core/utils/async/retry";
import { Rule34Client } from "@/adapters/rule34/client/rule34_client";
import { Rule34Document } from "@/adapters/rule34/document/rule34_document";
import { Scheduler } from "@/core/boundary/ports/scheduler/scheduler";
import { PostListPage } from "@/core/domain/post_list/post_list_page";
import { isRetryableRule34Error } from "@/adapters/rule34/client/rule34_error";

export interface Rule34RemotePostListDependencies {
  rule34Client: Pick<Rule34Client, "readPostListPage" | "fetchPostListPage">;
  rule34Document: Pick<Rule34Document, "readSearchQuery" | "readPostListPageIndex">;
  scheduler: Scheduler;
  randomSource: RandomSource;
}

const MAX_FETCH_ATTEMPTS = 3;
const RETRY_BASE_DELAY = 1_000;

export class Rule34RemotePostList implements RemotePostList {
  private readonly searchQuery: string;
  private readonly retry: Retry;
  private readonly initialPage: PostListPage;

  constructor(private readonly dependencies: Rule34RemotePostListDependencies) {
    this.searchQuery = dependencies.rule34Document.readSearchQuery();
    const initialIndex = dependencies.rule34Document.readPostListPageIndex();

    this.initialPage = { index: initialIndex, posts: dependencies.rule34Client.readPostListPage(initialIndex) };
    this.retry = new Retry({ attempts: MAX_FETCH_ATTEMPTS, baseDelay: RETRY_BASE_DELAY }, {
      scheduler: dependencies.scheduler,
      randomSource: dependencies.randomSource,
      isRetryable: isRetryableRule34Error
    });
  }

  public readInitialPage(): PostListPage {
    return this.initialPage;
  }

  public fetchPage(index: number): Promise<PostListPage> {
    if (index === this.initialPage.index) {
      return Promise.resolve(this.initialPage);
    }
    return this.retry.retry(() => this.dependencies.rule34Client.fetchPostListPage(this.searchQuery, index))
      .then(posts => ({ index, posts }));
  }
}
