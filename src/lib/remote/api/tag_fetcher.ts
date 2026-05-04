import { CoalescingResolver } from "../../core/concurrency/coalescing_resolver";
import { TAG_API_URL } from "../url/api_url_builder";
import { Tag } from "../../../types/api";
import { fetchFromServer } from "./server_client";
import { tagLimiter } from "../http/rate_limiter";

const tagFetcher = new CoalescingResolver<Tag>(50, 2000, tagLimiter, fetchTagBatch);

function fetchTagBatch(tagNames: string[]): Promise<Record<string, Tag>> {
  return fetchFromServer(TAG_API_URL, { tagNames }).then(r => r.json() as Promise<Record<string, Tag>>);
}

export function fetchTagFromAPI(tagName: string): Promise<Tag> {
  return tagFetcher.resolve(tagName);
}
