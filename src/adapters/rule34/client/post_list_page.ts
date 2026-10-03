import { BASE_INDEX_URL } from "@/adapters/rule34/client/urls";
import { Post } from "@/core/domain/post/post";
import { Rule34MintMedia } from "@/adapters/rule34/client/mint_media";
import { fetchHtml } from "@/utils/browser/http";
import { pageRateLimiter } from "@/adapters/rule34/client/page_rate_limiter";
import { parseThumb } from "@/adapters/rule34/client/thumb";
import { withExponentialBackoff } from "@/lib/async/scheduling";

export const POSTS_PER_POST_LIST_PAGE = 42;

const FETCH_ATTEMPTS = 10;
const FETCH_RETRY_DELAY = 500;

export interface Rule34PostListPage {
  posts: Post[];
  paginator: HTMLElement | null;
}

export function postListUrlFromQuery(searchQuery: string): string {
  return `${BASE_INDEX_URL}post&s=list&tags=${encodeURIComponent(searchQuery)}`;
}

export function postListPageUrl(searchQuery: string, pageIndex: number): string {
  return `${postListUrlFromQuery(searchQuery)}&pid=${postListPageOffset(pageIndex)}`;
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

export function parsePostListPage(page: ParentNode, mintMedia: Rule34MintMedia): Rule34PostListPage {
  return {
    posts: Array.from(page.querySelectorAll<HTMLElement>(".thumb")).map(thumb => parseThumb(thumb, mintMedia)),
    paginator: page.querySelector<HTMLElement>("#paginator")
  };
}

export function fetchPostList(baseUrl: string, pageIndex: number): Promise<string> {
  return withExponentialBackoff(
    () => pageRateLimiter.run(() => fetchHtml(postListUrlFromBase(baseUrl, pageIndex))),
    FETCH_ATTEMPTS,
    FETCH_RETRY_DELAY
  );
}
