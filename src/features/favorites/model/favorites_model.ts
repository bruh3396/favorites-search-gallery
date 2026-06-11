import * as FavoritesLoader from "@/features/favorites/model/load/loader";
import * as FavoritesMetadataFetcher from "@/features/favorites/model/metadata_fetcher";
import * as FavoritesPaginator from "@/features/favorites/model/paginator";
import * as FavoritesSearchCoordinator from "@/features/favorites/model/search/coordinator";
import { FavoritesModelCallbacks, NewFavorites } from "@/features/favorites/types/interfaces";
import { Favorite } from "@/types/favorite";
import { FavoriteItem } from "@/features/favorites/types/favorite_item";

let getAdditionalTags: (id: string) => string | undefined = () => undefined;
let waitForAdditionalTags: () => Promise<void> = () => Promise.resolve();

export function setup(callbacks: FavoritesModelCallbacks): void {
  getAdditionalTags = callbacks.getAdditionalTags;
  waitForAdditionalTags = callbacks.waitForAdditionalTags;
  FavoritesMetadataFetcher.setup(
    FavoritesLoader.updateFavorite,
    (favorite) => FavoritesSearchCoordinator.deIndex([favorite]),
    (favorite) => FavoritesSearchCoordinator.reIndex([favorite]),
    callbacks.onTagCategoriesResolved
  );
}

export async function loadDatabaseFavorites(): Promise<void> {
  await waitForAdditionalTags();
  return FavoritesLoader.loadDatabaseFavorites(getAdditionalTags, (allFavorites) => {
    FavoritesSearchCoordinator.deferIndexing();
    ingest(allFavorites);
  });
}

export function fetchAllFavorites(onSearchResultsFound: () => void): Promise<void> {
  return FavoritesLoader.fetchAllFavorites((favorites) => {
    ingest(favorites);
    FavoritesSearchCoordinator.appendResults(favorites);
    onSearchResultsFound();
  });
}

export function fetchNewFavorites(firstPageFavorites?: HTMLElement[]): Promise<NewFavorites> {
  return FavoritesLoader.fetchNewFavorites(firstPageFavorites)
    .then((newFavorites) => {
      ingest(newFavorites);
      return { newFavorites, newSearchResults: FavoritesSearchCoordinator.prependResults(newFavorites) };
    });
}

export const searchActiveFavorites = (searchQuery?: string): Favorite[] => FavoritesSearchCoordinator.searchFavorites(FavoritesLoader.getActiveFavorites(), searchQuery);
export const invertSearchResults = (): Favorite[] => FavoritesSearchCoordinator.invertResults(FavoritesLoader.getActiveFavorites());
export const setActiveFavorites = (): void => FavoritesLoader.setActiveFavorites(FavoritesSearchCoordinator.getCurrentSearchResults());
export const repaginateCurrentResults = (): Favorite[] => FavoritesPaginator.paginate(FavoritesSearchCoordinator.getCurrentSearchResults());

export * from "@/features/favorites/model/load/loader";
export * from "@/features/favorites/model/metadata_fetcher";
export * from "@/features/favorites/model/search/coordinator";
export * from "@/features/favorites/model/paginator";
export * from "@/features/favorites/model/infinite_scroller";

function ingest(favorites: FavoriteItem[]): void {
  FavoritesSearchCoordinator.reIndex(favorites);
  FavoritesMetadataFetcher.fetchMissingMetadata(favorites);
}
