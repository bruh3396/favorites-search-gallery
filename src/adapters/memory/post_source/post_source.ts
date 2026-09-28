import { ParsedPost, PostSource } from "@/core/boundary/ports";
import { MemoryClient } from "@/adapters/memory/client/client";

export class MemoryPostSource implements PostSource {
  constructor(private readonly memory: Pick<MemoryClient, "readPost">) { }

  public fetch(id: string): Promise<ParsedPost> {
    const post = this.memory.readPost(id);
    return post === undefined ? Promise.reject(new Error(`MemoryPostSource: no post ${id}`)) : Promise.resolve({ post, tagCategories: new Map() });
  }
}
