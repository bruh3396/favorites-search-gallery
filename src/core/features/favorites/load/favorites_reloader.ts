import { FavoritesCollection } from "@/core/features/favorites/collection/favorites_collection";
import { FavoritesLoadResult } from "@/core/features/favorites/load/favorites_load_result";
import { FavoritesLoadState } from "@/core/features/favorites/load/favorites_load_state";
import { FavoritesSearchIndex } from "@/core/features/favorites/search/favorites_search_index";
import { LocalFavorites } from "@/core/boundary/ports/local_favorites/local_favorites";
import { Post } from "@/core/domain/post/post";
import { PostLibrary } from "@/core/features/favorites/load/post_library";
import { RemoteFavorites } from "@/core/boundary/ports/remote_favorites/remote_favorites";

const STREAM_BATCH_SIZE = 1_000;

export interface FavoritesReloaderDependencies {
  localFavorites: LocalFavorites;
  remoteFavorites: Pick<RemoteFavorites, "findNew" | "findMissing">;
  collection: Pick<FavoritesCollection, "append" | "prependAsNew" | "getAll">;
  searchIndex: Pick<FavoritesSearchIndex, "rebuild">;
  postLibrary: PostLibrary;
  waitForPaint: () => Promise<void>;
  report: (state: FavoritesLoadState) => void;
}

export class FavoritesReloader {
  private readonly dependencies: FavoritesReloaderDependencies;

  constructor(dependencies: FavoritesReloaderDependencies) {
    this.dependencies = dependencies;
  }

  public async reload(localIds: readonly string[]): Promise<FavoritesLoadResult> {
    const { collection, searchIndex, postLibrary, report, waitForPaint } = this.dependencies;
    const restored = await this.restorePosts(localIds);
    const purgedIds = new Set(restored.filter(post => post.status === "purged").map(post => post.id));
    let pulled: Post[] = [];

    report({ phase: "pulling" });

    try {
      pulled = await this.pullNewPosts(localIds.filter(id => !purgedIds.has(id)));
    } finally {
      report({ phase: "indexing" });
      await waitForPaint();
      searchIndex.rebuild(collection.getAll());
      postLibrary.refresh([...pulled, ...restored]).catch(console.error);
    }
    report({ phase: "pruning" });
    const removedCount = await this.pruneRemoved(pulled.length, restored, purgedIds);
    return { pulledCount: pulled.length, removedCount };
  }

  public async reload2(localPostIds: readonly string[]): Promise<FavoritesLoadResult> {
    const { localFavorites, postLibrary, report } = this.dependencies;
    const restoredPosts = await this.restorePosts(localPostIds);
    const existingPostIds = excludePurgedPosts(localPostIds, restoredPosts);
    let pulledPosts: Post[] = [];

    report({ phase: "pulling" });

    try {
      pulledPosts = await this.pullNewPosts(existingPostIds);
    } finally {
      await this.rebuildSearchIndex();
      postLibrary.refresh([...pulledPosts, ...restoredPosts]).catch(console.error);
    }
    report({ phase: "checkingMissing" });
    const missing = await this.findMissingPosts(existingPostIds, pulledPosts, restoredPosts);
    const { unfavoritedPosts, purgedPosts } = await this.partitionMissingPosts(missing);

    await postLibrary.markPurged(purged);
    await localFavorites.remove(unfavorited.map(post => post.id));
    return { pulledCount: pulledPosts.length, unfavoritedCount: unfavorited.length };
  }

  private async restorePosts(localIds: readonly string[]): Promise<Post[]> {
    const { collection, postLibrary, report } = this.dependencies;
    const restored: Post[] = [];
    const reportProgress = (): void => report({ phase: "restoring", loadedCount: restored.length, expectedCount: localIds.length });

    reportProgress();
    await postLibrary.stream(localIds, STREAM_BATCH_SIZE, posts => {
      collection.append(posts);
      restored.push(...posts);
      reportProgress();
    });
    return restored;
  }

  private async pullNewPosts(localIds: readonly string[]): Promise<Post[]> {
    const { collection, postLibrary, remoteFavorites, localFavorites } = this.dependencies;
    const pulled = await remoteFavorites.findNew(localIds);

    if (pulled.length === 0) {
      return [];
    }
    const adopted = await postLibrary.adopt(pulled);

    collection.prependAsNew(adopted);
    await localFavorites.prepend(adopted.map(post => post.id));
    return adopted;
  }

  private async rebuildSearchIndex(): Promise<void> {
    const { collection, searchIndex, report, waitForPaint } = this.dependencies;

    report({ phase: "indexing" });
    await waitForPaint();
    searchIndex.rebuild(collection.getAll());
  }

  private async findMissingPosts(existingPostIds: readonly string[], pulledPosts: readonly Post[], restoredPosts: readonly Post[]): Promise<Post[]> {
    const pulledPostIds = new Set(pulledPosts.map(post => post.id));
    const unpulledPostIds = existingPostIds.filter(id => !pulledPostIds.has(id));
    const missingPostIds = new Set(await this.dependencies.remoteFavorites.findMissing(unpulledPostIds, pulledPosts.length));
    return restoredPosts.filter(post => missingPostIds.has(post.id));
  }

  private async pruneRemoved(pulledCount: number, restored: readonly Post[], purgedIds: ReadonlySet<string>): Promise<number> {
    const { remoteFavorites, localFavorites, postLibrary } = this.dependencies;
    const idsBelowPulled = (await localFavorites.getAll()).slice(pulledCount).filter(id => !purgedIds.has(id));
    const removedIds = new Set(await remoteFavorites.findMissing(idsBelowPulled, pulledCount));
    const removedPosts = restored.filter(post => removedIds.has(post.id));
    const fates = await Promise.all(removedPosts.map(post => this.findRemovedFate(post)));
    const unfavorited = removedPosts.filter((_post, index) => fates[index] === "unfavorited");
    const purged = removedPosts.filter((_post, index) => fates[index] === "purged");

    await postLibrary.markPurged(purged);
    await localFavorites.remove(unfavorited.map(post => post.id));
    return unfavorited.length;
  }

  private findRemovedFate(post: Post): Promise<RemovedFate> {
    return this.dependencies.remotePosts.fetch(post).then(
      (): RemovedFate => "unfavorited",
      (error: unknown): RemovedFate => (error instanceof PostPurgedError ? "purged" : "unknown")
    );
  }
}

function excludePurgedPosts(localPostIds: readonly string[], restoredPosts: readonly Post[]): string[] {
  const purgedPostIds = new Set(restoredPosts.filter(post => post.status === "purged").map(post => post.id));
  return localPostIds.filter(id => !purgedPostIds.has(id));
}
