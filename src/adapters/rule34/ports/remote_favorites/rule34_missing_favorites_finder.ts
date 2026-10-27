import { Post } from "@/core/domain/post/post";
import { Scheduler } from "@/core/boundary/ports/scheduler/scheduler";

export interface Rule34MissingFavoritesFinderConfiguration {
  readonly pageSize: number;
  readonly fetchDelay: number;
}

export interface Rule34MissingFavoritesFinderDependencies {
  fetch: (pageIndex: number) => Promise<Post[]>;
  scheduler: Pick<Scheduler, "sleep">;
}

interface LocalList {
  readonly postIds: readonly string[];
  readonly indexByPostId: ReadonlyMap<string, number>;
  readonly remoteStart: number;
}

interface RemotePage {
  readonly index: number;
  readonly postIds: string[];
}

interface Checkpoint {
  readonly page: RemotePage;
  readonly localIndex: number;
  readonly removedAbove: number;
}

export class Rule34MissingFavoritesFinder {
  constructor(
    private readonly configuration: Rule34MissingFavoritesFinderConfiguration,
    private readonly dependencies: Rule34MissingFavoritesFinderDependencies
  ) { }

  public async findMissing(localPostIds: readonly string[], remoteStart: number): Promise<string[]> {
    if (localPostIds.length === 0) {
      return [];
    }
    const localList = { postIds: localPostIds, indexByPostId: new Map(localPostIds.map((id, index) => [id, index])), remoteStart };
    const localListStart = this.createLocalListStart(localList);
    const remoteEnd = this.createCheckpoint(localList, await this.fetchLastNonEmptyPage(this.calculatePageIndex(remoteStart + localPostIds.length - 1)));
    const removedBeforeRemoteEnd = await this.findMissingBetween(localList, localListStart, remoteEnd);
    const removedAfterRemoteEnd = localPostIds.slice(remoteEnd.localIndex + 1);
    return [...removedBeforeRemoteEnd, ...removedAfterRemoteEnd];
  }

  private async findMissingBetween(localList: LocalList, top: Checkpoint, bottom: Checkpoint): Promise<string[]> {
    if (top.removedAbove === bottom.removedAbove) {
      return [];
    }

    if (bottom.page.index === top.page.index + 1) {
      return localList.postIds.slice(top.localIndex + 1, bottom.localIndex + 1).filter(id => !bottom.page.postIds.includes(id));
    }
    const middle = this.createCheckpoint(localList, await this.fetchPageAfterDelay(Math.floor((top.page.index + bottom.page.index) / 2)));
    return [...await this.findMissingBetween(localList, top, middle), ...await this.findMissingBetween(localList, middle, bottom)];
  }

  private createLocalListStart(localList: LocalList): Checkpoint {
    return { page: { index: this.calculatePageIndex(localList.remoteStart) - 1, postIds: [] }, localIndex: -1, removedAbove: 0 };
  }

  private createCheckpoint(localList: LocalList, page: RemotePage): Checkpoint {
    const lastPostId = page.postIds.at(-1);
    const localIndex = lastPostId === undefined ? undefined : localList.indexByPostId.get(lastPostId);

    if (localIndex === undefined) {
      return { page, localIndex: -1, removedAbove: 0 };
    }
    const remoteIndex = this.calculateRemoteIndex(page, page.postIds.length - 1);
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
    if (page.postIds.length === 0 && page.index > 0) {
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
    return { index, postIds: posts.map(post => post.id) };
  }
}
