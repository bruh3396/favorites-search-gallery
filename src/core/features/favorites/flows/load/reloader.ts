import { LoadResult, LoadState } from "@/core/features/favorites/types/load";
import { FavoritesDependencies } from "@/core/features/favorites/types/favorites";
import { FavoritesModel } from "@/core/features/favorites/model/model";
import { FavoritesPostLibrary } from "@/core/features/favorites/flows/load/post_library";
import { Post } from "@/core/domain/post/post";
import { SearchCriteria } from "@/core/features/favorites/types/search";

const STREAM_BATCH_SIZE = 1_000;

export interface FavoritesReloaderDependencies extends Pick<FavoritesDependencies, "localFavorites" | "remoteFavorites"> {
  model: FavoritesModel;
  postLibrary: FavoritesPostLibrary;
  getSearchCriteria: () => SearchCriteria;
  report: (state: LoadState) => void;
  waitForPaint: () => Promise<void>;
}

export class FavoritesReloader {
  private readonly dependencies: FavoritesReloaderDependencies;

  constructor(dependencies: FavoritesReloaderDependencies) {
    this.dependencies = dependencies;
  }

  public async reload(localIds: string[]): Promise<LoadResult> {
    const { model, postLibrary, getSearchCriteria, report, waitForPaint } = this.dependencies;
    const restored = await this.restore(localIds);
    let pulled: Post[] = [];

    report({ phase: "pulling" });

    try {
      pulled = await this.pullNew(localIds);
    } finally {
      report({ phase: "indexing" });
      await waitForPaint();
      model.indexAll();
      model.search(getSearchCriteria());
      postLibrary.refresh([...pulled, ...restored]).catch(console.error);
    }
    report({ phase: "pruning" });
    const removedCount = await this.pruneRemoved(pulled.length);
    return { pulledCount: pulled.length, removedCount };
  }

  private async restore(localIds: string[]): Promise<Post[]> {
    const { model, postLibrary, report } = this.dependencies;
    const restored: Post[] = [];
    const reportProgress = (): void => report({ phase: "restoring", loadedCount: restored.length, expectedCount: localIds.length });

    reportProgress();
    await postLibrary.stream(localIds, STREAM_BATCH_SIZE, posts => {
      model.append(posts);
      restored.push(...posts);
      reportProgress();
    });
    return restored;
  }

  private async pullNew(localIds: string[]): Promise<Post[]> {
    const { model, postLibrary, remoteFavorites, localFavorites } = this.dependencies;
    const pulled = await remoteFavorites.findNew(localIds);

    if (pulled.length === 0) {
      return [];
    }
    const adopted = await postLibrary.adopt(pulled);

    model.prependAsNew(adopted);
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
