import { CategorizedPost, Post } from "@/core/domain/post/post";
import { PostUnavailableError, RemotePosts } from "@/core/boundary/ports/remote_posts/remote_posts";

export interface FallbackRemotePostsDependencies {
  primary: RemotePosts;
  fallback: RemotePosts;
}

export class FallbackRemotePosts implements RemotePosts {
  constructor(private readonly dependencies: FallbackRemotePostsDependencies) { }

  public fetch(post: Pick<Post, "id" | "deleted">): Promise<CategorizedPost> {
    return this.dependencies.primary.fetch(post).catch((error: unknown) => {
      if (!(error instanceof PostUnavailableError)) {
        throw error;
      }
      return this.dependencies.fallback.fetch(post);
    });
  }
}
