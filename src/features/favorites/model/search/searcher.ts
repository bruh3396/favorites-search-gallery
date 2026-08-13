import * as FavoritesFilter from "@/features/favorites/model/search/filter";
import * as FavoritesResults from "@/features/favorites/model/search/results";
import * as FavoritesSearchEngine from "@/features/favorites/model/search/engine";
import * as FavoritesSorter from "@/features/favorites/model/search/sorter";
import { NEGATED_BLACKLISTED_TAGS, USER_IS_ON_THEIR_OWN_FAVORITES_PAGE } from "@/lib/environment";
import { Favorite } from "@/types/favorite";
import { Preferences } from "@/app/context/preferences";
import { chain } from "@/utils/function";

let currentSearchQuery = "";

export function setup(onSearchResultsChanged: (results: Favorite[]) => void): void {
  FavoritesResults.setup(onSearchResultsChanged);
}

export function search(favorites: Favorite[], searchQuery: string): Favorite[] {
  currentSearchQuery = searchQuery;
  return updateSearchResults(favorites);
}

export function reSearch(favorites: Favorite[]): Favorite[] {
  return updateSearchResults(favorites);
}

export function updateSearchResults(favorites: Favorite[]): Favorite[] {
  return FavoritesResults.set(FavoritesSorter.sort(findMatches(favorites)));
}

export function invertResults(allFavorites: Favorite[]): Favorite[] {
  return chain(
    FavoritesResults.invert(allFavorites),
    FavoritesFilter.filterByRating,
    FavoritesFilter.filterOutBlacklisted,
    FavoritesSorter.sort,
    FavoritesResults.set
  );
}
export const appendResults = (favorites: Favorite[]): Favorite[] => FavoritesResults.append(findMatches(favorites));
export const prependResults = (favorites: Favorite[]): Favorite[] => FavoritesResults.prepend(findMatches(favorites));
export const reIndex = (favorites: Favorite[]): void => favorites.forEach(f => FavoritesSearchEngine.add(f));
export const deIndex = (favorites: Favorite[]): void => favorites.forEach(f => FavoritesSearchEngine.remove(f));
export const getCurrentSearchQuery = (): string => currentSearchQuery;
export { shuffle as shuffleSearchResults, get as getCurrentSearchResults } from "@/features/favorites/model/search/results";
export { deferIndexing } from "@/features/favorites/model/search/engine";

const usingBlacklist = (): boolean => !USER_IS_ON_THEIR_OWN_FAVORITES_PAGE || Preferences.favorites.excludeBlacklist.value;
const blacklistSearchQuery = (): string => `${currentSearchQuery} ${NEGATED_BLACKLISTED_TAGS}`;
const finalSearchQuery = (): string => (usingBlacklist() ? blacklistSearchQuery() : currentSearchQuery);
const findMatches = (favorites: Favorite[]): Favorite[] => FavoritesFilter.filterByRating(FavoritesSearchEngine.search(finalSearchQuery(), favorites));
