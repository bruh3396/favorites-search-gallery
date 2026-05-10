import { ORIGIN } from "./origin";

const CSS_VERSION = 44;

const POST_VOTE_URL = `${ORIGIN}/index.php?page=post&s=vote&type=up&id=`;
const REMOVE_FAVORITE_URL = `${ORIGIN}/index.php?page=favorites&s=delete&id=`;
const ADD_FAVORITE_URL = `${ORIGIN}/public/addfav.php?id=`;
const CSS_URL = `${ORIGIN}/css/`;

export function buildPostVoteUrl(id: string): string {
  return `${POST_VOTE_URL}${id}`;
}

export function buildRemoveFavoriteUrl(id: string): string {
  return `${REMOVE_FAVORITE_URL}${id}`;
}

export function buildAddFavoriteUrl(id: string): string {
  return `${ADD_FAVORITE_URL}${id}`;
}

export function buildStyleSheetUrl(device: "mobile" | "desktop", useDark: boolean): string {
  return `${CSS_URL}${device}${useDark ? "-dark" : ""}.css?${CSS_VERSION}`;
}
