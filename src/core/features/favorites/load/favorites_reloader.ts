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

type FavoritesLoadStateListener = (favoritesLoadState: FavoritesLoadState) => void;

export interface FavoritesReloaderDependencies {
  localFavorites: Pick<LocalFavorites, "prepend" | "remove">;
  remoteFavorites: Pick<RemoteFavorites, "findNew" | "findMissing">;
  remotePages: Pick<RemotePages, "postExists">;
  favoritesCollection: Pick<FavoritesCollection, "append" | "prependAsNew" | "getAll">;
  favoritesSearchIndex: Pick<FavoritesSearchIndex, "rebuild">;
  postLibrary: Pick<PostLibrary, "stream" | "adopt" | "refresh" | "markPurged">;
  waitForPaint: () => Promise<void>;
}

export class FavoritesReloader {
  private readonly dependencies: FavoritesReloaderDependencies;

  constructor(dependencies: FavoritesReloaderDependencies) {
    this.dependencies = dependencies;
  }

  public async reload(localPostIds: readonly string[], onFavoritesLoadStateChange: FavoritesLoadStateListener): Promise<FavoritesLoadResult> {
    const { postLibrary } = this.dependencies;
    const restoredPosts = await this.restorePosts(localPostIds, onFavoritesLoadStateChange);
    const existingPostIds = restoredPosts.filter(post => post.status !== "purged").map(post => post.id);
    let newPosts: Post[] = [];

    onFavoritesLoadStateChange({ phase: "pulling" });

    try {
      newPosts = await this.pullNewPosts(existingPostIds);
    } finally {
      await this.rebuildSearchIndex(onFavoritesLoadStateChange);
      postLibrary.refresh([...newPosts, ...restoredPosts]).catch(console.error);
    }
    onFavoritesLoadStateChange({ phase: "checkingMissing" });
    const missingPosts = await this.findMissingPosts(existingPostIds, newPosts, restoredPosts);
    const unfavoritedCount = await this.resolveMissingPosts(missingPosts);
    return { newCount: newPosts.length, unfavoritedCount };
  }

  private async restorePosts(localPostIds: readonly string[], onFavoritesLoadStateChange: FavoritesLoadStateListener): Promise<Post[]> {
    const { favoritesCollection, postLibrary } = this.dependencies;
    const restoredPosts: Post[] = [];
    const reportProgress = (): void => onFavoritesLoadStateChange({
      phase: "restoring",
      loadedCount: restoredPosts.length,
      expectedCount: localPostIds.length
    });

    reportProgress();
    await postLibrary.stream(localPostIds, RESTORE_BATCH_SIZE, posts => {
      favoritesCollection.append(posts);
      restoredPosts.push(...posts);
      reportProgress();
    });
    return restoredPosts;
  }

  private async pullNewPosts(existingPostIds: readonly string[]): Promise<Post[]> {
    const { favoritesCollection, postLibrary, remoteFavorites, localFavorites } = this.dependencies;
    const remoteNewPosts = await remoteFavorites.findNew(existingPostIds);

    if (remoteNewPosts.length === 0) {
      return [];
    }
    const newPosts = await postLibrary.adopt(remoteNewPosts);

    favoritesCollection.prependAsNew(newPosts);
    await localFavorites.prepend(newPosts.map(post => post.id));
    return newPosts;
  }

  private async rebuildSearchIndex(onFavoritesLoadStateChange: FavoritesLoadStateListener): Promise<void> {
    const { favoritesCollection, favoritesSearchIndex, waitForPaint } = this.dependencies;

    onFavoritesLoadStateChange({ phase: "indexing" });
    await waitForPaint();
    favoritesSearchIndex.rebuild(favoritesCollection.getAll());
  }

  private async findMissingPosts(existingPostIds: readonly string[], newPosts: readonly Post[], restoredPosts: readonly Post[]): Promise<Post[]> {
    const newPostIds = new Set(newPosts.map(post => post.id));
    const oldPostIds = existingPostIds.filter(postId => !newPostIds.has(postId));
    const missingPostIds = new Set(await this.dependencies.remoteFavorites.findMissing(oldPostIds, newPosts.length));
    return restoredPosts.filter(post => missingPostIds.has(post.id));
  }

  private async resolveMissingPosts(missingPosts: readonly Post[]): Promise<number> {
    const missingReasons = await Promise.all(missingPosts.map(post => this.resolveMissingPost(post)));
    return missingReasons.filter(missingReason => missingReason === "unfavorited").length;
  }

  private async resolveMissingPost(post: Post): Promise<MissingReason> {
    const { localFavorites, postLibrary } = this.dependencies;
    const missingReason = await this.findMissingReason(post);

    if (missingReason === "purged") {
      await postLibrary.markPurged([post]);
    } else if (missingReason === "unfavorited") {
      await localFavorites.remove([post.id]);
    }
    return missingReason;
  }

  private findMissingReason(post: Post): Promise<MissingReason> {
    return this.dependencies.remotePages.postExists(post.id).then(
      (exists): MissingReason => (exists ? "unfavorited" : "purged"),
      (): MissingReason => "unknown"
    );
  }
}
