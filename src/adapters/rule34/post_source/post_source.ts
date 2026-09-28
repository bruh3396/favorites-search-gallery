import { ParsedPost, PostSource } from "@/core/boundary/ports";
import { Rule34Client } from "@/adapters/rule34/client/client";

export class Rule34PostSource implements PostSource {
  constructor(private readonly site: Pick<Rule34Client, "fetchPostPage">) { }

  public fetch(id: string): Promise<ParsedPost> {
    return this.site.fetchPostPage(id);
  }
}
