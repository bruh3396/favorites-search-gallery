import { BASE_INDEX_URL } from "@/adapters/rule34/client/urls";
import { Post } from "@/core/domain/post/post";
import { Rule34MintMedia } from "@/adapters/rule34/client/mint_media";
import { parseThumb } from "@/adapters/rule34/client/thumb";

export const POSTS_PER_POST_LIST_PAGE = 42;

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

export function postListPageOffset(pageIndex: number): number {
  return pageIndex * POSTS_PER_POST_LIST_PAGE;
}

export function postListPageIndex(offset: number): number {
  return Math.round(offset / POSTS_PER_POST_LIST_PAGE);
}

export function parsePostListPage(page: ParentNode, mintMedia: Rule34MintMedia): Rule34PostListPage {
  return {
    posts: [...page.querySelectorAll<HTMLElement>(".thumb")].map(thumb => parseThumb(thumb, mintMedia)).filter(post => post !== null),
    paginator: page.querySelector<HTMLElement>("#paginator")
  };
}
