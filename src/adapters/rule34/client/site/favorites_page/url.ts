import { BASE_INDEX_URL } from "@/adapters/rule34/client/site/index_url";

export const FAVORITES_PER_PAGE = 50;

export function favoritesPageUrl(pageId: string, offset: number): string {
  return `${BASE_INDEX_URL}favorites&s=view&id=${pageId}&pid=${offset}`;
}

export function favoritesPageOffset(pageIndex: number): number {
  return pageIndex * FAVORITES_PER_PAGE;
}
