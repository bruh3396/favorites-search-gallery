import * as FavoritesResults from "./results";
import * as FavoritesSearchEngine from "./engine";
import * as FavoritesSorter from "./sorter";
import { NEGATED_BLACKLISTED_TAGS, USER_IS_ON_THEIR_OWN_FAVORITES_PAGE } from "../../../../lib/environment";
import { Favorite } from "../../../../types/favorite";
import { Preferences } from "../../../../app/context/preferences";
import { SearchQuery } from "../../../../lib/search/query/search_query";

let currentSearchQuery = "";

export function searchFavorites(allFavorites: Favorite[], searchQuery?: string): Favorite[] {
  currentSearchQuery = searchQuery ?? currentSearchQuery;
  return FavoritesResults.set(FavoritesSorter.sortFavorites(search(allFavorites)));
}

export const invertSearchResults = (allFavorites: Favorite[]): Favorite[] => FavoritesResults.set(FavoritesSorter.sortFavorites(FavoritesResults.invert(allFavorites)));
export const appendSearchResults = (favorites: Favorite[]): void => FavoritesResults.append(search(favorites));
export const prependSearchResults = (newFavorites: Favorite[]): Favorite[] => FavoritesResults.prepend(search(newFavorites));
export const reIndex = (favorites: Favorite[]): void => favorites.forEach(f => FavoritesSearchEngine.add(f));
export const deIndex = (favorites: Favorite[]): void => favorites.forEach(f => FavoritesSearchEngine.remove(f));
export const getCurrentSearchQuery = (): string => currentSearchQuery;
export { shuffle as shuffleSearchResults, get as getCurrentSearchResults } from "./results";
export { deferIndexing } from "./engine";

const useBlacklist = (): boolean => !USER_IS_ON_THEIR_OWN_FAVORITES_PAGE || Preferences.excludeBlacklist.value;
const blacklistSearchQuery = (): string => `${currentSearchQuery} ${NEGATED_BLACKLISTED_TAGS}`;
const buildQuery = (): SearchQuery<Favorite> => new SearchQuery<Favorite>(useBlacklist() ? blacklistSearchQuery() : currentSearchQuery);
const search = (favorites: Favorite[]): Favorite[] => FavoritesSearchEngine.search(buildQuery(), favorites);
