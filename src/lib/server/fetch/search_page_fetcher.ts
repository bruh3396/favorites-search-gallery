import { GENERAL_PAGE_REQUEST_QUEUE } from "./rate_limiter";
import { buildSearchPageURL } from "../url/page_url_builder";
import { fetchHtml } from "../http/http_client";

export async function fetchSearchPage(baseUrl: string, pageNumber: number): Promise<string> {
  await GENERAL_PAGE_REQUEST_QUEUE.wait();
  return fetchHtml(buildSearchPageURL(baseUrl, pageNumber));
}
