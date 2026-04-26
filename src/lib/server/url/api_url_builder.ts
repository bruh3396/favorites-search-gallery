import { getUserId } from "../../../utils/favorites_page_metadata";

export const USE_PRIVATE_API = true;

const PUBLIC_SERVER_ORIGIN = "https://api.rule34.xxx/index.php?page=dapi";
const PUBLIC_API_BASE_URL = PUBLIC_SERVER_ORIGIN;
const PUBLIC_API_POST_URL = `${PUBLIC_API_BASE_URL}&s=post&q=index&id=`;
const PUBLIC_API_TAG_URL = `${PUBLIC_API_BASE_URL}&s=tag&q=index&name=`;

const PRIVATE_SERVER_ORIGIN = "https://favorites-search-gallery-api.onrender.com";
const PRIVATE_API_BASE_URL = `${PRIVATE_SERVER_ORIGIN}/?userId=${getUserId()}`;
const PRIVATE_API_TAG_URL = `${PRIVATE_API_BASE_URL}&type=tag&name=`;
const PRIVATE_API_POST_URL = `${PRIVATE_API_BASE_URL}&type=post&id=`;

export const MULTI_POST_API_URL = `${PRIVATE_SERVER_ORIGIN}/multi-post`;

export const API_POST_URL = USE_PRIVATE_API ? PRIVATE_API_POST_URL : PUBLIC_API_POST_URL;
export const API_TAG_URL = USE_PRIVATE_API ? PRIVATE_API_TAG_URL : PUBLIC_API_TAG_URL;

export function buildPostAPIURL(id: string): string {
  return `${API_POST_URL}${id}`;
}

export function buildTagAPIURL(tagName: string): string {
  return `${API_TAG_URL}${encodeURIComponent(tagName)}`;
}

export function buildServerTestURL(): string {
  return `${PRIVATE_API_POST_URL}50`;
}
