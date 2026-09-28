import { Rule34SiteClient } from "@/adapters/rule34/client/site/client";
import { TagCategoryMap } from "@/types/search";
import { TagSource } from "@/core/boundary/ports/tag_source";

export class Rule34TagSource implements TagSource {
  constructor(private readonly rule34: Pick<Rule34SiteClient, "fetchPostPageTagCategories">) { }

  public async categorize(postId: string, tagNames: string[]): Promise<TagCategoryMap> {
    const pageCategories = await this.rule34.fetchPostPageTagCategories(postId);
    return new Map(tagNames.map(tagName => [tagName, pageCategories.get(tagName) ?? "general"]));
  }
}
