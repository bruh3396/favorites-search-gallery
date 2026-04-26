import { AddFavoriteStatus, Favorite } from "../../../types/favorite_data_types";
import { MULTI_POST_API_URL, buildPostAPIURL, buildServerTestURL, buildTagAPIURL } from "../url/api_url_builder";
import { buildAddFavoriteURL, buildPostVoteURL, buildRemoveFavoriteURL } from "../url/action_url_builder";
import { buildFavoritesPageURL, buildPostPageURL, buildProfilePageURL } from "../url/page_url_builder";
import { extractPostFromAPI, extractPostFromAPISafe } from "../parse/api_post_parser";
import { fetch429, fetch429NTimes, getHTML } from "../http/http_client";
import { ConcurrencyLimiter } from "../../core/concurrency/concurrency_limiter";
import { FavoritesSettings } from "../../../config/favorites_settings";
import { ON_SEARCH_PAGE } from "../../environment/environment";
import { Post } from "../../../types/common_types";
import { ThrottledQueue } from "../../core/concurrency/throttled_queue";
import { extractFavoritesCount } from "../parse/profile_page_parser";
import { extractFavoritesPageCount } from "../parse/favorites_page_parser";
import { parsePostFromPostPage as extractPostFromPostPage } from "../parse/post_page_parser";
import { getUserId } from "../../../utils/favorites_page_metadata";

const USER_ID = getUserId();
const MULTI_POST_LIMITER = new ConcurrencyLimiter(4);
const POST_LIMITER = new ConcurrencyLimiter(250);
const TAG_LIMITER = new ConcurrencyLimiter(100);
const FAVORITES_PAGE_LIMITER = new ConcurrencyLimiter(2);
const FAVORITE_REMOVE_QUEUE = new ThrottledQueue(1000);
const FAVORITE_ADD_QUEUE = new ThrottledQueue(200);
const GENERAL_REQUEST_QUEUE = new ThrottledQueue(2000);

export function fetchPostFromAPI(id: string): Promise<Post> {
  return POST_LIMITER.run(async() => {
    return extractPostFromAPI(await getHTML(buildPostAPIURL(id)));
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
  await GENERAL_REQUEST_QUEUE.wait();
  return getHTML(buildPostPageURL(id));
}

export async function fetchPostFromPostPage(id: string): Promise<Post> {
  return extractPostFromPostPage(await fetchPostPage(id));
}

export function fetchFavoritesPage(pageNumber: number): Promise<string> {
  return getHTML(buildFavoritesPageURL(pageNumber));
}

export function fetchFavoritesPageSafe(pageNumber: number): Promise<string> {
  return FAVORITES_PAGE_LIMITER.run(() => {
    return fetchFavoritesPage(pageNumber);
  });
}

export function fetchTagFromAPI(tagName: string): Promise<string> {
  return TAG_LIMITER.run(() => {
    return getHTML(buildTagAPIURL(tagName));
  });
}

export async function addFavorite(id: string): Promise<AddFavoriteStatus> {
  FAVORITE_REMOVE_QUEUE.cancel(id);

  if (!await FAVORITE_ADD_QUEUE.wait(id)) {
    return AddFavoriteStatus.ERROR;
  }

  if (ON_SEARCH_PAGE) {
    fetch429(buildPostVoteURL(id));
  }
  const status = await getHTML(buildAddFavoriteURL(id));
  return parseInt(status);
}

export async function removeFavorite(id: string): Promise<void> {
  FAVORITE_ADD_QUEUE.cancel(id);

  if (await FAVORITE_REMOVE_QUEUE.wait(id)) {
    fetch429NTimes(buildRemoveFavoriteURL(id), { method: "GET", redirect: "manual" }, 3);
  }
}

export function getFavoritesCount(id: string): Promise<number | null> {
  return getHTML(buildProfilePageURL(id)).then(extractFavoritesCount).catch(null);
}

export function getFavoritesPageCount(): Promise<number | null> {
  return getHTML(buildFavoritesPageURL(0)).then(extractFavoritesPageCount);
}

export function setupServer(): void {
  fetch(buildServerTestURL());
}

export function populateMetadata(favorites: Favorite[]): void {
  if (!FavoritesSettings.fetchMultiplePostWhileFetchingFavorites) {
    return;
  }
  const favoriteMap = new Map(favorites.map(f => [f.id, f]));

  fetchMultiplePostsFromAPI([...favoriteMap.keys()])
    .then((postMap) => {
      for (const [id, post] of Object.entries(postMap)) {
        favoriteMap.get(id)?.processPost(post);
      }
    })
    .catch(console.error);
}
