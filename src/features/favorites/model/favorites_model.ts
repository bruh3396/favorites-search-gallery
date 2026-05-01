import * as FavoritesLoader from "./load/favorites_loader";
import * as FavoritesSearchEngine from "./search/favorites_search_engine";
import * as FavoritesSearchResults from "./search/favorites_search_results";
import * as FavoritesTagModifier from "./tags/favorites_tag_modifier";
import { FavoriteItem } from "../type/favorite_item";
import { NewFavorites } from "../type/favorite_types";

export function setupFavoritesModel(): void {
  FavoritesSearchEngine.setup();
  FavoritesTagModifier.loadTagModifications();
}

export function fetchAllFavorites(onSearchResultsFound: () => void): Promise<void> {
  return FavoritesLoader.fetchAllFavorites((favorites) => {
    FavoritesSearchResults.appendSearchResults(favorites);
    onSearchResultsFound();
  });
}

export function fetchNewFavorites(): Promise<NewFavorites> {
  return FavoritesLoader.fetchNewFavorites()
    .then((newFavorites) => {
      const newSearchResults = FavoritesSearchResults.prependSearchResults(newFavorites);
      return {newFavorites, newSearchResults};
    });
}

export const searchFavorites = (searchQuery?: string): FavoriteItem[] => FavoritesSearchResults.searchFavorites(FavoritesLoader.getActiveFavorites(), searchQuery);
export const invertSearchResults = (): FavoriteItem[] => FavoritesSearchResults.invertSearchResults(FavoritesLoader.getActiveFavorites());
export const setSearchSubset = (): void => FavoritesLoader.setActiveFavorites(FavoritesSearchResults.getLatestSearchResults());
export const resetTagModifications = (): void => FavoritesSearchResults.resetTagModifications(FavoritesLoader.getActiveFavorites());

export const buildSearchIndexSync = (): void => FavoritesSearchEngine.buildIndexSync();
export const buildSearchIndexAsync = (): Promise<void> => FavoritesSearchEngine.buildIndexAsync();

export { hasFavorites, deleteDatabase, loadAllFavoritesFromDatabase, storeAllFavorites, getAllFavorites, storeNewFavorites, resetActiveFavorites as stopSubset, deleteFavorite, updateFavoriteMetadata as updateMetadata } from "./load/favorites_loader";
export { getLatestSearchResults, onBlacklistChanged, shuffleSearchResults } from "./search/favorites_search_results";
export { onStartedStoringAllFavorites, updateMissingMetadata, onFinishedStoringAllFavorites } from "../type/favorite_metadata";
export { loadTagModifications } from "./tags/favorites_tag_modifier";
