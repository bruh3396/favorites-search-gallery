import { EncodedTagCategory, TagResponse } from "@/types/api";
import { ApiConfig } from "@/config/api_config";
import { CoalescingResolver } from "@/lib/async/coalescing_resolver";
import { fetchApi } from "@/lib/remote/api/gateway";
import { tagLimiter } from "@/lib/remote/http/rate_limiters";
import { tagResponseToTagCategory } from "@/lib/remote/parsers/tag";

const tagResolver = new CoalescingResolver<string, TagResponse>(ApiConfig.maxRequests, ApiConfig.requestFlushTimeout, fetchTagCategories);

export function fetchTagCategory(tagName: string): Promise<EncodedTagCategory> {
  return tagResolver.schedule(tagName).then(tagResponseToTagCategory);
}

function fetchTagCategories(tagNames: string[]): Promise<Map<string, TagResponse>> {
  return tagLimiter.run(() => fetchApi("tag", { tagNames })
    .then(response => response.json() as Promise<Record<string, TagResponse>>)
    .then(record => new Map(Object.entries(record))));
}
