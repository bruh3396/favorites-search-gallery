import { buildSearchPageURL } from "../url/page_url_builder";
import { fetchHtml } from "../http/http_client";
import { generalPageRequestQueue } from "./rate_limiter";

export async function fetchSearchPage(baseUrl: string, pageNumber: number): Promise<string> {
  await generalPageRequestQueue.wait();
  return fetchHtml(buildSearchPageURL(baseUrl, pageNumber));
}
