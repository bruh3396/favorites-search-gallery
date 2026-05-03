import * as FavoritesSearchFilter from "./favorites_search_filter";
import * as FavoritesSorter from "./favorites_sorter";
import { Favorite } from "../../../../types/favorite";
import { shuffleArray } from "../../../../utils/collection/array";

let latestSearchResults: Favorite[] = [];

export function searchFavorites(allFavorites: Favorite[], searchQuery?: string): Favorite[] {
  FavoritesSearchFilter.setSearchQuery(searchQuery);
  return (latestSearchResults = FavoritesSorter.sortFavorites(FavoritesSearchFilter.filter(allFavorites)));
}

export function invertSearchResults(allFavorites: Favorite[]): Favorite[] {
  const ids = new Set(latestSearchResults.map(favorite => favorite.id));
  const inverted = allFavorites.filter(favorite => !ids.has(favorite.id));
  return (latestSearchResults = FavoritesSearchFilter.applyPostFilters(inverted));
}

export function shuffleSearchResults(): Favorite[] {
  return (latestSearchResults = shuffleArray(latestSearchResults));
}

export function appendSearchResults(favorites: Favorite[]): Favorite[] {
  const newSearchResults = FavoritesSearchFilter.filter(favorites);

  latestSearchResults = [...latestSearchResults, ...newSearchResults];
  return newSearchResults;
}

export function prependSearchResults(newFavorites: Favorite[]): Favorite[] {
  const newSearchResults = FavoritesSearchFilter.filter(newFavorites);

  latestSearchResults = [...newSearchResults, ...latestSearchResults];
  return newSearchResults;
}

export const getLatestSearchResults = (): Favorite[] => latestSearchResults;
export const onBlacklistChanged = (): void => FavoritesSearchFilter.onBlacklistChanged();
export const index = (favorites: Favorite[]): void => FavoritesSearchFilter.index(favorites);
export const deferSearchEngineIndexing = (): void => FavoritesSearchFilter.deferSearchEngineIndexing();
