import * as FavoritesSearchFilter from "./favorites_search_filter";
import * as FavoritesSorter from "./favorites_sorter";
import { FavoriteItem } from "../../types/favorite_item";
import { shuffleArray } from "../../../../utils/primitives/array";

let latestSearchResults: FavoriteItem[] = [];

export function searchFavorites(allFavorites: FavoriteItem[], searchQuery?: string): FavoriteItem[] {
  FavoritesSearchFilter.setSearchQuery(searchQuery);
  return (latestSearchResults = FavoritesSorter.sortFavorites(FavoritesSearchFilter.filter(allFavorites)));
}

export function invertSearchResults(allFavorites: FavoriteItem[]): FavoriteItem[] {
  const ids = new Set(latestSearchResults.map(f => f.id));
  const inverted = allFavorites.filter(f => !ids.has(f.id));
  return (latestSearchResults = FavoritesSearchFilter.applyPostFilters(inverted));
}

export function shuffleSearchResults(): FavoriteItem[] {
  return (latestSearchResults = shuffleArray(latestSearchResults));
}

export function appendSearchResults(favorites: FavoriteItem[]): FavoriteItem[] {
  const newSearchResults = FavoritesSearchFilter.filter(favorites);

  latestSearchResults = [...latestSearchResults, ...newSearchResults];
  return newSearchResults;
}

export function prependSearchResults(newFavorites: FavoriteItem[]): FavoriteItem[] {
  const newSearchResults = FavoritesSearchFilter.filter(newFavorites);

  latestSearchResults = [...newSearchResults, ...latestSearchResults];
  return newSearchResults;
}

export const getLatestSearchResults = (): FavoriteItem[] => latestSearchResults;
export const onBlacklistChanged = (): void => FavoritesSearchFilter.onBlacklistChanged();

export function resetTagModifications(favorites: FavoriteItem[]): void {
  for (const favorite of favorites) {
    favorite.resetAdditionalTags();
  }
}
