import { RemoteSearchResults, SearchResultsPage } from "@/core/boundary/ports/remote_search_results/remote_search_results";
import { MemoryClient } from "@/adapters/memory/client/client";

export interface MemoryRemoteSearchResultsConfiguration {
  readonly pageSize: number;
  readonly initialPageIndex: number;
}

export class MemoryRemoteSearchResults implements RemoteSearchResults {
  private readonly pageSize: number;
  private readonly initialPage: SearchResultsPage;

  constructor(configuration: MemoryRemoteSearchResultsConfiguration, private readonly memory: Pick<MemoryClient, "readPosts">) {
    this.pageSize = configuration.pageSize;
    this.initialPage = this.readPage(configuration.initialPageIndex);
  }

  public readInitialPage(): SearchResultsPage {
    return this.initialPage;
  }

  public fetchPage(index: number): Promise<SearchResultsPage> {
    return Promise.resolve(index === this.initialPage.index ? this.initialPage : this.readPage(index));
  }

  private readPage(index: number): SearchResultsPage {
    const start = index * this.pageSize;
    return { index, posts: this.memory.readPosts().slice(start, start + this.pageSize) };
  }
}
