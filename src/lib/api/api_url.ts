import { getFavoritesPageId, getUserId } from "../../utils/misc/favorites_page_metadata";
import { ON_MOBILE_DEVICE } from "../global/flags/intrinsic_flags";

const PRIVATE_SERVER_ORIGIN = "https://favorites-search-gallery-api.onrender.com";
const PRIVATE_API_BASE_URL = `${PRIVATE_SERVER_ORIGIN}/?userId=${getUserId()}`;
const PRIVATE_API_TAG_URL = `${PRIVATE_API_BASE_URL}&type=tag&name=`;
const PRIVATE_API_POST_URL = `${PRIVATE_API_BASE_URL}&type=post&id=`;

const PUBLIC_SERVER_ORIGIN = "https://api.rule34.xxx/index.php?page=dapi";
const PUBLIC_API_BASE_URL = PUBLIC_SERVER_ORIGIN;
const PUBLIC_API_POST_URL = `${PUBLIC_API_BASE_URL}&s=post&q=index&id=`;
const PUBLIC_API_TAG_URL = `${PUBLIC_API_BASE_URL}&s=tag&q=index&name=`;

let FINAL_API_POST_URL = PRIVATE_API_POST_URL;
let FINAL_API_TAG_URL = PRIVATE_API_TAG_URL;

const ORIGIN = "https://rule34.xxx";
const POST_PAGE_URL = `${ORIGIN}/index.php?page=post&s=view&id=`;
const SEARCH_PAGE_URL = `${ORIGIN}/index.php?page=post&s=list&tags=`;
const FAVORITES_PAGE_URL = `${ORIGIN}/index.php?page=favorites&s=view&id=${getFavoritesPageId()}`;
const PROFILE_PAGE_URL = `${ORIGIN}/index.php?page=account&s=profile&id=`;

const POST_VOTE_URL = `${ORIGIN}/index.php?page=post&s=vote&type=up&id=`;
const REMOVE_FAVORITE_URL = `${ORIGIN}/index.php?page=favorites&s=delete&id=`;
const ADD_FAVORITE_URL = `${ORIGIN}/public/addfav.php?id=`;
const CSS_URL = `${ORIGIN}//css/`;

export const MULTI_POST_API_URL = `${PRIVATE_SERVER_ORIGIN}/multi-post`;

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
  return `${PROFILE_PAGE_URL}${id}`;
}

export function createPostAPIURL(id: string): string {
  return `${FINAL_API_POST_URL}${id}`;
}

export function createTagAPIURL(tagName: string): string {
  return `${FINAL_API_TAG_URL}${encodeURIComponent(tagName)}`;
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

export async function configureFinalAPI(): Promise<void> {
  fetch(PRIVATE_API_POST_URL + 50);
  try {
    const response = await fetch(`${PUBLIC_API_TAG_URL}50`);

    if (response.ok) {
      FINAL_API_POST_URL = PUBLIC_API_POST_URL;
    } else {
      console.error(response.statusText);
    }

  } catch (error) {
    console.error(error);
  }

  try {
    const response = await fetch(`${PUBLIC_API_TAG_URL}1girls`);

    if (response.ok) {
      FINAL_API_TAG_URL = PUBLIC_API_TAG_URL;
    } else {
      console.error(response.statusText);
    }

  } catch (error) {
    console.error(error);
  }
}

export function ping(): void {
  fetch(PRIVATE_API_POST_URL + 50);
}
