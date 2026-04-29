import { GENERAL_PAGE_REQUEST_QUEUE, MULTI_POST_LIMITER, POST_LIMITER } from "./rate_limiter";
import { MULTI_POST_API_URL, buildPostAPIURL, buildServerTestURL } from "../url/api_url_builder";
import { extractPostFromAPI, extractPostFromAPISafe } from "../parse/api_post_parser";
import { FavoritesSettings } from "../../../config/favorites_settings";
import { Post } from "../../../types/post";
import { USER_ID } from "../../environment/favorites_environment";
import { buildPostPageURL } from "../url/page_url_builder";
import { fetchHtml } from "../http/http_client";
import { parsePostFromPostPage } from "../parse/post_page_parser";

export function fetchPostFromAPI(id: string): Promise<Post> {
  return POST_LIMITER.run(async() => {
    return extractPostFromAPI(await fetchHtml(buildPostAPIURL(id)));
  });
}

export function fetchPostFromAPISafe(id: string): Promise<Post> {
  return fetchPostFromAPI(id).catch(() => {
    return fetchPostFromPostPage(id);
  });
}

function fetchMultiplePostsFromAPIInOne(ids: string[]): Promise<Record<string, Post>> {
  return MULTI_POST_LIMITER.run(async() => {
    const response = await fetch(MULTI_POST_API_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids, userId: USER_ID }) });
    const data = await response.json() as Record<string, string>;
    const result = {} as Record<string, Post>;

    for (const [id, html] of Object.entries(data)) {
      result[id] = extractPostFromAPISafe(html);
    }
    return result;
  });
}

function fetchMultiplePostsFromAPIIteratively(ids: string[]): Promise<Record<string, Post>> {
  const result: Record<string, Post> = {};
  return Promise.all(ids.map(async(id) => {
    result[id] = await fetchPostFromAPI(id);
  })).then(() => {
    return result;
  });
}

export function fetchMultiplePostsFromAPI(ids: string[]): Promise<Record<string, Post>> {
  if (FavoritesSettings.fetchMultiplePostWhileFetchingFavorites) {
    return fetchMultiplePostsFromAPIInOne(ids);
  }
  return fetchMultiplePostsFromAPIIteratively(ids);
}

export async function fetchMultiplePostsFromAPISafe(ids: string[]): Promise<Record<string, Post>> {
  const posts = await fetchMultiplePostsFromAPI(ids);

  for (const [id, post] of Object.entries(posts)) {
    if (post.width === 0 && post.height === 0) {
      posts[id] = await fetchPostFromPostPage(id);
    }
  }
  return posts;
}

export async function fetchPostPage(id: string): Promise<string> {
  await GENERAL_PAGE_REQUEST_QUEUE.wait();
  return fetchHtml(buildPostPageURL(id));
}

export async function fetchPostFromPostPage(id: string): Promise<Post> {
  return parsePostFromPostPage(await fetchPostPage(id));
}

export function setupServer(): void {
  fetch(buildServerTestURL());
}
