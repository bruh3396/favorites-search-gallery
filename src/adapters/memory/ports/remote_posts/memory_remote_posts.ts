import { CategorizedPost } from "@/core/domain/post/categorized_post";
import { MemoryClient } from "@/adapters/memory/client/memory_client";
import { Post } from "@/core/domain/post/post";
import { PostPurgedError } from "@/core/boundary/ports/remote_posts/post_purged_error";
import { RemotePosts } from "@/core/boundary/ports/remote_posts/remote_posts";

export class MemoryRemotePosts implements RemotePosts {
  constructor(private readonly memoryClient: Pick<MemoryClient, "readPost">) { }

  public fetch({ id }: Pick<Post, "id">): Promise<CategorizedPost> {
    const post = this.memoryClient.readPost(id);
    return post === undefined ? Promise.reject(new PostPurgedError(id)) : Promise.resolve({ post, tagCategories: new Map() });
  }
}
