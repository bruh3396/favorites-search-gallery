import { Post } from "@/core/domain/post/post";
import { BASE_INDEX_URL } from "@/adapters/rule34/client/site";
import { fetchHtml } from "@/utils/browser/http";
import { parseFavoritesPage } from "@/adapters/rule34/client/favorites_page/parser";

export const FAVORITES_PER_PAGE = 50;

export function favoritesPageUrl(pageId: string, pageNumber: number): string {
  return `${BASE_INDEX_URL}favorites&s=view&id=${pageId}&pid=${pageNumber}`;
}

export function favoritesPageOffset(pageIndex: number): number {
  return pageIndex * FAVORITES_PER_PAGE;
}

export function fetchFavoritesPagePosts(pageId: string, pageIndex: number): Promise<Post[]> {
  return fetchHtml(favoritesPageUrl(pageId, favoritesPageOffset(pageIndex)))
    .then(html => parseFavoritesPage(new DOMParser().parseFromString(html, "text/html")));
}
