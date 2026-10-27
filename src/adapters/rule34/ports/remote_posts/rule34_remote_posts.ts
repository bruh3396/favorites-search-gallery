import { CategorizedPost } from "@/core/domain/post/categorized_post";
import { Post } from "@/core/domain/post/post";
import { PostPurgedError } from "@/core/boundary/ports/remote_posts/post_purged_error";
import { RandomSource } from "@/core/boundary/ports/random_source/random_source";
import { RemotePosts } from "@/core/boundary/ports/remote_posts/remote_posts";
import { Retry } from "@/core/utils/async/retry";
import { Rule34Client } from "@/adapters/rule34/client/rule34_client";
import { isRetryableRule34Error, isRule34PageMissing } from "@/adapters/rule34/client/rule34_error";
import { Scheduler } from "@/core/boundary/ports/scheduler/scheduler";

export interface Rule34RemotePostsDependencies {
  rule34Client: Pick<Rule34Client, "fetchPostPage">;
  scheduler: Scheduler;
  randomSource: RandomSource;
}

const MAX_FETCH_ATTEMPTS = 3;
const RETRY_BASE_DELAY = 1_000;

export class Rule34RemotePosts implements RemotePosts {
  private readonly retry: Retry;

  constructor(private readonly dependencies: Rule34RemotePostsDependencies) {
    this.retry = new Retry({ attempts: MAX_FETCH_ATTEMPTS, baseDelay: RETRY_BASE_DELAY }, {
      scheduler: dependencies.scheduler,
      randomSource: dependencies.randomSource,
      isRetryable: isRetryableRule34Error
    });
  }

  public fetch(post: Pick<Post, "id">): Promise<CategorizedPost> {
    return this.retry.retry(() => this.dependencies.rule34Client.fetchPostPage(post.id)).catch((error: unknown) => {
      throw isRule34PageMissing(error) ? new PostPurgedError(post.id) : error;
    });
  }
}
