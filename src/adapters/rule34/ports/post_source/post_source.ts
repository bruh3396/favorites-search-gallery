import { PostSource } from "@/core/boundary/ports/post_source";
import { CategorizedPost } from "@/core/domain/post/post";
import { Rule34SiteClient } from "@/adapters/rule34/client/site/client";

export class Rule34PostSource implements PostSource {
  constructor(private readonly rule34: Pick<Rule34SiteClient, "fetchPostPage">) { }

  public fetchPost(id: string): Promise<CategorizedPost> {
    return this.rule34.fetchPostPage(id);
  }
}
