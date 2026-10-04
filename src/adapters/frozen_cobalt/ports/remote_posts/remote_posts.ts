import { CategorizedPost, Post } from "@/core/domain/post/post";
import { FrozenCobaltError, isTransient } from "@/adapters/frozen_cobalt/client/error";
import { FrozenCobaltMintMedia, decodePost } from "@/adapters/frozen_cobalt/client/decoder";
import { PostUnavailableError, RemotePosts } from "@/core/boundary/ports/remote_posts/remote_posts";
import { RetryPolicy, retry } from "@/core/utils/async/retry";
import { FrozenCobaltClient } from "@/adapters/frozen_cobalt/client/client";
import { RandomSource } from "@/core/boundary/ports/random_source/random_source";
import { Scheduler } from "@/core/boundary/ports/scheduler/scheduler";
import { assertNever } from "@/core/utils/guards/guards";

export interface FrozenCobaltRemotePostsDependencies {
  frozenCobalt: Pick<FrozenCobaltClient, "fetchPost">;
  mintMedia: FrozenCobaltMintMedia;
  scheduler: Scheduler;
  randomSource: RandomSource;
}

const MAX_FETCH_ATTEMPTS = 5;
const RETRY_BASE_DELAY = 1_000;

export class FrozenCobaltRemotePosts implements RemotePosts {
  private readonly retryPolicy: RetryPolicy;

  constructor(private readonly dependencies: FrozenCobaltRemotePostsDependencies) {
    this.retryPolicy = {
      attempts: MAX_FETCH_ATTEMPTS,
      baseDelay: RETRY_BASE_DELAY,
      scheduler: dependencies.scheduler,
      randomSource: dependencies.randomSource,
      isRetryable: isTransient
    };
  }

  public fetch(post: Pick<Post, "id" | "deleted">): Promise<CategorizedPost> {
    if (post.deleted === true) {
      return Promise.reject(new PostUnavailableError(post.id));
    }
    return retry(() => this.fetchOnce(post.id), this.retryPolicy);
  }

  private async fetchOnce(id: string): Promise<CategorizedPost> {
    const result = await this.dependencies.frozenCobalt.fetchPost(id);

    switch (result.status) {
      case "ok":
        return decodePost(result.post, this.dependencies.mintMedia);
      case "deleted":
        throw new PostUnavailableError(id);
      case "deferred":
        throw new FrozenCobaltError("deferred", { subject: id });
      case "rate_limited":
        throw new FrozenCobaltError("rate_limited", { subject: id });
      case "error":
        throw new FrozenCobaltError("server_error", { subject: id });
      default:
        return assertNever(result);
    }
  }
}
