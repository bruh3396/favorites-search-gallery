import { ParsedPost, PostSource } from "@/core/boundary/ports";
import { allMediaExtensions, extensionRegex } from "@/lib/media/constants";
import { AbstractApiFetcher } from "@/adapters/api/client/abstract_api_fetcher";
import { ApiConfig } from "@/adapters/api/client/api_config";
import { MediaExtension } from "@/core/domain/media/extension";
import { Post } from "@/core/domain/post/post";
import { PostFetchError } from "@/types/errors";
import { PostResponse } from "@/adapters/api/client/responses";
import { parsePost } from "@/adapters/api/post_source/post_parser";
import { withExponentialBackoff } from "@/lib/async/scheduling";

export class ApiPostSource extends AbstractApiFetcher<PostResponse> implements PostSource {
  constructor(private readonly deletedPosts: PostSource) {
    super(ApiConfig.postRateLimit, "post", "ids");
  }

  public async fetch(id: string): Promise<ParsedPost> {
    const fetched = await withExponentialBackoff(() => this.fetchOne(id), ApiConfig.postRetries);
    return { post: withExtension(fetched.post), tagCategories: fetched.tagCategories };
  }

  private async fetchOne(id: string): Promise<ParsedPost> {
    const response = await this.schedule(id);

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
