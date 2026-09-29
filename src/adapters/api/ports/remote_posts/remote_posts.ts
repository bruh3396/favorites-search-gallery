import { ApiClient } from "@/adapters/api/client/client";
import { CategorizedPost } from "@/core/domain/post/post";
import { Media } from "@/core/domain/media/media";
import { PostFetchError } from "@/types/errors";
import { RemotePosts } from "@/core/boundary/ports/remote_posts";
import { ServerPost } from "@/adapters/api/client/post/post";
import { parsePost } from "@/adapters/api/client/post/parser";
import { withExponentialBackoff } from "@/lib/async/scheduling";

const FETCH_ATTEMPTS = 5;

export class ApiRemotePosts implements RemotePosts {
  constructor(
    private readonly api: Pick<ApiClient, "fetchPost">,
    private readonly deletedPosts: RemotePosts,
    private readonly mintMedia: (fileUrl: string) => Media | null,
    private readonly fetchAttempts: number = FETCH_ATTEMPTS
  ) { }

  public fetch(id: string): Promise<CategorizedPost> {
    return withExponentialBackoff(() => this.fetchOne(id), this.fetchAttempts);
  }

  private async fetchOne(id: string): Promise<CategorizedPost> {
    const response = await this.api.fetchPost(id);

    switch (response.status) {
      case "ok":
        return this.parse(response.post);
      case "deferred":
        return this.fetchOne(id);
      case "deleted":
        return this.deletedPosts.fetch(id);
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
