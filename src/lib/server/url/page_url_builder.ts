import { ORIGIN } from "./site_origin";
import { getFavoritesPageId } from "../../environment/favorites_metadata";

const POST_PAGE_URL = `${ORIGIN}/index.php?page=post&s=view&id=`;
const SEARCH_PAGE_URL = `${ORIGIN}/index.php?page=post&s=list&tags=`;
const FAVORITES_PAGE_URL = `${ORIGIN}/index.php?page=favorites&s=view&id=${getFavoritesPageId()}`;
const PROFILE_PAGE_URL = `${ORIGIN}/index.php?page=account&s=profile&id=`;

export function buildPostPageURL(id: string): string {
  return `${POST_PAGE_URL}${id}`;
}

export function buildSearchPageURL(searchQuery: string): string {
  return `${SEARCH_PAGE_URL}${encodeURIComponent(searchQuery)}`;
}

export function buildFavoritesPageURL(pageNumber: number): string {
  return `${FAVORITES_PAGE_URL}&pid=${pageNumber}`;
}

export function buildProfilePageURL(id: string): string {
  return `${PROFILE_PAGE_URL}${id}`;
}
