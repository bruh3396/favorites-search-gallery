import * as FavoritesResults from "./results";
import * as FavoritesSearchEngine from "./engine";
import * as FavoritesSorter from "./sorter";
import { NEGATED_BLACKLISTED_TAGS, USER_IS_ON_THEIR_OWN_FAVORITES_PAGE } from "../../../../lib/environment/favorites_metadata";
import { Favorite } from "../../../../types/favorite";
import { Preferences } from "../../../../lib/preferences/preferences";
import { SearchQuery } from "../../../../lib/search/query/search_query";

let currentSearchQuery = "";

export function searchFavorites(allFavorites: Favorite[], searchQuery?: string): Favorite[] {
  currentSearchQuery = searchQuery ?? currentSearchQuery;
  return FavoritesResults.set(FavoritesSorter.sortFavorites(search(allFavorites)));
}

export const appendSearchResults = (favorites: Favorite[]): void => FavoritesResults.append(search(favorites));
export const prependSearchResults = (newFavorites: Favorite[]): Favorite[] => FavoritesResults.prepend(search(newFavorites));
export const addToIndex = (favorites: Favorite[]): void => favorites.forEach(f => FavoritesSearchEngine.add(f));
export const removeFromIndex = (favorites: Favorite[]): void => favorites.forEach(f => FavoritesSearchEngine.remove(f));
export const getCurrentSearchQuery = (): string => currentSearchQuery;

export { invert as invertSearchResults, shuffle as shuffleSearchResults, get as getCurrentSearchResults } from "./results";
export { deferIndexing } from "./engine";

function buildQuery(): SearchQuery<Favorite> {
  const shouldUseBlacklist = !USER_IS_ON_THEIR_OWN_FAVORITES_PAGE || Preferences.excludeBlacklist.value;
  return new SearchQuery<Favorite>(shouldUseBlacklist ? `${currentSearchQuery} ${NEGATED_BLACKLISTED_TAGS}` : currentSearchQuery);
}

function search(favorites: Favorite[]): Favorite[] {
  return FavoritesSearchEngine.search(buildQuery(), favorites);
}
