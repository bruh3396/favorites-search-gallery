import { TagCategory, TagCategoryMap } from "@/core/domain/tag/tag";
import { FrozenCobaltClient } from "@/adapters/frozen_cobalt/client/client";
import { FrozenCobaltError } from "@/adapters/frozen_cobalt/client/error";
import { RemoteTagCategories } from "@/core/boundary/ports/remote_tag_categories/remote_tag_categories";
import { decodeTagCategory } from "@/adapters/frozen_cobalt/client/decoder";

export class FrozenCobaltRemoteTagCategories implements RemoteTagCategories {
  constructor(private readonly frozenCobalt: Pick<FrozenCobaltClient, "fetchTagCategory">) { }

  public async fetch(tagNames: string[]): Promise<TagCategoryMap> {
    const settled = await Promise.allSettled(tagNames.map(tagName => this.fetchCategory(tagName)));
    return new Map(settled.flatMap(result => (result.status === "fulfilled" ? [result.value] : [])));
  }

  private async fetchCategory(tagName: string): Promise<[string, TagCategory]> {
    const result = await this.frozenCobalt.fetchTagCategory(tagName);

    if (result.status === "rate_limited") {
      throw new FrozenCobaltError("rate_limited", { subject: tagName });
    }
    return [tagName, decodeTagCategory(result.category)];
  }
}
