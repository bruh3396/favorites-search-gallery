import { LoadResult, LoadState } from "@/core/features/favorites/load/state";
import { FavoritesCollection } from "@/core/features/favorites/collection/collection";
import { FavoritesSearchIndex } from "@/core/features/favorites/search/index";
import { LocalFavorites } from "@/core/boundary/ports/local_favorites/local_favorites";
import { Post } from "@/core/domain/post/post";
import { PostLibrary } from "@/core/posts/library";
import { RemoteFavorites } from "@/core/boundary/ports/remote_favorites/remote_favorites";

const STREAM_BATCH_SIZE = 1_000;

export interface FavoritesReloaderDependencies {
  localFavorites: LocalFavorites;
  remoteFavorites: RemoteFavorites;
  collection: Pick<FavoritesCollection, "append" | "prependAsNew" | "getAll" | "clearTagCache">;
  index: Pick<FavoritesSearchIndex, "rebuild">;
  postLibrary: PostLibrary;
  report: (state: LoadState) => void;
}

export class FavoritesReloader {
  private readonly dependencies: FavoritesReloaderDependencies;

  constructor(dependencies: FavoritesReloaderDependencies) {
    this.dependencies = dependencies;
  }

  public async reload(localIds: string[]): Promise<LoadResult> {
    const { collection, index, postLibrary, report } = this.dependencies;
    const restored = await this.restore(localIds);
    let pulled: Post[] = [];

    report({ phase: "pulling" });

    try {
      pulled = await this.pullNew(localIds);
    } finally {
      report({ phase: "indexing" });
      index.rebuild(collection.getAll());
      collection.clearTagCache();
      postLibrary.refresh([...pulled, ...restored]).catch(console.error);
    }
    report({ phase: "pruning" });
    const removedCount = await this.pruneRemoved(pulled.length);
    return { pulledCount: pulled.length, removedCount };
  }

  private async restore(localIds: string[]): Promise<Post[]> {
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

  private async pullNew(localIds: string[]): Promise<Post[]> {
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

  private async pruneRemoved(pulledCount: number): Promise<number> {
    const { remoteFavorites, localFavorites } = this.dependencies;
    const idsBelowPulled = (await localFavorites.getAll()).slice(pulledCount);
    const removedIds = await remoteFavorites.findRemoved(idsBelowPulled, pulledCount);

    await localFavorites.remove(removedIds);
    return removedIds.length;
  }
}
