import { ApiConfig } from "@/config/api_config";
import { CoalescingResolver } from "@/lib/async/coalescing";
import { EncodedTagCategory } from "@/types/search";
import { PostFetchError } from "@/types/errors";
import { TagResponse } from "@/types/api";
import { fetchApi } from "@/lib/remote/api/gateway";
import { tagLimiter } from "@/lib/remote/http/rate_limiters";

const tagResolver = new CoalescingResolver<string, TagResponse>(ApiConfig.coalesceSize, ApiConfig.flushTimeout, fetchTagCategories);

export function fetchTagCategory(tagName: string): Promise<EncodedTagCategory> {
  return tagResolver.schedule(tagName).then((response) => {
    if (response.status === "rate_limited") {
      throw new PostFetchError();
    }
    return response.category;
  });
}

function fetchTagCategories(tagNames: string[]): Promise<Map<string, TagResponse>> {
  return tagLimiter.run(() => fetchApi("tag", { tagNames })
    .then(response => response.json() as Promise<Record<string, TagResponse>>)
    .then(record => new Map(Object.entries(record))));
}
