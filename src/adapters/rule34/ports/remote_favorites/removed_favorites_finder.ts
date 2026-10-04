import { Post } from "@/core/domain/post/post";
import { Scheduler } from "@/core/boundary/ports/scheduler/scheduler";

export interface Rule34RemovedFavoritesFinderConfiguration {
  pageSize: number;
  fetchDelay: number;
}

export interface Rule34RemovedFavoritesFinderDependencies {
  fetch: (pageIndex: number) => Promise<Post[]>;
  scheduler: Pick<Scheduler, "sleep">;
}

interface LocalList {
  ids: readonly string[];
  indexById: ReadonlyMap<string, number>;
  remoteStart: number;
}

interface RemotePage {
  index: number;
  ids: string[];
}

interface Checkpoint {
  page: RemotePage;
  localIndex: number;
  removedAbove: number;
}

export class Rule34RemovedFavoritesFinder {
  constructor(
    private readonly configuration: Rule34RemovedFavoritesFinderConfiguration,
    private readonly dependencies: Rule34RemovedFavoritesFinderDependencies
  ) { }

  public async findRemoved(localIds: readonly string[], remoteStart: number): Promise<string[]> {
    if (localIds.length === 0) {
      return [];
    }
    const localList = { ids: localIds, indexById: new Map(localIds.map((id, index) => [id, index])), remoteStart };
    const localListStart = this.createLocalListStart(localList);
    const remoteEnd = this.createCheckpoint(localList, await this.fetchLastNonEmptyPage(this.calculatePageIndex(remoteStart + localIds.length - 1)));
    const removedBeforeRemoteEnd = await this.findRemovedBetween(localList, localListStart, remoteEnd);
    const removedAfterRemoteEnd = localIds.slice(remoteEnd.localIndex + 1);
    return [...removedBeforeRemoteEnd, ...removedAfterRemoteEnd];
  }

  private async findRemovedBetween(localList: LocalList, top: Checkpoint, bottom: Checkpoint): Promise<string[]> {
    if (top.removedAbove === bottom.removedAbove) {
      return [];
    }

    if (bottom.page.index === top.page.index + 1) {
      return localList.ids.slice(top.localIndex + 1, bottom.localIndex + 1).filter(id => !bottom.page.ids.includes(id));
    }
    const middle = this.createCheckpoint(localList, await this.fetchPageAfterDelay(Math.floor((top.page.index + bottom.page.index) / 2)));
    return [...await this.findRemovedBetween(localList, top, middle), ...await this.findRemovedBetween(localList, middle, bottom)];
  }

  private createLocalListStart(localList: LocalList): Checkpoint {
    return { page: { index: this.calculatePageIndex(localList.remoteStart) - 1, ids: [] }, localIndex: -1, removedAbove: 0 };
  }

  private createCheckpoint(localList: LocalList, page: RemotePage): Checkpoint {
    const lastId = page.ids.at(-1);
    const localIndex = lastId === undefined ? undefined : localList.indexById.get(lastId);

    if (localIndex === undefined) {
      return { page, localIndex: -1, removedAbove: 0 };
    }
    const remoteIndex = this.calculateRemoteIndex(page, page.ids.length - 1);
    return { page, localIndex, removedAbove: localList.remoteStart + localIndex - remoteIndex };
  }

  private calculatePageIndex(remoteIndex: number): number {
    return Math.floor(remoteIndex / this.configuration.pageSize);
  }

  private calculateRemoteIndex(page: RemotePage, indexOnPage: number): number {
    return (page.index * this.configuration.pageSize) + indexOnPage;
  }

  private async fetchLastNonEmptyPage(pageIndex: number): Promise<RemotePage> {
    return this.stepBackPastEmptyPages(await this.fetchPage(pageIndex));
  }

  private async stepBackPastEmptyPages(page: RemotePage): Promise<RemotePage> {
    if (page.ids.length === 0 && page.index > 0) {
      return this.stepBackPastEmptyPages(await this.fetchPageAfterDelay(page.index - 1));
    }
    return page;
  }

  private async fetchPageAfterDelay(index: number): Promise<RemotePage> {
    await this.dependencies.scheduler.sleep(this.configuration.fetchDelay);
    return this.fetchPage(index);
  }

  private async fetchPage(index: number): Promise<RemotePage> {
    const posts = await this.dependencies.fetch(index);
    return { index, ids: posts.map(post => post.id) };
  }
}
