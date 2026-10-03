import { CategorizedPost, Post } from "@/core/domain/post/post";
import { RetryPolicy, retry } from "@/core/utils/async/retry";
import { Random } from "@/core/boundary/ports/random";
import { RemotePosts } from "@/core/boundary/ports/remote_posts";
import { Rule34SiteClient } from "@/adapters/rule34/client/site/client";
import { Scheduler } from "@/core/boundary/ports/scheduler";
import { isTransient } from "@/adapters/rule34/client/error";

export interface Rule34RemotePostsDependencies {
  rule34: Pick<Rule34SiteClient, "fetchPostPage">;
  scheduler: Scheduler;
  random: Random;
}

const MAX_FETCH_ATTEMPTS = 3;
const RETRY_BASE_DELAY = 1_000;

export class Rule34RemotePosts implements RemotePosts {
  private readonly retryPolicy: RetryPolicy;

  constructor(private readonly dependencies: Rule34RemotePostsDependencies) {
    this.retryPolicy = {
      attempts: MAX_FETCH_ATTEMPTS,
      baseDelay: RETRY_BASE_DELAY,
      scheduler: dependencies.scheduler,
      random: dependencies.random,
      isRetryable: isTransient
    };
  }

  public fetch(post: Pick<Post, "id">): Promise<CategorizedPost> {
    return retry(() => this.dependencies.rule34.fetchPostPage(post.id), this.retryPolicy);
  }
}
