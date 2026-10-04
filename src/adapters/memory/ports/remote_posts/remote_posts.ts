import { CategorizedPost, Post } from "@/core/domain/post/post";
import { MemoryClient } from "@/adapters/memory/client/client";
import { RemotePosts } from "@/core/boundary/ports/remote_posts/remote_posts";

export class MemoryRemotePosts implements RemotePosts {
  constructor(private readonly memory: Pick<MemoryClient, "readPost">) { }

  public fetch({ id }: Pick<Post, "id">): Promise<CategorizedPost> {
    const post = this.memory.readPost(id);
    return post === undefined ? Promise.reject(new Error(`MemoryRemotePosts: no post ${id}`)) : Promise.resolve({ post, tagCategories: new Map() });
  }
}
