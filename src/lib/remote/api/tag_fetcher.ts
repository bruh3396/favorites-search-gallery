import { CoalescingResolver } from "../../core/concurrency/coalescing_resolver";
import { ApiConfig } from "../../../config/api_config";
import { TAG_API_URL } from "../url/api_urls";
import { Tag } from "../../../types/api";
import { fetchFromServer } from "./server_client";
import { tagLimiter } from "../http/rate_limiter";

const fetchCoalescer = new CoalescingResolver<Tag>(ApiConfig.apiBatchSize, ApiConfig.apiBatchFlushDelay, fetchTagBatch);

function fetchTagBatch(tagNames: string[]): Promise<Record<string, Tag>> {
  return tagLimiter.run(() => fetchFromServer(TAG_API_URL, { tagNames }));
}

export function fetchTagFromAPI(tagName: string): Promise<Tag> {
  return fetchCoalescer.resolve(tagName);
}
