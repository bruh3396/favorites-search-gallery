import { ON_MOBILE_DEVICE } from "../../environment/environment";
import { ORIGIN } from "./site_origin";

const CSS_VERSION = 44;

const POST_VOTE_URL = `${ORIGIN}/index.php?page=post&s=vote&type=up&id=`;
const REMOVE_FAVORITE_URL = `${ORIGIN}/index.php?page=favorites&s=delete&id=`;
const ADD_FAVORITE_URL = `${ORIGIN}/public/addfav.php?id=`;
const CSS_URL = `${ORIGIN}/css/`;

export function buildPostVoteURL(id: string): string {
  return `${POST_VOTE_URL}${id}`;
}

export function buildRemoveFavoriteURL(id: string): string {
  return `${REMOVE_FAVORITE_URL}${id}`;
}

export function buildAddFavoriteURL(id: string): string {
  return `${ADD_FAVORITE_URL}${id}`;
}

export function buildStyleSheetURL(useDark: boolean): string {
  return `${CSS_URL}${ON_MOBILE_DEVICE ? "mobile" : "desktop"}${useDark ? "-dark" : ""}.css?${CSS_VERSION}`;
}
