import { ORIGIN, POSTS_PER_POST_LIST_PAGE } from "@/lib/rule34_constants";
import { FAVORITES_PAGE_ID } from "@/lib/environment";

const POST_PAGE_URL = `${ORIGIN}/index.php?page=post&s=view&id=`;
const POST_LIST_URL = `${ORIGIN}/index.php?page=post&s=list&tags=`;
const FAVORITES_PAGE_URL = `${ORIGIN}/index.php?page=favorites&s=view&id=${FAVORITES_PAGE_ID}`;
const PROFILE_PAGE_URL = `${ORIGIN}/index.php?page=account&s=profile&id=`;

export function buildPostPageUrl(id: string): string {
  return `${POST_PAGE_URL}${id}`;
}

export function buildPostListUrlFromQuery(searchQuery: string): string {
  return `${POST_LIST_URL}${encodeURIComponent(searchQuery)}`;
}

export function buildFavoritesPageUrl(pageNumber: number): string {
  return `${FAVORITES_PAGE_URL}&pid=${pageNumber}`;
}

export function buildProfilePageUrl(id: string): string {
  return `${PROFILE_PAGE_URL}${id}`;
}

export function buildPostListUrl(baseUrl: string, pageNumber: number): string {
  return `${baseUrl}&pid=${POSTS_PER_POST_LIST_PAGE * pageNumber}`;
}
