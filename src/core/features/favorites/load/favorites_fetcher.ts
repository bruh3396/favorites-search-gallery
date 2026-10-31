import { Favorite } from "@/core/features/favorites/favorite";
import { FavoritesCollection } from "@/core/features/favorites/collection/favorites_collection";
import { FavoritesLoadResult } from "@/core/features/favorites/load/favorites_load_result";
import { FavoritesLoadState } from "@/core/features/favorites/load/favorites_load_state";
import { FavoritesSearchIndex } from "@/core/features/favorites/search/favorites_search_index";
import { LocalFavorites } from "@/core/boundary/ports/local_favorites/local_favorites";
import { Post } from "@/core/domain/post/post";
import { PostLibrary } from "@/core/features/favorites/load/post_library";
import { RemoteFavorites } from "@/core/boundary/ports/remote_favorites/remote_favorites";

interface MutableFetchProgress {
  loadedCount: number;
  expectedCount: number | null;
  isFetching: boolean;
}

export interface FavoritesFetcherDependencies {
  localFavorites: LocalFavorites;
  remoteFavorites: Pick<RemoteFavorites, "fetchCount" | "fetchAll">;
  favoritesCollection: Pick<FavoritesCollection, "append" | "getAllPostIds">;
  favoritesSearchIndex: Pick<FavoritesSearchIndex, "add">;
  postLibrary: PostLibrary;
  onFavoritesLoadStateChange: (favoritesLoadState: FavoritesLoadState) => void;
}

export class FavoritesFetcher {
  private readonly dependencies: FavoritesFetcherDependencies;

  constructor(dependencies: FavoritesFetcherDependencies) {
    this.dependencies = dependencies;
  }

  public async fetchAll(): Promise<FavoritesLoadResult> {
    const { remoteFavorites, localFavorites, favoritesCollection, onFavoritesLoadStateChange } = this.dependencies;
    const mutableFetchProgress: MutableFetchProgress = { loadedCount: 0, expectedCount: null, isFetching: true };
    const reportProgress = (): void => {
      if (mutableFetchProgress.isFetching) {
        onFavoritesLoadStateChange({ phase: "fetching", loadedCount: mutableFetchProgress.loadedCount, expectedCount: mutableFetchProgress.expectedCount });
      }
    };
    let appending = Promise.resolve();

    remoteFavorites.fetchCount()
      .then(count => {
        mutableFetchProgress.expectedCount = count;
        reportProgress();
      })
      .catch(() => undefined);
    reportProgress();

    try {
      await remoteFavorites.fetchAll(posts => {
        appending = appending.then(async() => {
          const favorites = await this.ingest(posts);

          mutableFetchProgress.loadedCount += favorites.length;
          reportProgress();
        });
      });
      await appending;
    } finally {
      mutableFetchProgress.isFetching = false;
    }
    onFavoritesLoadStateChange({ phase: "saving" });
    await localFavorites.setAll([...favoritesCollection.getAllPostIds()]);
    return { newCount: 0, unfavoritedCount: 0 };
  }

  private async ingest(posts: readonly Readonly<Post>[]): Promise<readonly Favorite[]> {
    const { favoritesCollection, favoritesSearchIndex, postLibrary } = this.dependencies;
    const adoptedPosts = await postLibrary.adopt(posts);
    const arenaFavorites = favoritesCollection.append(adoptedPosts);

    favoritesSearchIndex.add(arenaFavorites);
    postLibrary.refresh(adoptedPosts).catch(console.error);
    return arenaFavorites;
  }
}
