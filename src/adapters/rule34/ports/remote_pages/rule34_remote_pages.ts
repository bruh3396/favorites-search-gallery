import { RandomSource } from "@/core/boundary/ports/random_source/random_source";
import { RemotePages } from "@/core/boundary/ports/remote_pages/remote_pages";
import { Retry } from "@/core/utils/async/retry";
import { Rule34Client } from "@/adapters/rule34/client/rule34_client";
import { isRetryableRule34Error, isMissingPageRule34Error } from "@/adapters/rule34/client/rule34_error";
import { Scheduler } from "@/core/boundary/ports/scheduler/scheduler";

export interface Rule34RemotePagesDependencies {
  rule34Client: Pick<Rule34Client, "postPageUrl" | "postListUrl" | "fetchPostPage">;
  scheduler: Scheduler;
  randomSource: RandomSource;
}

const MAX_FETCH_ATTEMPTS = 3;
const RETRY_BASE_DELAY = 1_000;

export class Rule34RemotePages implements RemotePages {
  private readonly retry: Retry;

  constructor(private readonly dependencies: Rule34RemotePagesDependencies) {
    this.retry = new Retry({ attempts: MAX_FETCH_ATTEMPTS, baseDelay: RETRY_BASE_DELAY }, {
      scheduler: dependencies.scheduler,
      randomSource: dependencies.randomSource,
      isRetryable: isRetryableRule34Error
    });
  }

  public postUrl(postId: string): string {
    return this.dependencies.rule34Client.postPageUrl(postId);
  }

  public searchUrl(query: string): string {
    return this.dependencies.rule34Client.postListUrl(query);
  }

  public postExists(postId: string): Promise<boolean> {
    return this.retry.retry(() => this.dependencies.rule34Client.fetchPostPage(postId)).then(
      () => true,
      (error: unknown) => {
        if (isMissingPageRule34Error(error)) {
          return false;
        }
        throw error;
      }
    );
  }
}
