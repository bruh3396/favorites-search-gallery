import {getFavoritesPageId, getUserId} from "../../utils/misc/metadata";
import {ON_MOBILE_DEVICE} from "../functional/flags";

const POST_PAGE_URL = "https://rule34.xxx/index.php?page=post&s=view&id=";
const SEARCH_PAGE_URL = "https://rule34.xxx/index.php?page=post&s=list&tags=";
const FAVORITES_PAGE_URL = `https://rule34.xxx/index.php?page=favorites&s=view&id=${getUserId()}`;
const PROFILE_PAGE_URL = `https://rule34.xxx/index.php?page=account&s=profile&id=${getFavoritesPageId()}`;
const API_BASE_URL = "https://api.rule34.xxx//index.php?page=dapi&s=";
const POST_VOTE_URL = "https://rule34.xxx/index.php?page=post&s=vote&type=up&id=";
const REMOVE_FAVORITE_URL = "https://rule34.xxx/index.php?page=favorites&s=delete&id=";
const ADD_FAVORITE_URL = "https://rule34.xxx/public/addfav.php?id=";
const CSS_URL = "https://rule34.xxx//css/";

function createPostPageURL(id: string): string {
  return `${POST_PAGE_URL}${id}`;
}

function createSearchPageURL(searchQuery: string): string {
  return `${SEARCH_PAGE_URL}${encodeURIComponent(searchQuery)}`;
}

function createFavoritesPageURL(pageNumber: number): string {
  return `${FAVORITES_PAGE_URL}&pid=${pageNumber}`;
}

function createProfilePageURL(): string {
  return PROFILE_PAGE_URL;
}

function createAPIURL(type: string, id: string): string {
  return `${API_BASE_URL}${type}&q=index&id=${id}`;
}

function createVoteURL(id: string): string {
  return `${POST_VOTE_URL}${id}`;
}

function createRemoveFavoriteURL(id: string): string {
  return `${REMOVE_FAVORITE_URL}${id}`;
}

function createAddFavoriteURL(id: string): string {
  return `${ADD_FAVORITE_URL}${id}`;
}

function getStyleSheetURL(useDark: boolean): string {
  return `${CSS_URL}${ON_MOBILE_DEVICE ? "mobile" : "desktop"}${useDark ? "-dark" : ""}.css?44`;
}

export const FSG_URL = {
  createPostPageURL,
  createSearchPageURL,
  createFavoritesPageURL,
  createProfilePageURL,
  createAPIURL,
  createVoteURL,
  createRemoveFavoriteURL,
  createAddFavoriteURL,
  getStyleSheetURL
};
