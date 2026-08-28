import { favoritesPageUrl, postListUrlFromBase, postPageUrl, profilePageUrl } from "@/lib/remote/url";
import { macroTask, withExponentialBackoff } from "@/lib/async/scheduling";
import { FAVORITES_PAGE_ID } from "@/lib/environment";
import { RateLimiter } from "@/lib/async/rate_limiting";
import { Rule34NetworkConfig } from "@/config/rule34_network_config";
import { fetchHtml } from "@/utils/browser/http";

const generalPageRequestLimiter = new RateLimiter(Rule34NetworkConfig.generalPageRequestRateLimit);

let postPageFetchGate: Promise<void> = Promise.resolve();

export function fetchFavoritesPage(pageNumber: number): Promise<string> {
  return fetchHtml(favoritesPageUrl(pageNumber));
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

export function fetchPostList(baseUrl: string, pageNumber: number): Promise<string> {
  return generalPageRequestLimiter.run(() => fetchHtml(postListUrlFromBase(baseUrl, pageNumber)));
}

export async function fetchPostPageHtml(id: string): Promise<string> {
  await postPageFetchGate;
  return generalPageRequestLimiter.run(() => withExponentialBackoff(() => fetchHtml(postPageUrl(id)), 3, 1000));
}

export function deferPostPageFetchesUntil(gate: Promise<void>): void {
  postPageFetchGate = gate;
}

async function fetchProfilePage(pageId: string): Promise<string> {
  await macroTask();
  return withExponentialBackoff(
    () => fetchHtml(profilePageUrl(pageId)),
    Rule34NetworkConfig.favoritesCountFetchRetries
  );
}

function extractFavoritesCount(html: string): number {
  const favoritesUrl = Array.from(new DOMParser().parseFromString(html, "text/html").querySelectorAll("a"))
    .find(a => a.href.includes("page=favorites&s=view"));

  if (favoritesUrl === undefined || favoritesUrl.textContent === null) {
    return 0;
  }
  return parseInt(favoritesUrl.textContent, 10);
}
