import { ParsedPost, PostSource } from "@/core/boundary/ports";
import { allMediaExtensions, extensionRegex } from "@/lib/media/constants";
import { ApiClient } from "@/adapters/api/client/client";
import { MediaExtension } from "@/core/domain/media/extension";
import { Post } from "@/core/domain/post/post";
import { PostFetchError } from "@/types/errors";
import { parsePost } from "@/adapters/api/client/post/parser";
import { withExponentialBackoff } from "@/lib/async/scheduling";

const FETCH_ATTEMPTS = 5;

export class ApiPostSource implements PostSource {
  constructor(
    private readonly api: Pick<ApiClient, "fetchPost">,
    private readonly deletedPosts: PostSource,
    private readonly fetchAttempts: number = FETCH_ATTEMPTS
  ) { }

  public async fetch(id: string): Promise<ParsedPost> {
    const fetched = await withExponentialBackoff(() => this.fetchOne(id), this.fetchAttempts);
    return { post: withExtension(fetched.post), tagCategories: fetched.tagCategories };
  }

  private async fetchOne(id: string): Promise<ParsedPost> {
    const response = await this.api.fetchPost(id);

    switch (response.status) {
      case "ok":
        return parsePost(response.post);
      case "deferred":
        return this.fetchOne(id);
      case "deleted":
        return this.deletedPosts.fetch(id);
      default:
        throw new PostFetchError(response.status);
    }
  }
}

function withExtension(post: Post): Post {
  const extension = extractExtension(post.fileURL);
  return extension === null ? post : { ...post, extension };
}

function extractExtension(fileURL: string): MediaExtension | null {
  const match = extensionRegex.exec(fileURL)?.[1];
  return match !== undefined && allMediaExtensions.includes(match as MediaExtension) ? match as MediaExtension : null;
}
