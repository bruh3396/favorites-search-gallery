import { TagResponse } from "@/adapters/api/client/responses";
import { AbstractApiFetcher } from "@/adapters/api/client/abstract_api_fetcher";
import { ApiConfig } from "@/adapters/api/client/api_config";
import { PostFetchError } from "@/types/errors";
import { TagCategory } from "@/types/search";
import { decodeTagCategory } from "@/lib/domain/tag/category_codec";

export class ApiTagSource extends AbstractApiFetcher<TagResponse> {
  constructor() {
    super(ApiConfig.tagRateLimit, "tag", "tagNames");
  }

  public async fetch(tagName: string): Promise<TagCategory> {
    const response = await this.schedule(tagName);

    if (response.status === "rate_limited") {
      throw new PostFetchError();
    }
    return decodeTagCategory(response.category);
  }
}

export const ApiTags = new ApiTagSource();
