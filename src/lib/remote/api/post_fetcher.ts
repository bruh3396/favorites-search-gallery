import { Post, PostResponse } from "../../../types/api";
import { generalPageRequestQueue, postLimiter } from "../http/rate_limiter";
import { ApiConfig } from "../../../config/api_config";
import { CoalescingResolver } from "../../core/concurrency/coalescing_resolver";
import { DeletedPostError } from "../../../types/errors";
import { POST_API_URL } from "../url/api_urls";
import { buildPostPageUrl } from "../url/page_url_builder";
import { fetchHtml } from "../http/http_client";
import { fetchJsonFromApi } from "./api_client";
import { parsePostFromPostPage } from "../parse/post_page_parser";
import { postResponseToPost } from "../parse/api_post_parser";
import { withExponentialBackoff } from "../../core/scheduling/promise";

function fetchPostBatch(ids: string[]) : Promise<Record<string, PostResponse>> {
  return postLimiter.run(() => fetchJsonFromApi(POST_API_URL, { ids }));
}

const postFetcher = new CoalescingResolver<PostResponse>(
  ApiConfig.apiBatchSize,
  ApiConfig.apiBatchFlushDelay,
  fetchPostBatch
);

let postPageGate: Promise<void> = Promise.resolve();

export function setPostPageGate(gate: Promise<void>): void {
  postPageGate = gate;
}

function fetchPostFromApi(id: string): Promise<Post> {
  return postFetcher.resolve(id).then(postResponseToPost);
}

export function fetchPostWithFallback(id: string): Promise<Post> {
  return fetchPostFromApi(id).catch((error: unknown) => {
    if (!(error instanceof DeletedPostError)) {
      throw error;
    }
    return fetchPostFromPostPage(id);
  });
}

export function fetchPostFromPostPage(id: string): Promise<Post> {
  return fetchPostPageHtml(id).then(parsePostFromPostPage);
}

export async function fetchPostPageHtml(id: string): Promise<string> {
  await postPageGate;
  await generalPageRequestQueue.wait();
  return withExponentialBackoff(() => fetchHtml(buildPostPageUrl(id)), 3, 1000);
}
