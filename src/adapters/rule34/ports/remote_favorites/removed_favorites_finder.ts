import { Post } from "@/core/domain/post/post";
import { Scheduler } from "@/core/boundary/ports/scheduler";

export interface Rule34RemovedFavoritesFinderConfiguration {
  pageSize: number;
  fetchDelay: number;
}

export interface Rule34RemovedFavoritesFinderDependencies {
  fetch: (pageIndex: number) => Promise<Post[]>;
  scheduler: Pick<Scheduler, "sleep">;
}

export class Rule34RemovedFavoritesFinder {
  constructor(
    private readonly configuration: Rule34RemovedFavoritesFinderConfiguration,
    private readonly dependencies: Rule34RemovedFavoritesFinderDependencies
  ) { }

  public async findRemoved(localIds: readonly string[], firstLocalIndex: number): Promise<string[]> {
    if (localIds.length === 0) {
      return [];
    }
    const { pageSize } = this.configuration;
    const lastRemotePageIndex = Math.ceil((firstLocalIndex + localIds.length) / pageSize) - 1;
    const lastRemotePagePosts = await this.dependencies.fetch(lastRemotePageIndex);
    const localCountOnRemote = lastRemotePageIndex * pageSize + lastRemotePagePosts.length - firstLocalIndex;

    if (localCountOnRemote === localIds.length) {
      return [];
    }
    const firstRemotePageIds = new Set((await this.dependencies.fetch(0)).map(post => post.id));
    return localIds.slice(0, pageSize - firstLocalIndex).filter(id => !firstRemotePageIds.has(id));
  }
}
