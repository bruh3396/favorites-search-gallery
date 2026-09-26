import { FAVORITES_PER_PAGE, POSTS_PER_POST_LIST_PAGE } from "@/lib/constants";

export function favoritesPageOffset(pageIndex: number): number {
  return pageIndex * FAVORITES_PER_PAGE;
}

export function postListPageOffset(pageIndex: number): number {
  return pageIndex * POSTS_PER_POST_LIST_PAGE;
}

export function postListPageIndex(offset: number): number {
  return Math.round(offset / POSTS_PER_POST_LIST_PAGE);
}
