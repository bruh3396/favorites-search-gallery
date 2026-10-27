import { CategorizedPost } from "@/core/domain/post/categorized_post";
import { Post } from "@/core/domain/post/post";
import { PostUnavailableError } from "@/core/boundary/ports/remote_posts/post_unavailable_error";
import { RemotePosts } from "@/core/boundary/ports/remote_posts/remote_posts";

export interface FallbackRemotePostsDependencies {
  primary: RemotePosts;
  fallback: RemotePosts;
}

export class FallbackRemotePosts implements RemotePosts {
  constructor(private readonly dependencies: FallbackRemotePostsDependencies) { }

  public fetch(post: Readonly<Pick<Post, "id" | "status">>): Promise<CategorizedPost> {
    return this.dependencies.primary.fetch(post).catch((error: unknown) => {
      if (!(error instanceof PostUnavailableError)) {
        throw error;
      }
      return this.dependencies.fallback.fetch(post);
    });
  }
}
