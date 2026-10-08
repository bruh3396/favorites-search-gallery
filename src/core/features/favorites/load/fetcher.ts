import { LoadResult, LoadState } from "@/core/features/favorites/load/state";
import { Favorite } from "@/core/features/favorites/favorite";
import { FavoritesCollection } from "@/core/features/favorites/collection/collection";
import { FavoritesSearchIndex } from "@/core/features/favorites/search/index";
import { LocalFavorites } from "@/core/boundary/ports/local_favorites/local_favorites";
import { Post } from "@/core/domain/post/post";
import { PostLibrary } from "@/core/posts/library";
import { RemoteFavorites } from "@/core/boundary/ports/remote_favorites/remote_favorites";

interface FetchProgress {
  loadedCount: number;
  expectedCount: number | null;
  isFetching: boolean;
}

export interface FavoritesFetcherDependencies {
  localFavorites: LocalFavorites;
  remoteFavorites: RemoteFavorites;
  collection: Pick<FavoritesCollection, "append" | "getAllIds" | "clearTagCache">;
  index: Pick<FavoritesSearchIndex, "add">;
  postLibrary: PostLibrary;
  report: (state: LoadState) => void;
}

export class FavoritesFetcher {
  private readonly dependencies: FavoritesFetcherDependencies;

  constructor(dependencies: FavoritesFetcherDependencies) {
    this.dependencies = dependencies;
  }

  public async fetchAll(): Promise<LoadResult> {
    const { remoteFavorites, localFavorites, collection, report } = this.dependencies;
    const progress: FetchProgress = { loadedCount: 0, expectedCount: null, isFetching: true };
    const reportProgress = (): void => {
      if (progress.isFetching) {
        report({ phase: "fetching", loadedCount: progress.loadedCount, expectedCount: progress.expectedCount });
      }
    };
    let appending = Promise.resolve();

    remoteFavorites.fetchCount()
      .then(count => {
        progress.expectedCount = count;
        reportProgress();
      })
      .catch(() => undefined);
    reportProgress();

    try {
      await remoteFavorites.fetchAll(posts => {
        appending = appending.then(async() => {
          const favorites = await this.ingest(posts);

          progress.loadedCount += favorites.length;
          reportProgress();
        });
      });
      await appending;
    } finally {
      progress.isFetching = false;
    }
    report({ phase: "saving" });
    await localFavorites.setAll([...collection.getAllIds()]);
    return { pulledCount: 0, removedCount: 0 };
  }

  private async ingest(posts: Post[]): Promise<Favorite[]> {
    const { collection, index, postLibrary } = this.dependencies;
    const adopted = await postLibrary.adopt(posts);
    const favorites = collection.append(adopted);

    index.add(favorites);
    collection.clearTagCache();
    postLibrary.refresh(adopted).catch(console.error);
    return favorites;
  }
}
