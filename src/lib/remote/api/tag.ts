import { EncodedTagCategory, TagResponse } from "@/types/api";
import { ApiConfig } from "@/config/api_config";
import { CoalescingResolver } from "@/lib/async/coalescing_resolver";
import { fetchApi } from "@/lib/remote/api/gateway";
import { tagLimiter } from "@/lib/remote/http/rate_limiters";
import { tagResponseToTagCategory } from "@/lib/remote/parsers/tag";

const fetchCoalescer = new CoalescingResolver<TagResponse>(ApiConfig.apiBatchSize, ApiConfig.apiBatchFlushDelay, fetchTagCategories);

export function fetchTagCategory(tagName: string): Promise<EncodedTagCategory> {
  return fetchCoalescer.resolve(tagName).then(tagResponseToTagCategory);
}

function fetchTagCategories(tagNames: string[]): Promise<Record<string, TagResponse>> {
  return tagLimiter.run(() => fetchApi("tag", { tagNames }).then(r => r.json() as Promise<Record<string, TagResponse>>));
}
