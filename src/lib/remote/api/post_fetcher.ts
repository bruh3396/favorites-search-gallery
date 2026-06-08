import { Post, PostResponse } from "@/types/api";
import { generalPageRequestQueue, postLimiter } from "@/lib/remote/http/rate_limiters";
import { ApiConfig } from "@/config/api_config";
import { CoalescingResolver } from "@/lib/async/coalescing_resolver";
import { DeletedPostError } from "@/types/errors";
import { POST_API_URL } from "@/lib/remote/url/api_urls";
import { buildPostPageUrl } from "@/lib/remote/url/page_url_builder";
import { fetchApiJson } from "@/lib/remote/api/gateway";
import { fetchHtml } from "@/lib/remote/http/http_client";
import { parsePostFromPostPage } from "@/lib/remote/parsers/post_page_parser";
import { parsePostResponse } from "@/lib/remote/parsers/api_post_parser";
import { withExponentialBackoff } from "@/lib/async/timing";

const postFetcher = new CoalescingResolver<PostResponse>(
  ApiConfig.apiBatchSize,
  ApiConfig.apiBatchFlushDelay,
  fetchPostBatch
);

let postPageFetchBarrier: Promise<void> = Promise.resolve();

export function fetchPost(id: string): Promise<Post> {
  return postFetcher.resolve(id)
  .then(parsePostResponse)
  .catch((error: unknown) => recoverFromFetchError(id, error));
}

export async function fetchPostPageHtml(id: string): Promise<string> {
  await postPageFetchBarrier;
  await generalPageRequestQueue.wait();
  return withExponentialBackoff(() => fetchHtml(buildPostPageUrl(id)), 3, 1_000);
}

export function deferPostPageFetchesUntil(barrier: Promise<void>): void {
  postPageFetchBarrier = barrier;
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

function fetchPostBatch(ids: string[]): Promise<Record<string, PostResponse>> {
  return postLimiter.run(() => fetchApiJson(POST_API_URL, { ids }));
}
