import * as FavoritesResults from "@/features/favorites/model/search/results";
import * as FavoritesSearchEngine from "@/features/favorites/model/search/engine";
import * as FavoritesSorter from "@/features/favorites/model/search/sorter";
import { NEGATED_BLACKLISTED_TAGS, USER_IS_ON_THEIR_OWN_FAVORITES_PAGE } from "@/lib/environment";
import { Favorite } from "@/types/favorite";
import { Preferences } from "@/app/context/preferences";

let currentSearchQuery = "";

export function searchFavorites(allFavorites: Favorite[], searchQuery?: string): Favorite[] {
  currentSearchQuery = searchQuery ?? currentSearchQuery;
  return FavoritesResults.set(FavoritesSorter.sortFavorites(search(allFavorites)));
}

export const invertResults = (allFavorites: Favorite[]): Favorite[] => FavoritesResults.set(FavoritesSorter.sortFavorites(FavoritesResults.invert(allFavorites)));
export const appendResults = (favorites: Favorite[]): Favorite[] => FavoritesResults.append(search(favorites));
export const prependResults = (favorites: Favorite[]): Favorite[] => FavoritesResults.prepend(search(favorites));
export const reIndex = (favorites: Favorite[]): void => favorites.forEach(f => FavoritesSearchEngine.add(f));
export const deIndex = (favorites: Favorite[]): void => favorites.forEach(f => FavoritesSearchEngine.remove(f));
export const getCurrentSearchQuery = (): string => currentSearchQuery;
export { shuffle as shuffleSearchResults, get as getCurrentSearchResults } from "@/features/favorites/model/search/results";
export { deferIndexing } from "@/features/favorites/model/search/engine";

const useBlacklist = (): boolean => !USER_IS_ON_THEIR_OWN_FAVORITES_PAGE || Preferences.favorites.excludeBlacklist.value;
const blacklistSearchQuery = (): string => `${currentSearchQuery} ${NEGATED_BLACKLISTED_TAGS}`;
const finalQuery = (): string => (useBlacklist() ? blacklistSearchQuery() : currentSearchQuery);
const search = (favorites: Favorite[]): Favorite[] => FavoritesSearchEngine.search(finalQuery(), favorites);
