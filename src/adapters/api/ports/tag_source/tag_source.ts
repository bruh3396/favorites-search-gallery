import { TagCategory, TagCategoryMap } from "@/core/domain/tag/tag";
import { ApiClient } from "@/adapters/api/client/client";
import { PostFetchError } from "@/types/errors";
import { TagSource } from "@/core/boundary/ports/tag_source";
import { decodeTagCategory } from "@/lib/domain/tag/category_codec";
import { withTimeout } from "@/lib/async/scheduling";

const FETCH_CATEGORIES_TIMEOUT_MS = 10_000;

export class ApiTagSource implements TagSource {
  constructor(private readonly api: Pick<ApiClient, "fetchTag">) { }

  public async fetchCategories(tagNames: string[]): Promise<TagCategoryMap> {
    return new Map(await withTimeout(Promise.all(tagNames.map(tagName => this.entry(tagName))), FETCH_CATEGORIES_TIMEOUT_MS));
  }

  private async entry(tagName: string): Promise<[string, TagCategory]> {
    const response = await this.api.fetchTag(tagName);

    if (response.status === "rate_limited") {
      throw new PostFetchError();
    }
    return [tagName, decodeTagCategory(response.category)];
  }
}
