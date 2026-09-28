import { BASE_INDEX_URL } from "@/adapters/rule34/client/site/index_url";
import { fetchHtml } from "@/utils/browser/http";
import { withExponentialBackoff } from "@/lib/async/scheduling";

const FETCH_ATTEMPTS = 3;
const FETCH_RETRY_DELAY = 1000;

export function postPageUrl(id: string): string {
  return `${BASE_INDEX_URL}post&s=view&id=${id}`;
}

export function fetchPostPage(id: string): Promise<string> {
  return withExponentialBackoff(() => fetchHtml(postPageUrl(id)), FETCH_ATTEMPTS, FETCH_RETRY_DELAY);
}
