import { Post } from "@/core/domain/post/post";
import { PostSource, ParsedPost } from "@/core/boundary/ports";

export class MemoryPostSource implements PostSource {
  private readonly postsById: Map<string, Post>;

  constructor(posts: Post[]) {
    this.postsById = new Map(posts.map(post => [post.id, post]));
  }

  public fetch(id: string): Promise<ParsedPost> {
    const post = this.postsById.get(id);
    return post === undefined ? Promise.reject(new Error(`MemoryPostSource: no post ${id}`)) : Promise.resolve({ post, tagCategories: new Map() });
  }
}
