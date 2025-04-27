import {FSG_URL} from "./url";
import {Post} from "../../types/api/post";
import {extractFavoritesCount} from "./profile_page_parser";
import {extractPost} from "./post_api_parser";
import {parsePostFromPostPage as extractPostFromPostPage} from "./post_page_parser";

async function getHTML(url: string): Promise<string> {
  const response = await fetch(url);
  return response.text();
}

async function fetchPost(id: string): Promise<Post> {
  return extractPost(await getHTML(FSG_URL.createAPIURL("post", id)));
}

async function fetchPostFromPostPage(id: string): Promise<Post> {
  return extractPostFromPostPage(await getHTML(FSG_URL.createPostPageURL(id)));
}

function fetchFavoritesPage(pageNumber: number): Promise<string> {
  return getHTML(FSG_URL.createFavoritesPageURL(pageNumber));
}

function addFavorite(id: string): void {
  fetch(FSG_URL.createPostPageURL(id));
  fetch(FSG_URL.createAddFavoriteURL(id));
}

function removeFavorite(id: string): void {
  fetch(FSG_URL.createRemoveFavoriteURL(id));
}

function getFavoritesCount(): Promise<number | null> {
  return getHTML(FSG_URL.createProfilePageURL())
    .then(extractFavoritesCount)
    .catch(null);
}

export const API = {fetchPost, fetchPostFromPostPage, fetchFavoritesPage, addFavorite, removeFavorite, getFavoritesCount};
