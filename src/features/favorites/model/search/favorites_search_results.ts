import * as FavoritesSearchFilter from "./favorites_search_filter";
import * as FavoritesSorter from "./favorites_sorter";
import { Rating, SortingMethod } from "../../../../types/common_types";
import { FavoriteItem } from "../../types/favorite/favorite_item";
import { NewFavorites } from "../../types/favorite/favorite_types";
import { shuffleArray } from "../../../../utils/primitive/array";

let latestSearchResults: FavoriteItem[] = [];

export function invertSearchResults(allFavorites: FavoriteItem[]): FavoriteItem[] {
  const ids = new Set(latestSearchResults.map(f => f.id));
  const inverted = allFavorites.filter(f => !ids.has(f.id));
  const ratingFiltered = FavoritesSearchFilter.filterByRating(inverted);
  return (latestSearchResults = FavoritesSearchFilter.filterOutBlacklisted(ratingFiltered));
}

export function searchFavorites(allFavorites: FavoriteItem[], searchQuery?: string): FavoriteItem[] {
  FavoritesSearchFilter.setSearchQuery(searchQuery);
  return (latestSearchResults = FavoritesSorter.sortFavorites(FavoritesSearchFilter.filter(allFavorites)));
}

export function shuffleSearchResults(): FavoriteItem[] {
  return shuffleArray(latestSearchResults);
}

export function appendSearchResults(favorites: FavoriteItem[]): void {
  latestSearchResults = [...latestSearchResults, ...FavoritesSearchFilter.filter(favorites)];
}

export function prependSearchResults(newFavorites: FavoriteItem[]): NewFavorites {
  const newSearchResults = FavoritesSearchFilter.filter(newFavorites);

  latestSearchResults = [...newSearchResults, ...latestSearchResults];
  return { newFavorites, newSearchResults};
}

export const getLatestSearchResults = (): FavoriteItem[] => latestSearchResults;
export const setSortingMethod = (sortingMethod: SortingMethod): void => FavoritesSorter.setSortingMethod(sortingMethod);
export const setSortAscending = (value: boolean): void => FavoritesSorter.setSortAscending(value);
export const useBlacklist = (value: boolean): void => FavoritesSearchFilter.useBlacklist(value);
export const setAllowedRatings = (allowedRatings: Rating): void => FavoritesSearchFilter.setAllowedRatings(allowedRatings);
