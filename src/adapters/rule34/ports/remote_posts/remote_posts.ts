import { CategorizedPost, Post } from "@/core/domain/post/post";
import { RemotePosts } from "@/core/boundary/ports/remote_posts";
import { Rule34SiteClient } from "@/adapters/rule34/client/site/client";

export class Rule34RemotePosts implements RemotePosts {
  constructor(private readonly rule34: Pick<Rule34SiteClient, "fetchPostPage">) { }

  public fetch(post: Pick<Post, "id">): Promise<CategorizedPost> {
    return this.rule34.fetchPostPage(post.id);
  }
}
