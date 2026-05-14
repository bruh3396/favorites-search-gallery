import * as FavoritesLoader from "./load/loader";
import * as FavoritesMetadataFetcher from "./metadata_fetcher";
import * as FavoritesPaginator from "./paginator";
import * as FavoritesSearchCoordinator from "./search/coordinator";
import { Favorite } from "../../../types/favorite";
import { NewFavorites } from "../types/favorite_types";

let getAdditionalTags: (id: string) => string | undefined = () => undefined;

export function setup(getAdditionalTagsFn: (id: string) => string | undefined): void {
  getAdditionalTags = getAdditionalTagsFn;
  FavoritesMetadataFetcher.setup(
    FavoritesLoader.updateFavorite,
    (favorite) => FavoritesSearchCoordinator.removeFromIndex([favorite]),
    (favorite) => FavoritesSearchCoordinator.addToIndex([favorite])
  );
}

export function loadDatabaseFavorites(): Promise<void> {
  return FavoritesLoader.loadDatabaseFavorites(getAdditionalTags, (allFavorites) => {
    FavoritesSearchCoordinator.deferIndexing();
    FavoritesSearchCoordinator.addToIndex(allFavorites);
    FavoritesMetadataFetcher.fetchMissingMetadata(allFavorites);
  });
}

export function fetchAllFavorites(onSearchResultsFound: () => void): Promise<void> {
  return FavoritesLoader.fetchAllFavorites((favorites) => {
    FavoritesSearchCoordinator.addToIndex(favorites);
    FavoritesMetadataFetcher.fetchMissingMetadata(favorites);
    FavoritesSearchCoordinator.appendSearchResults(favorites);
    onSearchResultsFound();
  });
}

export function fetchNewFavorites(): Promise<NewFavorites> {
  return FavoritesLoader.fetchNewFavorites()
    .then((newFavorites) => {
      FavoritesSearchCoordinator.addToIndex(newFavorites);
      FavoritesMetadataFetcher.fetchMissingMetadata(newFavorites);
      const newSearchResults = FavoritesSearchCoordinator.prependSearchResults(newFavorites);
      return { newFavorites, newSearchResults };
    });
}

export const searchFavorites = (searchQuery?: string): Favorite[] => FavoritesSearchCoordinator.searchFavorites(FavoritesLoader.getActiveFavorites(), searchQuery);
export const invertSearchResults = (): Favorite[] => FavoritesSearchCoordinator.invertSearchResults(FavoritesLoader.getActiveFavorites());
export const setActiveFavorites = (): void => FavoritesLoader.setActiveFavorites(FavoritesSearchCoordinator.getCurrentSearchResults());
export const repaginateCurrentResults = (): void => FavoritesPaginator.paginate(FavoritesSearchCoordinator.getCurrentSearchResults());

export * from "./load/loader";
export * from "./metadata_fetcher";
export * from "./search/coordinator";
export * from "./paginator";
export * from "./infinite_scroller";
