import { buildFavoritesPageURL, buildProfilePageURL } from "../url/page_url_builder";
import { withExponentialBackoff, yieldControl } from "../../core/scheduling/promise";
import { Rule34NetworkConfig } from "../../../config/rule34_network_config";
import { FAVORITES_PAGE_ID } from "../../environment/favorites_metadata";
import { extractFavoritesCount } from "../parse/profile_page_parser";
import { extractFavoritesPageCount } from "../parse/favorites_page_parser";
import { fetchHtml } from "../http/http_client";
import { generalPageRequestQueue } from "../http/rate_limiter";

export function fetchFavoritesPage(pageNumber: number): Promise<string> {
  return fetchHtml(buildFavoritesPageURL(pageNumber));
}

export async function fetchFavoritesCount(): Promise<number | null> {
  const pageId = FAVORITES_PAGE_ID;

  if (pageId === null) {
    return null;
  }
  await yieldControl();
  await generalPageRequestQueue.wait();
  return withExponentialBackoff(() => fetchHtml(buildProfilePageURL(pageId)), Rule34NetworkConfig.favoritesCountFetchRetries)
    .then(extractFavoritesCount)
    .catch(() => null);
}

export function fetchFavoritesPageCount(): Promise<number | null> {
  return fetchHtml(buildFavoritesPageURL(0)).then(extractFavoritesPageCount);
}
