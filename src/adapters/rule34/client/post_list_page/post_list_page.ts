import { BASE_INDEX_URL } from "@/adapters/rule34/client/site";
import { fetchHtml } from "@/utils/browser/http";
import { runPageRequest } from "@/adapters/rule34/client/http";

export const POSTS_PER_POST_LIST_PAGE = 42;

export function postListUrlFromQuery(searchQuery: string): string {
  return `${BASE_INDEX_URL}post&s=list&tags=${encodeURIComponent(searchQuery)}`;
}

export function postListUrlFromBase(baseUrl: string, pageIndex: number): string {
  return `${baseUrl}&pid=${postListPageOffset(pageIndex)}`;
}

export function postListPageOffset(pageIndex: number): number {
  return pageIndex * POSTS_PER_POST_LIST_PAGE;
}

export function postListPageIndex(offset: number): number {
  return Math.round(offset / POSTS_PER_POST_LIST_PAGE);
}

export function fetchPostList(baseUrl: string, pageNumber: number): Promise<string> {
  return runPageRequest(() => fetchHtml(postListUrlFromBase(baseUrl, pageNumber)));
}
