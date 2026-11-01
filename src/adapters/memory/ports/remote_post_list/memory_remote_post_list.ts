import { MemoryClient } from "@/adapters/memory/client/memory_client";
import { PostListPage } from "@/core/domain/post_list/post_list_page";
import { RemotePostList } from "@/core/boundary/ports/remote_post_list/remote_post_list";

export interface MemoryRemotePostListConfiguration {
  readonly pageSize: number;
  readonly initialPageIndex: number;
}

export class MemoryRemotePostList implements RemotePostList {
  private readonly pageSize: number;
  private readonly initialPostListPage: PostListPage;

  constructor(configuration: MemoryRemotePostListConfiguration, private readonly memoryClient: Pick<MemoryClient, "readPosts">) {
    this.pageSize = configuration.pageSize;
    this.initialPostListPage = this.readPage(configuration.initialPageIndex);
  }

  public readInitialPage(): PostListPage {
    return this.initialPostListPage;
  }

  public fetchPage(index: number): Promise<PostListPage> {
    return Promise.resolve(index === this.initialPostListPage.index ? this.initialPostListPage : this.readPage(index));
  }

  private readPage(index: number): PostListPage {
    const start = index * this.pageSize;
    return { index, posts: this.memoryClient.readPosts().slice(start, start + this.pageSize) };
  }
}
