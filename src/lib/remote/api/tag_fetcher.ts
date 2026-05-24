import { EncodedTagCategory, TagResponse } from "../../../types/api";
import { ApiConfig } from "../../../config/api_config";
import { CoalescingResolver } from "../../async/coalescing_resolver";
import { TAG_API_URL } from "../url/api_urls";
import { fetchJsonFromApi } from "./api_client";
import { tagLimiter } from "../http/rate_limiters";
import { tagResponseToTagCategory } from "../parsers/api_tag_parser";

const fetchCoalescer = new CoalescingResolver<TagResponse>(ApiConfig.apiBatchSize, ApiConfig.apiBatchFlushDelay, fetchTagBatch);

export function fetchTagCategoryFromApi(tagName: string): Promise<EncodedTagCategory> {
  return fetchCoalescer.resolve(tagName).then(tagResponseToTagCategory);
}

function fetchTagBatch(tagNames: string[]): Promise<Record<string, TagResponse>> {
  return tagLimiter.run(() => fetchJsonFromApi(TAG_API_URL, { tagNames }));
}
