import * as FavoritesLoader from "./load/favorites_loader";
import * as FavoritesSearcher from "./search/favorites_searcher";
import { FAVORITES_SEARCH_INDEX } from "./search/favorites_search_index";
import { FavoriteItem } from "../types/favorite_item";
import { NewFavorites } from "../types/favorite_types";

export function fetchAllFavorites(onSearchResultsFound: () => void): Promise<void> {
  return FavoritesLoader.fetchAllFavorites((favorites) => {
    FavoritesSearcher.appendSearchResults(favorites);
    onSearchResultsFound();
  });
}

export function fetchNewFavorites(): Promise<NewFavorites> {
  return FavoritesLoader.fetchNewFavorites()
    .then((newFavorites) => {
      const newSearchResults = FavoritesSearcher.prependSearchResults(newFavorites);
      return {newFavorites, newSearchResults};
    });
}

export const searchFavorites = (searchQuery?: string): FavoriteItem[] => FavoritesSearcher.searchFavorites(FavoritesLoader.getActiveFavorites(), searchQuery);
export const invertSearchResults = (): FavoriteItem[] => FavoritesSearcher.invertSearchResults(FavoritesLoader.getActiveFavorites());
export const setSearchSubset = (): void => FavoritesLoader.setActiveFavorites(FavoritesSearcher.getLatestSearchResults());
export const resetTagModifications = (): void => FavoritesSearcher.resetTagModifications(FavoritesLoader.getActiveFavorites());

export const buildSearchIndexSync = (): void => FAVORITES_SEARCH_INDEX.buildIndexSync();
export const buildSearchIndexAsync = (): Promise<void> => FAVORITES_SEARCH_INDEX.buildIndexAsync();
export const keepSearchIndexTagsSorted = (): void => FAVORITES_SEARCH_INDEX.keepTagsSorted(true);

export { hasFavorites, deleteDatabase, loadAllFavoritesFromDatabase, storeAllFavorites, getAllFavorites, storeNewFavorites, resetActiveFavorites as stopSubset, deleteFavorite, updateFavoriteMetadata as updateMetadata } from "./load/favorites_loader";
export { getLatestSearchResults, onBlacklistChanged, shuffleSearchResults } from "./search/favorites_searcher";
export { onStartedStoringAllFavorites, updateMissingMetadata } from "../types/favorite_metadata";
export { loadTagModifications } from "./tags/favorites_tag_modifier";
