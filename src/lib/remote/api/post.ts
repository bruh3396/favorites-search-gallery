import { Post, PostResponse } from "@/types/api";
import { ApiConfig } from "@/config/api_config";
import { CoalescingResolver } from "@/lib/async/coalescing_resolver";
import { DeletedPostError } from "@/types/errors";
import { fetchApi } from "@/lib/remote/api/gateway";
import { fetchPostPageHtml } from "@/lib/remote/rule34/posts/page";
import { parsePostFromPostPage } from "@/lib/remote/parsers/post_page";
import { parsePostResponse } from "@/lib/remote/parsers/post";
import { postLimiter } from "@/lib/remote/http/rate_limiters";

const postFetcher = new CoalescingResolver<PostResponse>(
  ApiConfig.apiBatchSize,
  ApiConfig.apiBatchFlushDelay,
  fetchPosts
);

export function fetchPost(id: string): Promise<Post> {
  return postFetcher.resolve(id)
  .then(parsePostResponse)
  .catch((error: unknown) => recoverFromFetchError(id, error));
}

function fetchPosts(ids: string[]): Promise<Record<string, PostResponse>> {
  return postLimiter.run(() => fetchApi("post", { ids }).then(r => r.json() as Promise<Record<string, PostResponse>>));
}

function recoverFromFetchError(id: string, error: unknown): Promise<Post> {
  if (error instanceof DeletedPostError) {
    return fetchPostFromPostPage(id);
  }
  throw error;
}

function fetchPostFromPostPage(id: string): Promise<Post> {
  return fetchPostPageHtml(id).then(parsePostFromPostPage);
}
