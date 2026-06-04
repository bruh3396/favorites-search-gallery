import { buildSearchPageUrl } from "@/lib/remote/url/page_url_builder";
import { fetchHtml } from "@/lib/remote/http/http_client";
import { generalPageRequestQueue } from "@/lib/remote/http/rate_limiters";

export async function fetchSearchPage(baseUrl: string, pageNumber: number): Promise<string> {
  await generalPageRequestQueue.wait();
  return fetchHtml(buildSearchPageUrl(baseUrl, pageNumber));
}
