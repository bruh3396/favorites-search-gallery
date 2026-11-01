import { FrozenCobaltClient } from "@/adapters/frozen_cobalt/client/frozen_cobalt_client";
import { FrozenCobaltError } from "@/adapters/frozen_cobalt/client/frozen_cobalt_error";
import { RemoteTagCategories } from "@/core/boundary/ports/remote_tag_categories/remote_tag_categories";
import { TagCategory } from "@/core/domain/tag_category/tag_category";
import { UnreachableError } from "@/core/utils/error/unreachable_error";

export class FrozenCobaltRemoteTagCategories implements RemoteTagCategories {
  constructor(private readonly frozenCobaltClient: Pick<FrozenCobaltClient, "fetchTagCategory">) { }

  public async fetch(tagNames: readonly string[]): Promise<ReadonlyMap<string, TagCategory>> {
    const settled = await Promise.allSettled(tagNames.map(tagName => this.fetchCategory(tagName)));
    return new Map(settled.flatMap(result => (result.status === "fulfilled" ? [result.value] : [])));
  }

  private async fetchCategory(tagName: string): Promise<[string, TagCategory]> {
    const frozenCobaltTagResult = await this.frozenCobaltClient.fetchTagCategory(tagName);

    switch (frozenCobaltTagResult.status) {
      case "ok":
        return [tagName, frozenCobaltTagResult.category];
      case "not_found":
        return [tagName, "general"];
      case "retry":
        throw new FrozenCobaltError("retry", { subject: tagName });
      default:
        throw new UnreachableError(frozenCobaltTagResult);
    }
  }
}
