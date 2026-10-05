import { LoadResult, LoadState } from "@/core/features/favorites/types/load";
import { Favorite } from "@/core/features/favorites/types/favorite";
import { FavoritesDependencies } from "@/core/features/favorites/types/favorites";
import { FavoritesModel } from "@/core/features/favorites/model/model";
import { FavoritesPostLibrary } from "@/core/features/favorites/flows/load/post_library";
import { Post } from "@/core/domain/post/post";
import { SearchCriteria } from "@/core/features/favorites/types/search";

interface FetchProgress {
  loadedCount: number;
  expectedCount: number | null;
  isFetching: boolean;
}

export interface FavoritesFetcherDependencies extends Pick<FavoritesDependencies, "localFavorites" | "remoteFavorites"> {
  model: FavoritesModel;
  postLibrary: FavoritesPostLibrary;
  getSearchCriteria: () => SearchCriteria;
  report: (state: LoadState) => void;
}

export class FavoritesFetcher {
  private readonly dependencies: FavoritesFetcherDependencies;

  constructor(dependencies: FavoritesFetcherDependencies) {
    this.dependencies = dependencies;
  }

  public async fetchAll(): Promise<LoadResult> {
    const { remoteFavorites, localFavorites, model, report } = this.dependencies;
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
    await localFavorites.setAll([...model.getAllIds()]);
    return { pulledCount: 0, removedCount: 0 };
  }

  private async ingest(posts: Post[]): Promise<Favorite[]> {
    const { model, postLibrary, getSearchCriteria } = this.dependencies;
    const adopted = await postLibrary.adopt(posts);
    const favorites = model.append(adopted);

    model.addToIndex(favorites);
    model.appendMatches(favorites, getSearchCriteria());
    postLibrary.refresh(adopted).catch(console.error);
    return favorites;
  }
}
