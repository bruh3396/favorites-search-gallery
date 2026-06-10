import { buildFavoritesPageUrl, buildProfilePageUrl } from "@/lib/remote/url/page_url_builder";
import { withExponentialBackoff, yieldControl } from "@/lib/async/timing";
import { FAVORITES_PAGE_ID } from "@/lib/environment";
import { Rule34NetworkConfig } from "@/config/rule34_network_config";
import { extractFavoritesCount } from "@/lib/remote/parsers/profile_page";
import { extractFavoritesPageCount } from "@/lib/remote/parsers/favorites_page";
import { fetchHtml } from "@/lib/remote/http/client";
import { generalPageRequestLimiter } from "@/lib/remote/http/rate_limiters";

export function fetchFavoritesPage(pageNumber: number): Promise<string> {
  return fetchHtml(buildFavoritesPageUrl(pageNumber));
}

export async function fetchFavoritesCount(): Promise<number | null> {
  const pageId = FAVORITES_PAGE_ID;

  if (pageId === null) {
    return null;
  }
  await yieldControl();
  return generalPageRequestLimiter.run(() =>
    withExponentialBackoff(() => fetchHtml(buildProfilePageUrl(pageId)), Rule34NetworkConfig.favoritesCountFetchRetries))
    .then(extractFavoritesCount)
    .catch(() => null);
}

export function fetchFavoritesPageCount(): Promise<number | null> {
  return fetchHtml(buildFavoritesPageUrl(0)).then(extractFavoritesPageCount);
}
