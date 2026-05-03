import * as FavoritesLoader from "./load/favorites_loader";
import * as FavoritesMetadataFetcher from "./load/favorites_metadata_fetcher";
import * as FavoritesSearchState from "./search/favorites_search_coordinator";
import * as FavoritesTagModifier from "./tags/favorites_tag_modifier";
import { Favorite } from "../../../types/favorite";
import { NewFavorites } from "../type/favorite_types";

export function setupFavoritesModel(): void {
  FavoritesMetadataFetcher.initialize(FavoritesLoader.updateFavorite);
  FavoritesTagModifier.loadTagModifications();
}

export function loadDatabaseFavorites(): Promise<void> {
  return FavoritesLoader.loadDatabaseFavorites((allFavorites) => {
    FavoritesSearchState.deferSearchEngineIndexing();
    FavoritesSearchState.index(allFavorites);
    FavoritesMetadataFetcher.fetchMissingMetadata(allFavorites);
  });
}

export function fetchAllFavorites(onSearchResultsFound: () => void): Promise<void> {
  return FavoritesLoader.fetchAllFavorites((favorites) => {
    FavoritesSearchState.index(favorites);
    FavoritesMetadataFetcher.fetchMissingMetadata(favorites);
    FavoritesSearchState.appendSearchResults(favorites);
    onSearchResultsFound();
  });
}

export function fetchNewFavorites(): Promise<NewFavorites> {
  return FavoritesLoader.fetchNewFavorites()
    .then((newFavorites) => {
      FavoritesSearchState.index(newFavorites);
      FavoritesMetadataFetcher.fetchMissingMetadata(newFavorites);
      const newSearchResults = FavoritesSearchState.prependSearchResults(newFavorites);
      return { newFavorites, newSearchResults };
    });
}

export const searchFavorites = (searchQuery?: string): Favorite[] => FavoritesSearchState.searchFavorites(FavoritesLoader.getActiveFavorites(), searchQuery);
export const invertSearchResults = (): Favorite[] => FavoritesSearchState.invertSearchResults(FavoritesLoader.getActiveFavorites());
export const setActiveFavorites = (): void => FavoritesLoader.setActiveFavorites(FavoritesSearchState.getLatestSearchResults());
export const resetTagModifications = (): void => FavoritesTagModifier.resetAllFavoriteTags(FavoritesLoader.getAllFavorites());

export { hasFavorites, deleteDatabase, storeAllFavorites, getAllFavorites, storeNewFavorites, resetActiveFavorites, deleteFavorite, getFavorite } from "./load/favorites_loader";
export { getLatestSearchResults, onBlacklistChanged, shuffleSearchResults } from "./search/favorites_search_coordinator";
export { onDatabaseWritten } from "./load/favorites_metadata_fetcher";
export { loadTagModifications } from "./tags/favorites_tag_modifier";
export { setCustomTags } from "./tags/favorites_custom_tags";
