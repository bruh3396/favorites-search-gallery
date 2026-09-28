import { Rule34Client } from "@/adapters/rule34/client/client";
import { TagCategoryMap } from "@/types/search";
import { TagSource } from "@/core/boundary/ports";

export class Rule34TagSource implements TagSource {
  constructor(private readonly site: Pick<Rule34Client, "fetchPostPageTagCategories">) { }

  public async categorize(postId: string, tagNames: string[]): Promise<TagCategoryMap> {
    const pageCategories = await this.site.fetchPostPageTagCategories(postId);
    return new Map(tagNames.map(tagName => [tagName, pageCategories.get(tagName) ?? "general"]));
  }
}
