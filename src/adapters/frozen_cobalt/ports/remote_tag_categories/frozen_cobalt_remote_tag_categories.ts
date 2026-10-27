import { FrozenCobaltClient } from "@/adapters/frozen_cobalt/client/frozen_cobalt_client";
import { FrozenCobaltError } from "@/adapters/frozen_cobalt/client/frozen_cobalt_error";
import { RemoteTagCategories } from "@/core/boundary/ports/remote_tag_categories/remote_tag_categories";
import { TagCategory } from "@/core/domain/tag_category/tag_category";
import { decodeFrozenCobaltTagCategory } from "@/adapters/frozen_cobalt/client/frozen_cobalt_decoder";

export class FrozenCobaltRemoteTagCategories implements RemoteTagCategories {
  constructor(private readonly frozenCobalt: Pick<FrozenCobaltClient, "fetchTagCategory">) { }

  public async fetch(tagNames: readonly string[]): Promise<ReadonlyMap<string, TagCategory>> {
    const settled = await Promise.allSettled(tagNames.map(tagName => this.fetchCategory(tagName)));
    return new Map(settled.flatMap(result => (result.status === "fulfilled" ? [result.value] : [])));
  }

  private async fetchCategory(tagName: string): Promise<[string, TagCategory]> {
    const result = await this.frozenCobalt.fetchTagCategory(tagName);

    if (result.status === "rate_limited") {
      throw new FrozenCobaltError("rate_limited", { subject: tagName });
    }
    return [tagName, decodeFrozenCobaltTagCategory(result.category)];
  }
}
