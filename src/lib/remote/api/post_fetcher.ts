import { Post, PostResponse } from "../../../types/api";
import { generalPageRequestQueue, postLimiter } from "../http/rate_limiter";
import { CoalescingResolver } from "../../core/concurrency/coalescing_resolver";
import { POST_API_URL } from "../url/api_url_builder";
import { buildPostPageURL } from "../url/page_url_builder";
import { fetchFromServer } from "./server_client";
import { fetchHtml } from "../http/http_client";
import { parsePostFromPostPage } from "../parse/post_page_parser";
import { postResponseToPost } from "../parse/api_post_parser";

const postFetcher = new CoalescingResolver<PostResponse>(50, 1250, postLimiter, fetchPostBatch);

export function fetchPost(id: string): Promise<Post> {
  return postFetcher.resolve(id).then(postResponseToPost);
}

function fetchPostBatch(ids: string[]): Promise<Record<string, PostResponse>> {
  return fetchFromServer(POST_API_URL, { ids }).then(r => r.json() as Promise<Record<string, PostResponse>>);
}

export function fetchPostSafe(id: string): Promise<Post> {
  return fetchPost(id).catch(fetchPostFromPostPage);
}

function fetchPostFromPostPage(id: string): Promise<Post> {
  return fetchPostPage(id).then(parsePostFromPostPage);
}

export async function fetchPostPage(id: string): Promise<string> {
  await generalPageRequestQueue.wait();
  return fetchHtml(buildPostPageURL(id));
}
