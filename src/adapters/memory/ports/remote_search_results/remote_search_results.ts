import { MemoryClient } from "@/adapters/memory/client/client";
import { Post } from "@/core/domain/post/post";
import { RemoteSearchResults } from "@/core/boundary/ports/remote_search_results";

export interface MemoryRemoteSearchResultsConfiguration {
  pageSize: number;
  initialPageIndex: number;
}

export class MemoryRemoteSearchResults implements RemoteSearchResults {
  public readonly pageSize: number;
  public readonly initialPageIndex: number;

  constructor(configuration: MemoryRemoteSearchResultsConfiguration, private readonly memory: Pick<MemoryClient, "readPosts">) {
    this.pageSize = configuration.pageSize;
    this.initialPageIndex = configuration.initialPageIndex;
  }

  public fetchPage(pageIndex: number): Promise<Post[]> {
    const start = pageIndex * this.pageSize;
    return Promise.resolve(this.memory.readPosts().slice(start, start + this.pageSize));
  }
}
