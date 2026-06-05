import { EncodedTagCategory, TagResponse } from "@/types/api";
import { ApiConfig } from "@/config/api_config";
import { CoalescingResolver } from "@/lib/async/coalescing_resolver";
import { TAG_API_URL } from "@/lib/remote/url/api_urls";
import { fetchApiJson } from "@/lib/remote/api/gateway";
import { tagLimiter } from "@/lib/remote/http/rate_limiters";
import { tagResponseToTagCategory } from "@/lib/remote/parsers/api_tag_parser";

const fetchCoalescer = new CoalescingResolver<TagResponse>(ApiConfig.apiBatchSize, ApiConfig.apiBatchFlushDelay, fetchTagBatch);

export function fetchTagCategory(tagName: string): Promise<EncodedTagCategory> {
  return fetchCoalescer.resolve(tagName).then(tagResponseToTagCategory);
}

function fetchTagBatch(tagNames: string[]): Promise<Record<string, TagResponse>> {
  return tagLimiter.run(() => fetchApiJson(TAG_API_URL, { tagNames }));
}
