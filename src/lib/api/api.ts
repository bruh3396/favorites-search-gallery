import * as FSG_URL from "./url";
import {Post} from "../../types/api/post";
import {extractFavoritesCount} from "./profile_page_parser";
import {extractPostFromAPI} from "./post_api_parser";
import {parsePostFromPostPage as extractPostFromPostPage} from "./post_page_parser";

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

export async function fetchPostFromPostPage(id: string): Promise<Post> {
  return extractPostFromPostPage(await getHTML(FSG_URL.createPostPageURL(id)));
}

export function fetchFavoritesPage(pageNumber: number): Promise<string> {
  return getHTML(FSG_URL.createFavoritesPageURL(pageNumber));
}

export function addFavorite(id: string): void {
  fetch(FSG_URL.createPostPageURL(id));
  fetch(FSG_URL.createAddFavoriteURL(id));
}

export function removeFavorite(id: string): void {
  fetch(FSG_URL.createRemoveFavoriteURL(id), {method: "GET", redirect: "manual"});
}

export function getFavoritesCount(): Promise<number | null> {
  return getHTML(FSG_URL.createProfilePageURL()).then(extractFavoritesCount).catch(null);
}
