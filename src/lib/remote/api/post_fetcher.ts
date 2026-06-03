import { Post, PostResponse } from "../../../types/api";
import { generalPageRequestQueue, postLimiter } from "../http/rate_limiters";
import { ApiConfig } from "../../../config/api_config";
import { CoalescingResolver } from "../../async/coalescing_resolver";
import { DeletedPostError } from "../../../types/errors";
import { POST_API_URL } from "../url/api_urls";
import { buildPostPageUrl } from "../url/page_url_builder";
import { fetchHtml } from "../http/http_client";
import { fetchJsonFromApi } from "./api_client";
import { parsePostFromPostPage } from "../parsers/post_page_parser";
import { postResponseToPost } from "../parsers/api_post_parser";
import { withExponentialBackoff } from "../../async/timing";

const postFetcher = new CoalescingResolver<PostResponse>(
  ApiConfig.apiBatchSize,
  ApiConfig.apiBatchFlushDelay,
  fetchPostBatch
);

let postPageFetchBarrier: Promise<void> = Promise.resolve();

export function fetchPost(id: string): Promise<Post> {
  return postFetcher.resolve(id)
  .then(postResponseToPost)
  .catch((error: unknown) => recoverFromFetchError(id, error));
}

function recoverFromFetchError(id: string, error: unknown): Promise<Post> {
  if (error instanceof DeletedPostError) {
    return fetchPostFromPostPage(id);
  }
  throw error;
}

export async function fetchPostPageHtml(id: string): Promise<string> {
  await postPageFetchBarrier;
  await generalPageRequestQueue.wait();
  return withExponentialBackoff(() => fetchHtml(buildPostPageUrl(id)), 3, 1_000);
}

export function deferPostPageFetchesUntil(barrier: Promise<void>): void {
  postPageFetchBarrier = barrier;
}

function fetchPostFromPostPage(id: string): Promise<Post> {
  return fetchPostPageHtml(id).then(parsePostFromPostPage);
}

function fetchPostBatch(ids: string[]): Promise<Record<string, PostResponse>> {
  return postLimiter.run(() => fetchJsonFromApi(POST_API_URL, { ids }));
}
