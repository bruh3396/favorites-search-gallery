import { ORIGIN, POSTS_PER_SEARCH_PAGE } from "../../rule34_constants";
import { FAVORITES_PAGE_ID } from "../../environment";

const POST_PAGE_URL = `${ORIGIN}/index.php?page=post&s=view&id=`;
const SEARCH_PAGE_URL = `${ORIGIN}/index.php?page=post&s=list&tags=`;
const FAVORITES_PAGE_URL = `${ORIGIN}/index.php?page=favorites&s=view&id=${FAVORITES_PAGE_ID}`;
const PROFILE_PAGE_URL = `${ORIGIN}/index.php?page=account&s=profile&id=`;

export function buildPostPageUrl(id: string): string {
  return `${POST_PAGE_URL}${id}`;
}

export function buildSearchPageUrlFromQuery(searchQuery: string): string {
  return `${SEARCH_PAGE_URL}${encodeURIComponent(searchQuery)}`;
}

export function buildFavoritesPageUrl(pageNumber: number): string {
  return `${FAVORITES_PAGE_URL}&pid=${pageNumber}`;
}

export function buildProfilePageUrl(id: string): string {
  return `${PROFILE_PAGE_URL}${id}`;
}

export function buildSearchPageUrl(baseUrl: string, pageNumber: number): string {
  return `${baseUrl}&pid=${POSTS_PER_SEARCH_PAGE * pageNumber}`;
}
