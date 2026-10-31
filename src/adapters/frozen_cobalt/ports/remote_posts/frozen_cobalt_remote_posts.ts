import { CategorizedPost } from "@/core/domain/post/categorized_post";
import { Post } from "@/core/domain/post/post";
import { FrozenCobaltError, isRetryableFrozenCobaltError } from "@/adapters/frozen_cobalt/client/frozen_cobalt_error";
import { FrozenCobaltMediaMinter } from "@/adapters/frozen_cobalt/client/frozen_cobalt_media_minter";
import { decodeFrozenCobaltPost } from "@/adapters/frozen_cobalt/client/frozen_cobalt_decoder";
import { PostUnavailableError } from "@/core/boundary/ports/remote_posts/post_unavailable_error";
import { RemotePosts } from "@/core/boundary/ports/remote_posts/remote_posts";
import { FrozenCobaltClient } from "@/adapters/frozen_cobalt/client/frozen_cobalt_client";
import { RandomSource } from "@/core/boundary/ports/random_source/random_source";
import { Retry } from "@/core/utils/async/retry";
import { Scheduler } from "@/core/boundary/ports/scheduler/scheduler";
import { UnreachableError } from "@/core/utils/error/unreachable_error";

export interface FrozenCobaltRemotePostsDependencies {
  frozenCobaltClient: Pick<FrozenCobaltClient, "fetchPost">;
  mintMedia: FrozenCobaltMediaMinter;
  scheduler: Scheduler;
  randomSource: RandomSource;
}

const MAX_FETCH_ATTEMPTS = 5;
const RETRY_BASE_DELAY = 1_000;

export class FrozenCobaltRemotePosts implements RemotePosts {
  private readonly retry: Retry;

  constructor(private readonly dependencies: FrozenCobaltRemotePostsDependencies) {
    this.retry = new Retry({ attempts: MAX_FETCH_ATTEMPTS, baseDelay: RETRY_BASE_DELAY }, {
      scheduler: dependencies.scheduler,
      randomSource: dependencies.randomSource,
      isRetryable: isRetryableFrozenCobaltError
    });
  }

  public fetch(post: Pick<Post, "id" | "status">): Promise<CategorizedPost> {
    if (post.status !== "active") {
      return Promise.reject(new PostUnavailableError(post.id));
    }
    return this.retry.retry(() => this.fetchOnce(post.id));
  }

  private async fetchOnce(postId: string): Promise<CategorizedPost> {
    const result = await this.dependencies.frozenCobaltClient.fetchPost(postId);

    switch (result.status) {
      case "ok":
        return decodeFrozenCobaltPost(result.post, this.dependencies.mintMedia);
      case "deleted":
        throw new PostUnavailableError(postId);
      case "retry":
        throw new FrozenCobaltError("retry", { subject: postId });
      default:
        throw new UnreachableError(result);
    }
  }
}
