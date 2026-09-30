import { CategorizedPost, Post } from "@/core/domain/post/post";
import { ApiClient } from "@/adapters/api/client/client";
import { Media } from "@/core/domain/media/media";
import { PostFetchError } from "@/types/errors";
import { RemotePosts } from "@/core/boundary/ports/remote_posts";
import { ServerPost } from "@/adapters/api/client/post/post";
import { parsePost } from "@/adapters/api/client/post/parser";
import { withExponentialBackoff } from "@/lib/async/scheduling";

const MAX_FETCH_ATTEMPTS = 5;

export class ApiRemotePosts implements RemotePosts {
  constructor(
    private readonly api: Pick<ApiClient, "fetchPost">,
    private readonly deletedPosts: RemotePosts,
    private readonly mintMedia: (fileUrl: string) => Media | null,
    private readonly maxFetchAttempts: number = MAX_FETCH_ATTEMPTS
  ) { }

  public async fetch(post: Pick<Post, "id" | "deleted">): Promise<CategorizedPost> {
    if (post.deleted === true) {
      return this.fetchDeleted(post);
    }
    const postFromApi = await withExponentialBackoff(() => this.fetchFromApi(post.id), this.maxFetchAttempts);
    return postFromApi ?? this.fetchDeleted(post);
  }

  private fetchDeleted(post: Pick<Post, "id">): Promise<CategorizedPost> {
    return this.deletedPosts.fetch(post);
  }

  private async fetchFromApi(id: string): Promise<CategorizedPost | null> {
    const response = await this.api.fetchPost(id);

    switch (response.status) {
      case "ok":
        return this.parse(response.post);
      case "deferred":
        return this.fetchFromApi(id);
      case "deleted":
        return null;
      default:
        throw new PostFetchError(response.status);
    }
  }

  private parse(post: ServerPost): CategorizedPost {
    const media = this.mintMedia(post.fileURL);

    if (media === null) {
      throw new PostFetchError(`unknown file: ${post.fileURL}`);
    }
    return parsePost(post, media);
  }
}
