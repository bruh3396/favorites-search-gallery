import { buildTagAPIURL } from "../url/api_url_builder";
import { fetchHtml } from "../http/http_client";
import { tagLimiter } from "./rate_limiter";

export function fetchTagFromAPI(tagName: string, signal?: AbortController): Promise<string> {
  return tagLimiter.run(() => {
    return fetchHtml(buildTagAPIURL(tagName), signal);
  });
}
