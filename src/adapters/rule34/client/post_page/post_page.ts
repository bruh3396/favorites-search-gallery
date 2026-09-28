import { PageRequests, sitePageRequests } from "@/adapters/rule34/client/http";
import { BASE_INDEX_URL } from "@/adapters/rule34/client/site";
import { fetchHtml } from "@/utils/browser/http";
import { withExponentialBackoff } from "@/lib/async/scheduling";

const FETCH_ATTEMPTS = 3;
const FETCH_RETRY_DELAY = 1000;

export function postPageUrl(id: string): string {
  return `${BASE_INDEX_URL}post&s=view&id=${id}`;
}

export function fetchPostPage(id: string, pageRequests: PageRequests = sitePageRequests): Promise<string> {
  return pageRequests.run(() => withExponentialBackoff(() => fetchHtml(postPageUrl(id)), FETCH_ATTEMPTS, FETCH_RETRY_DELAY));
}
