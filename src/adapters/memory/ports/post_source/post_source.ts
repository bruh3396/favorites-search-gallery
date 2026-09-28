import { PostSource } from "@/core/boundary/ports/post_source";
import { CategorizedPost } from "@/core/domain/post/post";
import { MemoryClient } from "@/adapters/memory/client/client";

export class MemoryPostSource implements PostSource {
  constructor(private readonly memory: Pick<MemoryClient, "readPost">) { }

  public fetchPost(id: string): Promise<CategorizedPost> {
    const post = this.memory.readPost(id);
    return post === undefined ? Promise.reject(new Error(`MemoryPostSource: no post ${id}`)) : Promise.resolve({ post, tagCategories: new Map() });
  }
}
