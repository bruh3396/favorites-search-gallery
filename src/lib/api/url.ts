import {ON_MOBILE_DEVICE} from "../functional/flags";
import {getFavoritesPageId} from "../../utils/misc/metadata";

const POST_PAGE_URL = "https://rule34.xxx/index.php?page=post&s=view&id=";
const SEARCH_PAGE_URL = "https://rule34.xxx/index.php?page=post&s=list&tags=";
const FAVORITES_PAGE_URL = document.location.href;
const PROFILE_PAGE_URL = `https://rule34.xxx/index.php?page=account&s=profile&id=${getFavoritesPageId()}`;
const API_BASE_URL = "https://api.rule34.xxx//index.php?page=dapi&s=";
const POST_VOTE_URL = "https://rule34.xxx/index.php?page=post&s=vote&type=up&id=";
const REMOVE_FAVORITE_URL = "https://rule34.xxx/index.php?page=favorites&s=delete&id=";
const ADD_FAVORITE_URL = "https://rule34.xxx/public/addfav.php?id=";
const CSS_URL = "https://rule34.xxx//css/";

export function createPostPageURL(id: string): string {
  return `${POST_PAGE_URL}${id}`;
}

export function createSearchPageURL(searchQuery: string): string {
  return `${SEARCH_PAGE_URL}${encodeURIComponent(searchQuery)}`;
}

export function createFavoritesPageURL(pageNumber: number): string {
  return `${FAVORITES_PAGE_URL}&pid=${pageNumber}`;
}

export function createProfilePageURL(): string {
  return PROFILE_PAGE_URL;
}

export function createAPIURL(type: string, id: string): string {
  return `${API_BASE_URL}${type}&q=index&id=${id}`;
}

export function createVoteURL(id: string): string {
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
