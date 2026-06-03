import { EncodedTagCategory, TagResponse } from "../../../types/api";
import { ApiConfig } from "../../../config/api_config";
import { CoalescingResolver } from "../../async/coalescing_resolver";
import { TAG_API_URL } from "../url/api_urls";
import { fetchJsonFromApi } from "./api_client";
import { tagLimiter } from "../http/rate_limiters";
import { tagResponseToTagCategory } from "../parsers/api_tag_parser";

const fetchCoalescer = new CoalescingResolver<TagResponse>(ApiConfig.apiBatchSize, ApiConfig.apiBatchFlushDelay, fetchTagBatch);

// FIXME: tag API is unreliable; temporarily hardcoding categories instead of fetching. Restore the real fetch below when the API is stable.
const USE_HARDCODED_TAG_CATEGORIES = true;
const hardcodedMetadataTags = new Set(["video", "gif", "3d"]);

export function fetchTagCategory(tagName: string): Promise<EncodedTagCategory> {
  if (USE_HARDCODED_TAG_CATEGORIES) {
    return Promise.resolve(hardcodedMetadataTags.has(tagName) ? 5 : 0);
  }
  return fetchCoalescer.resolve(tagName).then(tagResponseToTagCategory);
}

function fetchTagBatch(tagNames: string[]): Promise<Record<string, TagResponse>> {
  return tagLimiter.run(() => fetchJsonFromApi(TAG_API_URL, { tagNames }));
}
