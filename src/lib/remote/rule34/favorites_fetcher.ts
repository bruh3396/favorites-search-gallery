import { buildFavoritesPageUrl, buildProfilePageUrl } from "../url/page_url_builder";
import { withExponentialBackoff, yieldControl } from "../../async/timing";
import { FAVORITES_PAGE_ID } from "../../environment/session";
import { Rule34NetworkConfig } from "../../../config/rule34_network_config";
import { extractFavoritesCount } from "../parsers/profile_page_parser";
import { extractFavoritesPageCount } from "../parsers/favorites_page_parser";
import { fetchHtml } from "../http/http_client";
import { generalPageRequestQueue } from "../http/rate_limiters";

export function fetchFavoritesPage(pageNumber: number): Promise<string> {
  return fetchHtml(buildFavoritesPageUrl(pageNumber));
}

export async function fetchFavoritesCount(): Promise<number | null> {
  const pageId = FAVORITES_PAGE_ID;

  if (pageId === null) {
    return null;
  }
  await yieldControl();
  await generalPageRequestQueue.wait();
  return withExponentialBackoff(() => fetchHtml(buildProfilePageUrl(pageId)), Rule34NetworkConfig.favoritesCountFetchRetries)
    .then(extractFavoritesCount)
    .catch(() => null);
}

export function fetchFavoritesPageCount(): Promise<number | null> {
  return fetchHtml(buildFavoritesPageUrl(0)).then(extractFavoritesPageCount);
}
