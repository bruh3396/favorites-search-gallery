import { FAVORITES_PAGE_ID } from "../../environment/favorites_metadata";
import { ORIGIN } from "./origin";
import { POSTS_PER_SEARCH_PAGE } from "../../environment/constants";

const POST_PAGE_URL = `${ORIGIN}/index.php?page=post&s=view&id=`;
const SEARCH_PAGE_URL = `${ORIGIN}/index.php?page=post&s=list&tags=`;
const FAVORITES_PAGE_URL = `${ORIGIN}/index.php?page=favorites&s=view&id=${FAVORITES_PAGE_ID}`;
const PROFILE_PAGE_URL = `${ORIGIN}/index.php?page=account&s=profile&id=`;

export function buildPostPageURL(id: string): string {
  return `${POST_PAGE_URL}${id}`;
}

export function buildSearchPageURLFromQuery(searchQuery: string): string {
  return `${SEARCH_PAGE_URL}${encodeURIComponent(searchQuery)}`;
}

export function buildFavoritesPageURL(pageNumber: number): string {
  return `${FAVORITES_PAGE_URL}&pid=${pageNumber}`;
}

export function buildProfilePageURL(id: string): string {
  return `${PROFILE_PAGE_URL}${id}`;
}

export function buildSearchPageURL(baseUrl: string, pageNumber: number): string {
  return `${baseUrl}&pid=${POSTS_PER_SEARCH_PAGE * pageNumber}`;
}
