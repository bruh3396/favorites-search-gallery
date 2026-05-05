import * as FavoritesLoader from "./load/loader";
import * as FavoritesMetadataFetcher from "./load/metadata_fetcher";
import * as FavoritesSearchCoordinator from "./search/search_coordinator";
import { Favorite } from "../../../types/favorite";
import { NewFavorites } from "../types/favorite_types";
import { loadTagModifications } from "../../../lib/tags/tag_modifier";

export function setupFavoritesModel(): void {
  FavoritesMetadataFetcher.initialize(FavoritesLoader.updateFavorite);
  loadTagModifications();
}

export function loadDatabaseFavorites(): Promise<void> {
  return FavoritesLoader.loadDatabaseFavorites((allFavorites) => {
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
export const setActiveFavorites = (): void => FavoritesLoader.setActiveFavorites(FavoritesSearchCoordinator.getLatestSearchResults());

export * from "./load/loader";
export * from "./load/metadata_fetcher";
export * from "./search/search_coordinator";
