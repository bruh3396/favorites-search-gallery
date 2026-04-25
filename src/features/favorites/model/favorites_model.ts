import * as FavoritesLoader from "./load/favorites_loader";
import * as FavoritesSearchResults from "./search/favorites_search_results";
import * as FavoritesTagModifier from "./search/favorites_tag_modifier";
import { FAVORITES_SEARCH_INDEX } from "./search/favorites_search_index";
import { FavoriteItem } from "../types/favorite/favorite_item";
import { NewFavorites } from "../types/favorite/favorite_types";

export function fetchAllFavorites(onSearchResultsFound: () => void): Promise<void> {
  return FavoritesLoader.fetchAllFavorites((favorites) => {
    FavoritesSearchResults.appendSearchResults(favorites);
    onSearchResultsFound();
  });
}
export function fetchNewFavoritesOnReload(): Promise<NewFavorites> {
  return FavoritesLoader.fetchNewFavoritesOnReload().then(FavoritesSearchResults.prependSearchResults);
}
export const resetTagModifications = (): void => FavoritesTagModifier.resetTagModifications(FavoritesLoader.getAllFavorites());
export const setSearchSubset = (): void => FavoritesLoader.setSubset(FavoritesSearchResults.getLatestSearchResults());
export const searchFavorites = (searchQuery?: string): FavoriteItem[] => FavoritesSearchResults.searchFavorites(FavoritesLoader.getAllFavorites(), searchQuery);
export const invertSearchResults = (): FavoriteItem[] => FavoritesSearchResults.invertSearchResults(FavoritesLoader.getAllFavorites());

export const buildSearchIndexAsynchronously = (): Promise<void> => FAVORITES_SEARCH_INDEX.buildIndexAsynchronously();
export const buildSearchIndexSynchronously = (): void => FAVORITES_SEARCH_INDEX.buildIndexSynchronously();
export const keepIndexedTagsSorted = (): void => FAVORITES_SEARCH_INDEX.keepIndexedTagsSorted();

export * from "./load/favorites_loader";
export * from "./search/favorites_search_results";
export * from "../types/metadata/favorite_metadata";
