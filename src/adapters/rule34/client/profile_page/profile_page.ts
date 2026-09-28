import { PageRequests, sitePageRequests } from "@/adapters/rule34/client/http";
import { macroTask, withExponentialBackoff } from "@/lib/async/scheduling";
import { BASE_INDEX_URL } from "@/adapters/rule34/client/site";
import { fetchHtml } from "@/utils/browser/http";
import { parseFavoritesCount } from "@/adapters/rule34/client/profile_page/parser";

const FETCH_ATTEMPTS = 5;

export function profilePageUrl(id: string): string {
  return `${BASE_INDEX_URL}account&s=profile&id=${id}`;
}

export function fetchFavoritesCount(pageId: string | null, pageRequests: PageRequests = sitePageRequests): Promise<number | null> {
  if (pageId === null) {
    return Promise.resolve(null);
  }
  return pageRequests.run(() => fetchProfilePage(pageId))
    .then(parseFavoritesCount)
    .catch(() => null);
}

async function fetchProfilePage(pageId: string): Promise<string> {
  await macroTask();
  return withExponentialBackoff(
    () => fetchHtml(profilePageUrl(pageId)),
    FETCH_ATTEMPTS
  );
}
