import { BASE_INDEX_URL } from "@/adapters/rule34/client/site/index_url";
import { fetchHtml } from "@/utils/browser/http";
import { pageRateLimiter } from "@/adapters/rule34/client/site/page_rate_limiter";
import { withExponentialBackoff } from "@/lib/async/scheduling";

export const POSTS_PER_POST_LIST_PAGE = 42;

const FETCH_ATTEMPTS = 10;
const FETCH_RETRY_DELAY = 500;

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
  return withExponentialBackoff(
    () => pageRateLimiter.run(() => fetchHtml(postListUrlFromBase(baseUrl, pageNumber))),
    FETCH_ATTEMPTS,
    FETCH_RETRY_DELAY
  );
}
