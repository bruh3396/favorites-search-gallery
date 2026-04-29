import { TAG_LIMITER } from "./rate_limiter";
import { buildTagAPIURL } from "../url/api_url_builder";
import { fetchHtml } from "../http/http_client";

export function fetchTagFromAPI(tagName: string, signal?: AbortController): Promise<string> {
  return TAG_LIMITER.run(() => {
    return fetchHtml(buildTagAPIURL(tagName), signal);
  });
}
