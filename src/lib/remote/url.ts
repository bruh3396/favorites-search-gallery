import { BASE_INDEX_URL, ORIGIN, POSTS_PER_POST_LIST_PAGE } from "@/lib/rule34_constants";
import { FAVORITES_PAGE_ID } from "@/lib/environment";

export function buildAddFavoriteUrl(id: string): string {
  return `${ORIGIN}/public/addfav.php?id=${id}`;
}

export function buildPostVoteUrl(id: string): string {
  return `${BASE_INDEX_URL}post&s=vote&type=up&id=${id}`;
}

export function buildRemoveFavoriteUrl(id: string): string {
  return `${BASE_INDEX_URL}favorites&s=delete&id=${id}`;
}

export function buildPostPageUrl(id: string): string {
  return `${BASE_INDEX_URL}post&s=view&id=${id}`;
}

export function buildPostListUrlFromQuery(searchQuery: string): string {
  return `${BASE_INDEX_URL}post&s=list&tags=${encodeURIComponent(searchQuery)}`;
}

export function buildFavoritesPageUrl(pageNumber: number): string {
  return `${BASE_INDEX_URL}favorites&s=view&id=${FAVORITES_PAGE_ID}&pid=${pageNumber}`;
}

export function buildProfilePageUrl(id: string): string {
  return `${BASE_INDEX_URL}account&s=profile&id=${id}`;
}

export function buildPostListUrl(baseUrl: string, pageNumber: number): string {
  return `${baseUrl}&pid=${POSTS_PER_POST_LIST_PAGE * pageNumber}`;
}
