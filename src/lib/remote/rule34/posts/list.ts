import { buildPostListUrl } from "@/lib/remote/url/page_url_builder";
import { fetchHtml } from "@/lib/remote/http/client";
import { generalPageRequestQueue } from "@/lib/remote/http/rate_limiters";

export async function fetchPostList(baseUrl: string, pageNumber: number): Promise<string> {
  await generalPageRequestQueue.wait();
  return fetchHtml(buildPostListUrl(baseUrl, pageNumber));
}
