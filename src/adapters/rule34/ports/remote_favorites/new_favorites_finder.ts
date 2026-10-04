import { Post } from "@/core/domain/post/post";
import { Scheduler } from "@/core/boundary/ports/scheduler/scheduler";

export interface Rule34NewFavoritesFinderConfiguration {
  pageSize: number;
  minimumLocalRunLength: number;
  fetchDelay: number;
}

export interface Rule34NewFavoritesFinderDependencies {
  fetch: (pageIndex: number) => Promise<Post[]>;
  scheduler: Pick<Scheduler, "sleep">;
}

interface LocalRun {
  remoteStart: number;
  length: number;
}

export class Rule34NewFavoritesFinder {
  constructor(
    private readonly configuration: Rule34NewFavoritesFinderConfiguration,
    private readonly dependencies: Rule34NewFavoritesFinderDependencies
  ) { }

  public async findNew(localIds: readonly string[], firstPage?: Post[]): Promise<Post[]> {
    const localFavoriteIndexById = new Map(localIds.map((id, index) => [id, index]));
    const remoteFavorites: Post[] = [];
    let pageIndex = 0;
    let page = firstPage ?? await this.dependencies.fetch(pageIndex);

    remoteFavorites.push(...page);
    let localRun = this.findLocalRun(remoteFavorites, localFavoriteIndexById);

    while (localRun.length < this.configuration.minimumLocalRunLength && page.length >= this.configuration.pageSize) {
      pageIndex += 1;
      await this.dependencies.scheduler.sleep(this.configuration.fetchDelay);
      page = await this.dependencies.fetch(pageIndex);
      remoteFavorites.push(...page);
      localRun = this.findLocalRun(remoteFavorites, localFavoriteIndexById);
    }
    return remoteFavorites.slice(0, localRun.remoteStart);
  }

  private findLocalRun(remoteFavorites: readonly Post[], localFavoriteIndexById: ReadonlyMap<string, number>): LocalRun {
    let remoteStart = 0;
    let lastLocalIndex = -1;

    for (const [remoteIndex, post] of remoteFavorites.entries()) {
      const localIndex = localFavoriteIndexById.get(post.id);

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
    return { remoteStart, length: remoteFavorites.length - remoteStart };
  }
}
