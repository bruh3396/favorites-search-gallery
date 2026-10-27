import { MemoryClient } from "@/adapters/memory/client/memory_client";
import { RemotePages } from "@/core/boundary/ports/remote_pages/remote_pages";

export class MemoryRemotePages implements RemotePages {
  constructor(private readonly memory: Pick<MemoryClient, "readPost">) { }

  public postUrl(postId: string): string {
    return `#post-${postId}`;
  }

  public searchUrl(query: string): string {
    return `#search-${encodeURIComponent(query)}`;
  }

  public postExists(postId: string): Promise<boolean> {
    return Promise.resolve(this.memory.readPost(postId) !== undefined);
  }
}
