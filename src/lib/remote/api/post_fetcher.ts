import { Post, PostResponse } from "../../../types/api";
import { generalPageRequestQueue, postLimiter } from "../http/rate_limiter";
import { CoalescingResolver } from "../../core/concurrency/coalescing_resolver";
import { DeletedPostError } from "../../../types/errors";
import { POST_API_URL } from "../url/api_url_builder";
import { buildPostPageURL } from "../url/page_url_builder";
import { fetchFromServer } from "./server_client";
import { fetchHtml } from "../http/http_client";
import { parsePostFromPostPage } from "../parse/post_page_parser";
import { postResponseToPost } from "../parse/api_post_parser";

const postFetcher = new CoalescingResolver<PostResponse>(
  50, 2000, postLimiter,
  (ids) => fetchFromServer(POST_API_URL, { ids }).then(r => r.json() as Promise<Record<string, PostResponse>>)
);

function fetchPostFromAPI(id: string): Promise<Post> {
  return postFetcher.resolve(id).then(postResponseToPost);
}

export function fetchPostWithFallback(id: string): Promise<Post> {
  return fetchPostFromAPI(id).catch((error: unknown) => {
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
  await generalPageRequestQueue.wait();
  return fetchHtml(buildPostPageURL(id));
}
