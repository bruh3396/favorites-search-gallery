import { BASE_INDEX_URL, ORIGIN, POSTS_PER_POST_LIST_PAGE } from "@/lib/rule34_constants";
import { FAVORITES_PAGE_ID } from "@/lib/environment";

export function addFavoriteUrl(id: string): string {
  return `${ORIGIN}/public/addfav.php?id=${id}`;
}

export function postVoteUrl(id: string): string {
  return `${BASE_INDEX_URL}post&s=vote&type=up&id=${id}`;
}

export function removeFavoriteUrl(id: string): string {
  return `${BASE_INDEX_URL}favorites&s=delete&id=${id}`;
}

export function postPageUrl(id: string): string {
  return `${BASE_INDEX_URL}post&s=view&id=${id}`;
}

export function postListUrlFromQuery(searchQuery: string): string {
  return `${BASE_INDEX_URL}post&s=list&tags=${encodeURIComponent(searchQuery)}`;
}

export function favoritesPageUrl(pageNumber: number): string {
  return `${BASE_INDEX_URL}favorites&s=view&id=${FAVORITES_PAGE_ID}&pid=${pageNumber}`;
}

export function profilePageUrl(id: string): string {
  return `${BASE_INDEX_URL}account&s=profile&id=${id}`;
}

export function postListUrlFromBase(baseUrl: string, pageNumber: number): string {
  return `${baseUrl}&pid=${POSTS_PER_POST_LIST_PAGE * pageNumber}`;
}
