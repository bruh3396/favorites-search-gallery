import { FavoritesCollection } from "@/core/features/favorites/collection/favorites_collection";
import { FavoritesLoadResult } from "@/core/features/favorites/load/favorites_load_result";
import { FavoritesLoadState } from "@/core/features/favorites/load/favorites_load_state";
import { FavoritesSearchIndex } from "@/core/features/favorites/search/favorites_search_index";
import { LocalFavorites } from "@/core/boundary/ports/local_favorites/local_favorites";
import { Post } from "@/core/domain/post/post";
import { PostLibrary } from "@/core/features/favorites/load/post_library";
import { RemoteFavorites } from "@/core/boundary/ports/remote_favorites/remote_favorites";
import { RemotePages } from "@/core/boundary/ports/remote_pages/remote_pages";

const RESTORE_BATCH_SIZE = 1_000;

type MissingReason = "unfavorited" | "purged" | "unknown";

export interface FavoritesReloaderDependencies {
  localFavorites: LocalFavorites;
  remoteFavorites: Pick<RemoteFavorites, "findNew" | "findMissing">;
  remotePages: Pick<RemotePages, "postExists">;
  collection: Pick<FavoritesCollection, "append" | "prependAsNew" | "getAll">;
  index: Pick<FavoritesSearchIndex, "rebuild">;
  postLibrary: PostLibrary;
  waitForPaint: () => Promise<void>;
  report: (state: FavoritesLoadState) => void;
}

export class FavoritesReloader {
  private readonly dependencies: FavoritesReloaderDependencies;

  constructor(dependencies: FavoritesReloaderDependencies) {
    this.dependencies = dependencies;
  }

  public async reload(localPostIds: readonly string[]): Promise<FavoritesLoadResult> {
    const { localFavorites, postLibrary, report } = this.dependencies;
    const restoredPosts = await this.restorePosts(localPostIds);
    const existingPostIds = restoredPosts.filter(post => post.status !== "purged").map(post => post.id);
    let newPosts: Post[] = [];

    report({ phase: "pulling" });

    try {
      newPosts = await this.pullNewPosts(existingPostIds);
    } finally {
      await this.rebuildSearchIndex();
      postLibrary.refresh([...newPosts, ...restoredPosts]).catch(console.error);
    }
    report({ phase: "checkingMissing" });
    const missingPosts = await this.findMissingPosts(existingPostIds, newPosts, restoredPosts);
    const { unfavoritedPosts, purgedPosts } = await this.partitionMissingPosts(missingPosts);

    await postLibrary.markPurged(purgedPosts);
    await localFavorites.remove(unfavoritedPosts.map(post => post.id));
    return { newCount: newPosts.length, unfavoritedCount: unfavoritedPosts.length };
  }

  private async restorePosts(localPostIds: readonly string[]): Promise<Post[]> {
    const { collection, postLibrary, report } = this.dependencies;
    const restoredPosts: Post[] = [];
    const reportProgress = (): void => report({ phase: "restoring", loadedCount: restoredPosts.length, expectedCount: localPostIds.length });

    reportProgress();
    await postLibrary.stream(localPostIds, RESTORE_BATCH_SIZE, posts => {
      collection.append(posts);
      restoredPosts.push(...posts);
      reportProgress();
    });
    return restoredPosts;
  }

  private async pullNewPosts(existingPostIds: readonly string[]): Promise<Post[]> {
    const { collection, postLibrary, remoteFavorites, localFavorites } = this.dependencies;
    const remoteNewPosts = await remoteFavorites.findNew(existingPostIds);

    if (remoteNewPosts.length === 0) {
      return [];
    }
    const newPosts = await postLibrary.adopt(remoteNewPosts);

    collection.prependAsNew(newPosts);
    await localFavorites.prepend(newPosts.map(post => post.id));
    return newPosts;
  }

  private async rebuildSearchIndex(): Promise<void> {
    const { collection, index, report, waitForPaint } = this.dependencies;

    report({ phase: "indexing" });
    await waitForPaint();
    index.rebuild(collection.getAll());
  }

  private async findMissingPosts(existingPostIds: readonly string[], newPosts: readonly Post[], restoredPosts: readonly Post[]): Promise<Post[]> {
    const newPostIds = new Set(newPosts.map(post => post.id));
    const oldPostIds = existingPostIds.filter(postId => !newPostIds.has(postId));
    const missingPostIds = new Set(await this.dependencies.remoteFavorites.findMissing(oldPostIds, newPosts.length));
    return restoredPosts.filter(post => missingPostIds.has(post.id));
  }

  private async partitionMissingPosts(missingPosts: readonly Post[]): Promise<{ unfavoritedPosts: Post[]; purgedPosts: Post[]; unknownPosts: Post[] }> {
    const missingReasons = await Promise.all(missingPosts.map(post => this.findMissingReason(post)));
    const postsWithReason = (reason: MissingReason): Post[] => missingPosts.filter((_post, index) => missingReasons[index] === reason);
    return { unfavoritedPosts: postsWithReason("unfavorited"), purgedPosts: postsWithReason("purged"), unknownPosts: postsWithReason("unknown") };
  }

  private findMissingReason(post: Post): Promise<MissingReason> {
    return this.dependencies.remotePages.postExists(post.id).then(
      (exists): MissingReason => (exists ? "unfavorited" : "purged"),
      (): MissingReason => "unknown"
    );
  }
}
