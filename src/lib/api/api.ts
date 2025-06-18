import * as FSG_URL from "./url";
import { AddFavoriteStatus, Post } from "../../types/api/api_types";
import { extractFavoritesCount } from "./profile_page_parser";
import { extractPostFromAPI } from "./post_api_parser";
import { parsePostFromPostPage as extractPostFromPostPage } from "./post_page_parser";

async function getHTML(url: string): Promise<string> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
  }
  return response.text();
}

export async function fetchPostFromAPI(id: string): Promise<Post> {
  return extractPostFromAPI(await getHTML(FSG_URL.createAPIURL("post", id)));
}

export function fetchPostPage(id: string): Promise<string> {
  return getHTML(FSG_URL.createPostPageURL(id));
}

export async function fetchPostFromPostPage(id: string): Promise<Post> {
  return extractPostFromPostPage(await fetchPostPage(id));
}

export function fetchPostFromAPISafe(id: string): Promise<Post> {
  return fetchPostFromAPI(id).catch(() => {
    return fetchPostFromPostPage(id);
  });
}

export function fetchFavoritesPage(pageNumber: number): Promise<string> {
  return getHTML(FSG_URL.createFavoritesPageURL(pageNumber));
}

export async function addFavorite(id: string): Promise<AddFavoriteStatus> {
  fetch(FSG_URL.createPostVoteURL(id));
  const status = await getHTML(FSG_URL.createAddFavoriteURL(id));
  return parseInt(status);
}

export function removeFavorite(id: string): Promise<Response> {
  return fetch(FSG_URL.createRemoveFavoriteURL(id), {method: "GET", redirect: "manual"});
}

export function getFavoritesCount(): Promise<number | null> {
  return getHTML(FSG_URL.createProfilePageURL()).then(extractFavoritesCount).catch(null);
}
