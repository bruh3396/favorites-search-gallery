import { ON_MOBILE_DEVICE } from "../global/flags/intrinsic_flags";
import { getUserId } from "../../utils/misc/favorites_page_metadata";

const ORIGIN = "https://rule34.xxx";
const API_BASE_URL = `https://favorites-search-gallery-api.onrender.com/?&userId=${getUserId()}`;

const POST_API_URL = `${API_BASE_URL}&type=post&id=`;
const TAG_API_URL = `${API_BASE_URL}&type=tag&name=`;

const POST_PAGE_URL = `${ORIGIN}/index.php?page=post&s=view&id=`;
const SEARCH_PAGE_URL = `${ORIGIN}/index.php?page=post&s=list&tags=`;
const FAVORITES_PAGE_URL = document.location.href;
const PROFILE_PAGE_URL = `${ORIGIN}/index.php?page=account&s=profile&id=`;

const POST_VOTE_URL = `${ORIGIN}/index.php?page=post&s=vote&type=up&id=`;
const REMOVE_FAVORITE_URL = `${ORIGIN}/index.php?page=favorites&s=delete&id=`;
const ADD_FAVORITE_URL = `${ORIGIN}/public/addfav.php?id=`;
const CSS_URL = `${ORIGIN}//css/`;

export function createPostPageURL(id: string): string {
  return `${POST_PAGE_URL}${id}`;
}

export function createSearchPageURL(searchQuery: string): string {
  return `${SEARCH_PAGE_URL}${encodeURIComponent(searchQuery)}`;
}

export function createFavoritesPageURL(pageNumber: number): string {
  return `${FAVORITES_PAGE_URL}&pid=${pageNumber}`;
}

export function createProfilePageURL(id: string): string {
  return PROFILE_PAGE_URL + id;
}

export function createPostAPIURL(id: string): string {
  return POST_API_URL + id;
}

export function createTagAPIURL(tagName: string): string {
  return TAG_API_URL + encodeURIComponent(tagName);
}

export function createPostVoteURL(id: string): string {
  return `${POST_VOTE_URL}${id}`;
}

export function createRemoveFavoriteURL(id: string): string {
  return `${REMOVE_FAVORITE_URL}${id}`;
}

export function createAddFavoriteURL(id: string): string {
  return `${ADD_FAVORITE_URL}${id}`;
}

export function getStyleSheetURL(useDark: boolean): string {
  return `${CSS_URL}${ON_MOBILE_DEVICE ? "mobile" : "desktop"}${useDark ? "-dark" : ""}.css?44`;
}
