import {Post} from "../../types/api/post";
import URL from "./url";
import {extractPost} from "./post_api_parser";
import {parsePostFromPostPage as extractPostFromPostPage} from "./post_page_parser";

async function getHTML(url: string): Promise<string> {
  const response = await fetch(url);
  return response.text();
}

async function fetchPost(id: string): Promise<Post> {
  return extractPost(await getHTML(URL.createAPIURL("post", id)));
}

async function fetchPostFromPostPage(id: string): Promise<Post> {
  return extractPostFromPostPage(await getHTML(URL.createPostPageURL(id)));
}

function addFavorite(id: string): void {
  fetch(URL.createPostPageURL(id));
  fetch(URL.createAddFavoriteURL(id));
}

function removeFavorite(id: string): void {
  fetch(URL.createRemoveFavoriteURL(id));
}

export const API = {fetchPost, fetchPostFromPostPage, addFavorite, removeFavorite};
