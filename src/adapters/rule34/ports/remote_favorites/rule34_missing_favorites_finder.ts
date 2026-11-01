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
  readonly remotePage: RemotePage;
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
    const localListStartCheckpoint = this.createLocalListStart(localList);
    const remoteEndCheckpoint = this.createCheckpoint(localList, await this.fetchLastNonEmptyPage(this.calculatePageIndex(remoteStart + localPostIds.length - 1)));
    const removedBeforeRemoteEnd = await this.findMissingBetween(localList, localListStartCheckpoint, remoteEndCheckpoint);
    const removedAfterRemoteEnd = localPostIds.slice(remoteEndCheckpoint.localIndex + 1);
    return [...removedBeforeRemoteEnd, ...removedAfterRemoteEnd];
  }

  private async findMissingBetween(localList: LocalList, topCheckpoint: Checkpoint, bottomCheckpoint: Checkpoint): Promise<string[]> {
    if (topCheckpoint.removedAbove === bottomCheckpoint.removedAbove) {
      return [];
    }

    if (bottomCheckpoint.remotePage.index === topCheckpoint.remotePage.index + 1) {
      return localList.postIds.slice(topCheckpoint.localIndex + 1, bottomCheckpoint.localIndex + 1).filter(id => !bottomCheckpoint.remotePage.postIds.includes(id));
    }
    const middleCheckpoint = this.createCheckpoint(localList, await this.fetchPageAfterDelay(Math.floor((topCheckpoint.remotePage.index + bottomCheckpoint.remotePage.index) / 2)));
    return [...await this.findMissingBetween(localList, topCheckpoint, middleCheckpoint), ...await this.findMissingBetween(localList, middleCheckpoint, bottomCheckpoint)];
  }

  private createLocalListStart(localList: LocalList): Checkpoint {
    return { remotePage: { index: this.calculatePageIndex(localList.remoteStart) - 1, postIds: [] }, localIndex: -1, removedAbove: 0 };
  }

  private createCheckpoint(localList: LocalList, remotePage: RemotePage): Checkpoint {
    const lastPostId = remotePage.postIds.at(-1);
    const localIndex = lastPostId === undefined ? undefined : localList.indexByPostId.get(lastPostId);

    if (localIndex === undefined) {
      return { remotePage, localIndex: -1, removedAbove: 0 };
    }
    const remoteIndex = this.calculateRemoteIndex(remotePage, remotePage.postIds.length - 1);
    return { remotePage, localIndex, removedAbove: localList.remoteStart + localIndex - remoteIndex };
  }

  private calculatePageIndex(remoteIndex: number): number {
    return Math.floor(remoteIndex / this.configuration.pageSize);
  }

  private calculateRemoteIndex(remotePage: RemotePage, indexOnPage: number): number {
    return (remotePage.index * this.configuration.pageSize) + indexOnPage;
  }

  private async fetchLastNonEmptyPage(pageIndex: number): Promise<RemotePage> {
    return this.stepBackPastEmptyPages(await this.fetchPage(pageIndex));
  }

  private async stepBackPastEmptyPages(remotePage: RemotePage): Promise<RemotePage> {
    if (remotePage.postIds.length === 0 && remotePage.index > 0) {
      return this.stepBackPastEmptyPages(await this.fetchPageAfterDelay(remotePage.index - 1));
    }
    return remotePage;
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
