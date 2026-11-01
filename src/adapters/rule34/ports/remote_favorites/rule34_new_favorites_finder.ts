import { Post } from "@/core/domain/post/post";
import { Scheduler } from "@/core/boundary/ports/scheduler/scheduler";

export interface Rule34NewFavoritesFinderConfiguration {
  readonly pageSize: number;
  readonly minimumLocalRunLength: number;
  readonly fetchDelay: number;
}

export interface Rule34NewFavoritesFinderDependencies {
  fetch: (pageIndex: number) => Promise<Post[]>;
  scheduler: Pick<Scheduler, "sleep">;
}

interface LocalRun {
  readonly remoteStart: number;
  readonly length: number;
}

export class Rule34NewFavoritesFinder {
  constructor(
    private readonly configuration: Rule34NewFavoritesFinderConfiguration,
    private readonly dependencies: Rule34NewFavoritesFinderDependencies
  ) { }

  public async findNew(localPostIds: readonly string[], firstPagePosts?: Post[]): Promise<Post[]> {
    const localFavoriteIndexByPostId = new Map(localPostIds.map((id, index) => [id, index]));
    const remotePosts: Post[] = [];
    let pageIndex = 0;
    let pagePosts = firstPagePosts ?? await this.dependencies.fetch(pageIndex);

    remotePosts.push(...pagePosts);
    let localRun = this.findLocalRun(remotePosts, localFavoriteIndexByPostId);

    while (localRun.length < this.configuration.minimumLocalRunLength && pagePosts.length >= this.configuration.pageSize) {
      pageIndex += 1;
      await this.dependencies.scheduler.sleep(this.configuration.fetchDelay);
      pagePosts = await this.dependencies.fetch(pageIndex);
      remotePosts.push(...pagePosts);
      localRun = this.findLocalRun(remotePosts, localFavoriteIndexByPostId);
    }
    return remotePosts.slice(0, localRun.remoteStart);
  }

  private findLocalRun(remotePosts: readonly Post[], localFavoriteIndexByPostId: ReadonlyMap<string, number>): LocalRun {
    let remoteStart = 0;
    let lastLocalIndex = -1;

    for (const [remoteIndex, post] of remotePosts.entries()) {
      const localIndex = localFavoriteIndexByPostId.get(post.id);

      if (localIndex === undefined) {
        remoteStart = remoteIndex + 1;
        continue;
      }

      if (localIndex < lastLocalIndex) {
        remoteStart = remoteIndex;
      }
      lastLocalIndex = localIndex;
      const length = remoteIndex - remoteStart + 1;

      if (length >= this.configuration.minimumLocalRunLength) {
        return { remoteStart, length };
      }
    }
    return { remoteStart, length: remotePosts.length - remoteStart };
  }
}
