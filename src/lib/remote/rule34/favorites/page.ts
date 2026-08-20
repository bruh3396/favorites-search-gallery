import { buildFavoritesPageUrl, buildProfilePageUrl } from "@/lib/remote/url";
import { macroTask, withExponentialBackoff } from "@/lib/async/scheduling";
import { FAVORITES_PAGE_ID } from "@/lib/environment";
import { Rule34NetworkConfig } from "@/config/rule34_network_config";
import { extractFavoritesCount } from "@/lib/remote/parsers/profile_page";
import { fetchHtml } from "@/lib/remote/http/client";
import { generalPageRequestLimiter } from "@/lib/remote/http/rate_limiters";

export function fetchFavoritesPage(pageNumber: number): Promise<string> {
  return fetchHtml(buildFavoritesPageUrl(pageNumber));
}

export function fetchFavoritesCount(): Promise<number | null> {
  const pageId = FAVORITES_PAGE_ID;

  if (pageId === null) {
    return Promise.resolve(null);
  }
  return generalPageRequestLimiter
    .run(() => fetchProfilePage(pageId))
    .then(extractFavoritesCount)
    .catch(() => null);
}

async function fetchProfilePage(pageId: string): Promise<string> {
  await macroTask();
  return withExponentialBackoff(
    () => fetchHtml(buildProfilePageUrl(pageId)),
    Rule34NetworkConfig.favoritesCountFetchRetries
  );
}
