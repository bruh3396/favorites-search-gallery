import { TagCategory, TagCategoryMap } from "@/types/search";
import { ApiClient } from "@/adapters/api/client/client";
import { PostFetchError } from "@/types/errors";
import { TagSource } from "@/core/boundary/ports";
import { decodeTagCategory } from "@/lib/domain/tag/category_codec";
import { withTimeout } from "@/lib/async/scheduling";

const CATEGORIZE_TIMEOUT_MS = 10_000;

export class ApiTagSource implements TagSource {
  constructor(private readonly api: Pick<ApiClient, "fetchTag">, private readonly siteTags: TagSource) { }

  public async categorize(postId: string, tagNames: string[]): Promise<TagCategoryMap> {
    try {
      const categories = await withTimeout(Promise.all(tagNames.map(tagName => this.fetch(tagName))), CATEGORIZE_TIMEOUT_MS);
      return new Map(tagNames.map((tagName, index) => [tagName, categories[index] ?? "general"]));
    } catch {
      return this.siteTags.categorize(postId, tagNames);
    }
  }

  private async fetch(tagName: string): Promise<TagCategory> {
    const response = await this.api.fetchTag(tagName);

    if (response.status === "rate_limited") {
      throw new PostFetchError();
    }
    return decodeTagCategory(response.category);
  }
}
