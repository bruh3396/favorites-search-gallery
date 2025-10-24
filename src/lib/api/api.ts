import * as FSG_URL from "./api_url";
import { extractPostFromAPI, extractPostFromAPISafe } from "./post_api_parser";
import { AddFavoriteStatus } from "../../types/favorite_types";
import { ConcurrencyLimiter } from "../components/concurrency_limiter";
import { Post } from "../../types/common_types";
import { extractFavoritesCount } from "./profile_page_parser";
import { parsePostFromPostPage as extractPostFromPostPage } from "./post_page_parser";
import { getUserId } from "../../utils/misc/favorites_page_metadata";

const USER_ID = getUserId();
const POST_PAGE_LIMITER = new ConcurrencyLimiter(2);
const MULTI_POST_LIMITER = new ConcurrencyLimiter(4);
const POST_LIMITER = new ConcurrencyLimiter(250);

export async function getHTML(url: string): Promise<string> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
  }
  return response.text();
}

export function fetchPostFromAPI(id: string): Promise<Post> {
  return POST_LIMITER.run(async() => {
    return extractPostFromAPI(await getHTML(FSG_URL.createPostAPIURL(id)));
  });
}

export function fetchMultiplePostsFromAPI(ids: string[]): Promise<Record<string, Post>> {
  return MULTI_POST_LIMITER.run(async() => {
    const response = await fetch(FSG_URL.MULTI_POST_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids, userId: USER_ID })
    });
    const data = await response.json() as Record<string, string>;
    const result = {} as Record<string, Post>;

    for (const [id, html] of Object.entries(data)) {
      result[id] = extractPostFromAPISafe(html);
    }
    return result;
  });
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

export function fetchPostPage(id: string): Promise<string> {
  return getHTML(FSG_URL.createPostPageURL(id));
}

export function fetchPostFromPostPage(id: string): Promise<Post> {
  return POST_PAGE_LIMITER.run(async() => {
    return extractPostFromPostPage(await fetchPostPage(id));
  });
}

export function fetchPostFromAPISafe(id: string): Promise<Post> {
  return fetchPostFromAPI(id).catch(() => {
    return fetchPostFromPostPage(id);
  });
}

export function fetchFavoritesPage(pageNumber: number): Promise<string> {
  return getHTML(FSG_URL.createFavoritesPageURL(pageNumber));
}

export function fetchTagFromAPI(tagName: string): Promise<string> {
  return getHTML(FSG_URL.createTagAPIURL(tagName));
}

export async function addFavorite(id: string): Promise<AddFavoriteStatus> {
  fetch(FSG_URL.createPostVoteURL(id));
  const status = await getHTML(FSG_URL.createAddFavoriteURL(id));
  return parseInt(status);
}

export function removeFavorite(id: string): Promise<Response> {
  return fetch(FSG_URL.createRemoveFavoriteURL(id), { method: "GET", redirect: "manual" });
}

export function getFavoritesCount(id: string): Promise<number | null> {
  return getHTML(FSG_URL.createProfilePageURL(id)).then(extractFavoritesCount).catch(null);
}
