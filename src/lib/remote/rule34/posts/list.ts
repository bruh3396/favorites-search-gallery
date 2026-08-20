import { buildPostListUrl } from "@/lib/remote/url";
import { fetchHtml } from "@/lib/remote/http/client";
import { generalPageRequestLimiter } from "@/lib/remote/http/rate_limiters";

export function fetchPostList(baseUrl: string, pageNumber: number): Promise<string> {
  return generalPageRequestLimiter.run(() => fetchHtml(buildPostListUrl(baseUrl, pageNumber)));
}
