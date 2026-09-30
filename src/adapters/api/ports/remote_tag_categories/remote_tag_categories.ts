import { TagCategory, TagCategoryMap } from "@/core/domain/tag/tag";
import { ApiClient } from "@/adapters/api/client/client";
import { PostFetchError } from "@/types/errors";
import { RemoteTagCategories } from "@/core/boundary/ports/remote_tag_categories";
import { decodeTagCategory } from "@/adapters/api/client/tag/decoder";
import { withTimeout } from "@/lib/async/scheduling";

const FETCH_CATEGORIES_TIMEOUT = 10_000;

export class ApiRemoteTagCategories implements RemoteTagCategories {
  constructor(private readonly api: Pick<ApiClient, "fetchTag">) { }

  public async fetch(tagNames: string[]): Promise<TagCategoryMap> {
    return new Map(await withTimeout(Promise.all(tagNames.map(tagName => this.entry(tagName))), FETCH_CATEGORIES_TIMEOUT));
  }

  private async entry(tagName: string): Promise<[string, TagCategory]> {
    const response = await this.api.fetchTag(tagName);

    if (response.status === "rate_limited") {
      throw new PostFetchError();
    }
    return [tagName, decodeTagCategory(response.category)];
  }
}
