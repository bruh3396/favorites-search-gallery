import { BASE_INDEX_URL, ORIGIN } from "@/lib/constants";
import { postListPageOffset } from "@/lib/remote/pagination";

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

export function favoritesPageUrl(pageId: string, pageNumber: number): string {
  return `${BASE_INDEX_URL}favorites&s=view&id=${pageId}&pid=${pageNumber}`;
}

export function profilePageUrl(id: string): string {
  return `${BASE_INDEX_URL}account&s=profile&id=${id}`;
}

export function postListUrlFromBase(baseUrl: string, pageIndex: number): string {
  return `${baseUrl}&pid=${postListPageOffset(pageIndex)}`;
}
