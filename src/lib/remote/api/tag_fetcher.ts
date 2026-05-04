import { TAG_API_URL, buildLegacyTagURL } from "../url/api_url_builder";
import { Tag } from "../../../types/api";
import { fetchHtml } from "../http/http_client";
import { postToServer } from "./server_client";
import { tagLimiter } from "../http/rate_limiter";

export function fetchTagFromAPI(tagName: string, _abort?: unknown): Promise<Tag> {
  return postToServer(TAG_API_URL, { tagName }).then(response => response.json() as Promise<Tag>);
}

export function fetchRawTagXML(tagName: string, signal?: AbortController): Promise<string> {
  return tagLimiter.run(() => fetchHtml(buildLegacyTagURL(tagName), signal));
}
