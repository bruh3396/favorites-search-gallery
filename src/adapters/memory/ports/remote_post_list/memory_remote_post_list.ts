import { MemoryClient } from "@/adapters/memory/client/memory_client";
import { RemotePostList } from "@/core/boundary/ports/remote_post_list/remote_post_list";
import { PostListPage } from "@/core/domain/post_list/post_list_page";

export interface MemoryRemotePostListConfiguration {
  readonly pageSize: number;
  readonly initialPageIndex: number;
}

export class MemoryRemotePostList implements RemotePostList {
  private readonly pageSize: number;
  private readonly initialPage: PostListPage;

  constructor(configuration: MemoryRemotePostListConfiguration, private readonly memory: Pick<MemoryClient, "readPosts">) {
    this.pageSize = configuration.pageSize;
    this.initialPage = this.readPage(configuration.initialPageIndex);
  }

  public readInitialPage(): PostListPage {
    return this.initialPage;
  }

  public fetchPage(index: number): Promise<PostListPage> {
    return Promise.resolve(index === this.initialPage.index ? this.initialPage : this.readPage(index));
  }

  private readPage(index: number): PostListPage {
    const start = index * this.pageSize;
    return { index, posts: this.memory.readPosts().slice(start, start + this.pageSize) };
  }
}
