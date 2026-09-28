import { macroTask, withExponentialBackoff } from "@/lib/async/scheduling";
import { BASE_INDEX_URL } from "@/adapters/rule34/client/site/index_url";
import { fetchHtml } from "@/utils/browser/http";
import { parseFavoritesCount } from "@/adapters/rule34/client/site/profile_page/parser";

const FETCH_ATTEMPTS = 5;

export function profilePageUrl(id: string): string {
  return `${BASE_INDEX_URL}account&s=profile&id=${id}`;
}

export function fetchFavoritesCount(pageId: string): Promise<number | null> {
  return fetchProfilePage(pageId)
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
